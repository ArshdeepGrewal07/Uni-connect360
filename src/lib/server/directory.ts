import { database } from '@/db';
export const eligibleMembers=`visible=1 AND full_name!='Quad Team' AND id NOT IN
 (SELECT blocked_id FROM blocks WHERE blocker_id=? UNION SELECT blocker_id FROM blocks WHERE blocked_id=?)`;
export async function campusCounts(userId:string){
 const db=database();const results=await db.batch([
 db.prepare(`SELECT count(*) AS n FROM users WHERE (${eligibleMembers}) OR id=?`).bind(userId,userId,userId),
 db.prepare(`SELECT count(*) AS n FROM users WHERE ${eligibleMembers} AND id!=?`).bind(userId,userId,userId),
 db.prepare('SELECT count(*) AS n FROM vendors WHERE is_open=1'),
 db.prepare('SELECT count(*) AS n FROM events'),
 db.prepare('SELECT count(*) AS n FROM vendors')]);
 const n=(i:number)=>Number((results[i].results[0] as {n:number}).n);
 return {total:n(0),buddies:n(1),food:n(2),events:n(3),vendors:n(4)};
}
