import {database} from '@/db';
import {getCurrentUser} from '@/lib/server/auth';
import {ok,err,readBody} from '@/lib/server/util';
type Focus={id:string;duration:number;remaining:number;deadline:number;status:string;created_at:number};
async function snapshot(userId:string,kind:string){
 const db=database(),now=Date.now();
 await db.prepare("UPDATE focus_sessions SET status='complete',remaining=0,updated_at=? WHERE user_id=? AND kind=? AND status='active' AND deadline<=?").bind(now,userId,kind,now).run();
 const session=await db.prepare('SELECT * FROM focus_sessions WHERE user_id=? AND kind=? ORDER BY created_at DESC LIMIT 1').bind(userId,kind).first<Focus>();
 const date=new Date(now+19800000);date.setUTCHours(0,0,0,0);const dayStart=date.getTime()-19800000;
 const stats=await db.prepare("SELECT count(*) AS sessionsToday,coalesce(sum(duration),0) AS minutesCompleted FROM focus_sessions WHERE user_id=? AND kind=? AND status='complete' AND updated_at>=?").bind(userId,kind,dayStart).first();
 return {session,stats};
}
export async function GET(req:Request){try{const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');const kind=new URL(req.url).searchParams.get('kind')||'solo';if(!['solo','duo'].includes(kind))return err(422,'kind','Invalid focus mode.');return ok(await snapshot(me.id,kind));}catch{return err(503,'storage','Could not load your timer.');}}
export async function POST(req:Request){try{const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');const b=await readBody(req);const kind=String(b.kind);if(!['solo','duo'].includes(kind))return err(422,'kind','Invalid focus mode.');const db=database(),now=Date.now();
 if(b.action==='start'){
  const duration=Number(b.duration);if(!Number.isInteger(duration)||duration<1||duration>180)return err(422,'duration','Choose 1–180 minutes.');
  await db.batch([db.prepare("UPDATE focus_sessions SET status='cancelled',updated_at=? WHERE user_id=? AND kind=? AND status IN ('active','paused')").bind(now,me.id,kind),db.prepare('INSERT INTO focus_sessions (id,user_id,kind,duration,remaining,deadline,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),me.id,kind,duration,duration*60,now+duration*60000,'active',now,now)]);
 }else{
 const state=await snapshot(me.id,kind);const s=state.session;if(!s)return err(404,'missing','No timer to update.');
 if(b.action==='pause')await db.prepare("UPDATE focus_sessions SET status='paused',remaining=?,updated_at=? WHERE id=? AND user_id=? AND status='active'").bind(Math.max(0,Math.ceil((s.deadline-now)/1000)),now,s.id,me.id).run();
 else if(b.action==='resume')await db.prepare("UPDATE focus_sessions SET status='active',deadline=?,updated_at=? WHERE id=? AND user_id=? AND status='paused'").bind(now+s.remaining*1000,now,s.id,me.id).run();
 else if(b.action==='reset')await db.prepare("UPDATE focus_sessions SET status='cancelled',updated_at=? WHERE id=? AND user_id=?").bind(now,s.id,me.id).run();
 else return err(422,'action','Unknown timer action.');
 }
 return ok(await snapshot(me.id,kind));
 }catch(e){console.error('focus',e);return err(503,'storage','Could not save the timer.');}}
