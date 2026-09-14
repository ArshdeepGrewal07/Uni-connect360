import { database } from '@/db';
import { getCurrentUser } from '@/lib/server/auth';
import { ok,err,readBody } from '@/lib/server/util';
const keys=new Set(['mode','focusMinutes','focusStats','quests','xp','streak','goals','pairTasks','myScore','partnerScore','guardian','activeSound','timer','schedule','notificationSettings']);
export async function GET(req:Request){
 try{const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in to load your saved progress.');
 const key=new URL(req.url).searchParams.get('key')||'';if(!keys.has(key))return err(422,'key','Unknown preference.');
 const row=await database().prepare('SELECT value,version FROM user_preferences WHERE user_id=? AND key=?').bind(me.id,key).first<{value:string;version:number}>();
 return ok({value:row?JSON.parse(row.value):null,version:row?.version??-1});
 }catch(e){console.error('preferences read',e);return err(503,'storage','Saved progress is unavailable. Please retry.');}
}
export async function PUT(req:Request){
 try{const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in to save progress.');const b=await readBody(req);
 const key=String(b.key||'');const value=JSON.stringify(b.value);if(!keys.has(key)||!value||value.length>32000||!Number.isInteger(b.version))return err(422,'input','Invalid saved progress.');
 if(key==='mode'&&!['solo','duo','group'].includes(String(b.value)))return err(422,'mode','Choose a campus mode.');
 const row=await database().prepare('INSERT INTO user_preferences (user_id,key,value,version,updated_at) SELECT ?,?,?,0,? WHERE ? = -1 ON CONFLICT(user_id,key) DO NOTHING RETURNING version').bind(me.id,key,value,Date.now(),b.version).first();
 if(row)return ok(row);
 const updated=await database().prepare('UPDATE user_preferences SET value=?,version=version+1,updated_at=? WHERE user_id=? AND key=? AND version=? RETURNING version').bind(value,Date.now(),me.id,key,b.version).first();
 return updated?ok(updated):err(409,'conflict','Your progress changed on another device. Reload and try again.');
 }catch(e){console.error('preferences write',e);return err(503,'storage','Could not save progress. Your input is still available.');}
}
