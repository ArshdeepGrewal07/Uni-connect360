import { database } from '@/db';
import { getCurrentUser } from '@/lib/server/auth';
import { bucket } from '@/lib/server/media';
import { err } from '@/lib/server/util';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 try{const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in to open this file.');const {id}=await params;const db=database();
 const file=await db.prepare('SELECT * FROM media_files WHERE id=?').bind(id).first<{owner_id:string;session_id:string|null;object_key:string;purpose:string}>();if(!file)return err(404,'missing','File not found.');
 if(file.purpose==='report'&&file.owner_id!==me.id)return err(403,'private','This evidence is private.');
 if(file.purpose==='chat'){
 const session=await db.prepare('SELECT id FROM chat_sessions WHERE id=? AND (initiator_id=? OR receiver_id=?)').bind(file.session_id,me.id,me.id).first();if(!session)return err(403,'private','This file belongs to another conversation.');
 }
 const object=await bucket().get(file.object_key,{range:req.headers});if(!object)return err(404,'missing','File not found.');const headers=new Headers();object.writeHttpMetadata(headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Accept-Ranges','bytes');
 let status=200;if(req.headers.has('range')&&object.range&&'offset' in object.range&&'length' in object.range){headers.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset!+object.range.length!-1}/${object.size}`);status=206;}
 return new Response(object.body,{headers,status});
 }catch(e){console.error('media read',e);return err(503,'storage','File storage is unavailable. Retry shortly.');}
}
