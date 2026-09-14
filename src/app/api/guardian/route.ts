import { database } from '@/db';
import { getCurrentUser } from '@/lib/server/auth';
import { ok,err,readBody } from '@/lib/server/util';
export async function GET(){try{const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');const row=await database().prepare("SELECT * FROM guardian_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 1").bind(me.id).first<{route:string;status:string;deadline:number;id:string}>();return ok({session:row?{...row,route:JSON.parse(row.route)}:null});}catch{return err(503,'storage','Could not load your saved walk.');}}
export async function POST(req:Request){try{
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');const b=await readBody(req);const db=database();const now=Date.now();
 if(b.action==='start'){
  const route=await db.prepare("SELECT data FROM community_records WHERE id=? AND kind='guardian_routes'").bind(String(b.routeId)).first<{data:string}>();if(!route)return err(422,'route','Choose a route.');
  const data=JSON.parse(route.data);const duration=Math.max(1,Math.min(120,Number(data.durationMins)||12));const id=crypto.randomUUID();
  await db.batch([db.prepare("UPDATE guardian_sessions SET status='cancelled',updated_at=? WHERE user_id=? AND status IN ('active','alert')").bind(now,me.id),db.prepare('INSERT INTO guardian_sessions (id,user_id,route,status,deadline,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(id,me.id,route.data,'active',now+duration*60000,now,now)]);
  return ok({session:{id,route:data,status:'active',deadline:now+duration*60000}});
 }
 if(!['arrived','alert'].includes(String(b.action)))return err(422,'action','Invalid walk action.');
 const row=await db.prepare("UPDATE guardian_sessions SET status=?,updated_at=? WHERE id=? AND user_id=? AND status IN ('active','alert') RETURNING id,status,deadline,route").bind(b.action,now,String(b.id),me.id).first<{route:string}>();if(!row)return err(404,'missing','Active walk not found.');
 return ok({session:{...row,route:JSON.parse(row.route)},notice:'Check-in saved. No emergency contacts are notified by this app.'});
 }catch(e){console.error('guardian',e);return err(503,'storage','Could not save the walk. Please try again.');}}
