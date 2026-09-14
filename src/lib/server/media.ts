import { env } from 'cloudflare:workers';
import { database } from '@/db';
export function bucket():R2Bucket{const b=(env as unknown as {BUCKET?:R2Bucket}).BUCKET;if(!b)throw new Error('Media storage is unavailable.');return b;}
export async function storeMedia(dataUrl:string,ownerId:string,sessionId:string|null,purpose:'chat'|'report'){
 const match=/^data:([^,]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);if(!match)throw new Error('Invalid attachment.');
 const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));if(bytes.length>2097152||!bytes.length)throw new Error('Attachment must be between 1 byte and 2 MB.');
 const id=crypto.randomUUID(),key=`${purpose}/${ownerId}/${id}`;const store=bucket();
 await store.put(key,bytes,{httpMetadata:{contentType:match[1]}});
 try{await database().prepare('INSERT INTO media_files (id,owner_id,session_id,purpose,object_key,content_type,bytes,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,ownerId,sessionId,purpose,key,match[1],bytes.length,Date.now()).run();}
 catch(e){await store.delete(key);throw e;}
 return `/api/media/${id}`;
}
