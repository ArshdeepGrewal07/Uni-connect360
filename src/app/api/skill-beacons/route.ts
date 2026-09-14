import {database} from '@/db';
import {getCurrentUser} from '@/lib/server/auth';
import {err,ok,readBody} from '@/lib/server/util';
export async function GET(){
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');
 const rows=await database().prepare(`SELECT b.id,b.user_id AS userId,b.kind,b.title,b.description,b.location,b.room,b.reward,b.x,b.y,b.expires_at AS expiresAt,b.created_at AS createdAt,u.full_name AS creatorName,
 (SELECT count(*) FROM skill_beacon_members m WHERE m.beacon_id=b.id) AS members,
 EXISTS(SELECT 1 FROM skill_beacon_members m WHERE m.beacon_id=b.id AND m.user_id=?) AS joined
 FROM skill_beacons b JOIN users u ON u.id=b.user_id WHERE b.expires_at>? AND b.user_id NOT IN
 (SELECT blocked_id FROM blocks WHERE blocker_id=? UNION SELECT blocker_id FROM blocks WHERE blocked_id=?) ORDER BY b.created_at DESC LIMIT 100`).bind(me.id,Date.now(),me.id,me.id).all();return ok({beacons:rows.results});
}
export async function POST(req:Request){
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');const b=await readBody(req),db=database(),now=Date.now();
 if(b.action==='create'){
  if(!['skill','bounty','hackathon','study'].includes(String(b.kind)))return err(422,'kind','Choose a beacon type.');
  for(const key of ['title','description','location','room','reward']){if(typeof b[key]!=='string'||String(b[key]).length>(key==='description'?1500:150))return err(422,'invalid','Check the beacon details.');}
  if(!String(b.title).trim()||!String(b.location).trim())return err(422,'title','Enter a title and location.');
  if(![b.x,b.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100)||typeof b.duration!=='number'||!Number.isInteger(b.duration)||b.duration<15||b.duration>1440)return err(422,'position','Choose a map location and a duration of 15–1,440 minutes.');
  const id=crypto.randomUUID();await db.batch([
   db.prepare('INSERT INTO skill_beacons(id,user_id,kind,title,description,location,room,reward,x,y,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,me.id,b.kind,String(b.title).trim(),b.description,b.location,b.room,b.reward,b.x,b.y,now+b.duration*60000,now),
   db.prepare('INSERT INTO skill_beacon_members(beacon_id,user_id,created_at) VALUES(?,?,?)').bind(id,me.id,now)]);return ok({id},201);
 }
 const id=String(b.id??''),row=await db.prepare('SELECT user_id,expires_at FROM skill_beacons WHERE id=?').bind(id).first<{user_id:string;expires_at:number}>();
 if(!row||row.expires_at<=now)return err(410,'expired','This beacon has expired. Refresh the map.');
 if(await db.prepare('SELECT id FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').bind(me.id,row.user_id,row.user_id,me.id).first())return err(403,'blocked','This beacon is unavailable.');
 if(b.action==='delete'){
  if(row.user_id!==me.id)return err(403,'not_owner','Only the creator can remove this beacon.');await db.prepare('DELETE FROM skill_beacons WHERE id=? AND user_id=?').bind(id,me.id).run();return ok({saved:true});
 }
 if(b.action==='join'){
  await db.prepare('INSERT OR IGNORE INTO skill_beacon_members(beacon_id,user_id,created_at) SELECT id,?,? FROM skill_beacons WHERE id=? AND expires_at>?').bind(me.id,now,id,now).run();return ok({saved:true});
 }
 if(b.action==='leave'){
  if(row.user_id===me.id)return err(422,'creator','Remove your beacon to end the meetup.');await db.prepare('DELETE FROM skill_beacon_members WHERE beacon_id=? AND user_id=?').bind(id,me.id).run();return ok({saved:true});
 }
 return err(422,'action','Unknown action.');
}
