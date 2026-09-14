import { database } from '@/db';
import type { SessionUser } from '@/lib/server/auth';
export const kinds=new Set(['beacons','pins','practice','games','equipment','posts','bounties','barters','market','food','culture','flash','schedules','lectures','projects','chai','duel_questions','quiet_spots','quests','flashcards','rooms','destinations','guardian_routes','leaderboard']);
export type RecordRow={id:string;kind:string;owner_id:string|null;data:string;sample:number;expires_at:number|null;version:number;created_at:number;updated_at:number};
export function project(row:RecordRow,me:SessionUser){
 const data=JSON.parse(row.data);const members=data._members||{};const mine=(action:string)=>!!members[action]?.[me.id];
 const names=(action:string)=>Object.values(members[action]||{});
 const result={...data,id:row.id,ownerId:row.owner_id,sample:!!row.sample,version:row.version,isMine:row.owner_id===me.id,joined:mine('join'),reserved:mine('reserve'),proposed:mine('propose'),voted:mine('vote'),hypeCount:names('hype').length};
 delete result._members;
 if(row.kind==='pins'){result.attendees=names('join');result.expiresAt=new Date(row.expires_at!).toISOString();}
 if(row.kind==='games')result.currentPlayers=names('join');
 if(row.kind==='posts'){result.upvotes=names('vote').length;result.hasUpvoted=mine('vote');result.createdMinsAgo=Math.max(0,Math.floor((Date.now()-row.created_at)/60000));}
 if(row.kind==='flash')result.attendeesCount=names('join').length;
 if(row.kind==='chai')result.acceptedCount=names('join').length;
 if(row.expires_at)result.expiresInMinutes=Math.max(0,Math.ceil((row.expires_at-Date.now())/60000));
 if(['bounties','equipment','practice'].includes(row.kind)&&row.expires_at&&row.expires_at<=Date.now()) {result.status=row.kind==='bounties'?'open':'available';delete result.claimedBy;delete result.borrowedBy;}
 return result;
}
export async function getRecord(id:string){return database().prepare('SELECT * FROM community_records WHERE id=?').bind(id).first<RecordRow>();}
