import { database } from '@/db';
import { randomBytes, timingSafeEqual, pbkdf2Sync } from 'node:crypto';
const iterations=100000;
export function hashPassword(password:string){
 const salt=randomBytes(16).toString('hex');
 return `pbkdf2-sha256$${iterations}$${salt}$${pbkdf2Sync(password,salt,iterations,32,'sha256').toString('hex')}`;
}
export function verifyPassword(password:string,encoded:string){
 const [scheme,rounds,salt,expected]=encoded.split('$');
 if(scheme!=='pbkdf2-sha256'||Number(rounds)!==iterations||!salt||!expected||expected.length!==64)return false;
 const actual=pbkdf2Sync(password,salt,iterations,32,'sha256');
 return timingSafeEqual(actual,Buffer.from(expected,'hex'));
}
export function validPassword(p:unknown):p is string{return typeof p==='string'&&p.length>=12&&p.length<=128;}
// Atomic fixed-window limit survives Worker restarts and concurrent requests.
export async function allowPasswordAttempt(identifier:string){
 const now=Date.now(),cutoff=now-15*60000;
 const result=await database().prepare(`INSERT INTO login_attempts(identifier,attempts,window_start) VALUES(?,1,?)
 ON CONFLICT(identifier) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,
 window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts`).bind(identifier,now,cutoff,cutoff).first<{attempts:number}>();
 return !!result&&result.attempts<=10;
}
