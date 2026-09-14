import {database} from '@/db';
import seed from '@/db/career-seed.json';
import {emptyCareerProfile,type CareerProfile,type Feedback} from '@/lib/career-types';
export async function seedCareer(){
 const db=database();if(await db.prepare('SELECT id FROM seed_versions WHERE id=?').bind('career-v1').first())return;
 const statements=Object.entries(seed).flatMap(([kind,items])=>items.map(data=>db.prepare('INSERT OR IGNORE INTO career_catalog(id,kind,data,sample,created_at) VALUES(?,?,?,1,?)').bind(data.id,kind,JSON.stringify(data),Date.now())));
 await db.batch([...statements,db.prepare('INSERT OR IGNORE INTO seed_versions(id,applied_at) VALUES(?,?)').bind('career-v1',Date.now())]);
}
export function normalize(value:string){return value.toLowerCase().replace(/\.(?=\s|$)/g,' ').replace(/[^a-z0-9+#.]+/g,' ').replace(/\s+/g,' ').trim();}
export function keywordMatch(text:string,keyword:string){
 const hay=' '+normalize(text)+' ';
 return keyword.split('/').some(k=>{const needle=normalize(k);return !!needle&&hay.includes(' '+needle+' ');});
}
export function feedback(text:string,requirements:string[]):Feedback{
 const matched=requirements.filter(k=>keywordMatch(text,k)),missing=requirements.filter(k=>!matched.includes(k));
 return {score:requirements.length?Math.round(matched.length/requirements.length*100):0,matched,missing,note:'Keyword coverage only. This is a practice aid, not an AI evaluation, verified skill rating or hiring guarantee.'};
}
export async function getCareerProfile(userId:string){
 const row=await database().prepare('SELECT data,version FROM career_profiles WHERE user_id=?').bind(userId).first<{data:string;version:number}>();
 return {profile:row?{...emptyCareerProfile,...JSON.parse(row.data)} as CareerProfile:{...emptyCareerProfile},version:row?.version??-1};
}
