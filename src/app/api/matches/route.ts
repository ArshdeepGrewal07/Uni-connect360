import { database } from '@/db';
import { getCurrentUser } from '@/lib/server/auth';
import { ok,err } from '@/lib/server/util';
export async function GET(){try{
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');
 const rows=await database().prepare('SELECT id,full_name,course,academic_year,avatar_hue,interests FROM users WHERE visible=1 AND id<>? AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id=? UNION SELECT blocker_id FROM blocks WHERE blocked_id=?) LIMIT 100').bind(me.id,me.id,me.id).all<{id:string;full_name:string;course:string;academic_year:number;avatar_hue:number;interests:string}>();
 const matches=rows.results.map(u=>{const skills=JSON.parse(u.interests) as string[];const common=skills.filter(s=>me.interests.includes(s));return {id:u.id,name:u.full_name,course:u.course,year:u.academic_year,avatarHue:u.avatar_hue,theirSkills:skills,myRole:me.course,theirRole:u.course,matchScore:Math.min(100,common.length*20+(u.course===me.course?30:0)),rationale:common.length?`Shared interests: ${common.join(', ')}`:'Explore a different course or interest.',target:'Study collaboration'};}).sort((a,b)=>b.matchScore-a.matchScore);
 return ok({matches});
 }catch(e){console.error('matches',e);return err(503,'storage','Could not load student matches.');}}
