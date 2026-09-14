import {database} from '@/db';
import {getCurrentUser} from '@/lib/server/auth';
import {campusCounts,eligibleMembers} from '@/lib/server/directory';
import {err,ok} from '@/lib/server/util';
export async function GET(req:Request){
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');
 const rawOffset=Number(new URL(req.url).searchParams.get('offset')||0);
 const offset=Number.isSafeInteger(rawOffset)&&rawOffset>=0?rawOffset:0;
 const members=await database().prepare(`SELECT id,full_name AS fullName,CASE WHEN is_demo=1 OR id=? THEN reg_id ELSE NULL END AS regId,course,academic_year AS academicYear,is_demo AS isDemo,
 CASE WHEN is_demo=1 OR id=? THEN email ELSE NULL END AS email,
 CASE WHEN is_demo=1 OR id=? THEN phone_number ELSE NULL END AS mobile
 FROM users WHERE (${eligibleMembers}) OR id=? ORDER BY reg_id,id LIMIT 50 OFFSET ?`).bind(me.id,me.id,me.id,me.id,me.id,me.id,offset).all();
 const counts=await campusCounts(me.id);
 return ok({members:members.results,counts,nextOffset:offset+members.results.length<counts.total?offset+members.results.length:null});
}
