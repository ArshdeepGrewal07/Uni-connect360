import {database} from '@/db';
import {getCurrentUser} from '@/lib/server/auth';
import {err,ok,readBody} from '@/lib/server/util';
import {seedCareer,getCareerProfile,keywordMatch,feedback} from '@/lib/server/career';
import {emptyCareerProfile,type CareerProfile} from '@/lib/career-types';
type Row={id:string;kind:string;owner_id:string|null;data:string;sample:number;closed:number};
export async function GET(req:Request){
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');
 await seedCareer();const db=database();
 const applicantFor=new URL(req.url).searchParams.get('applicants');
 if(applicantFor){
  const own=await db.prepare("SELECT id FROM career_catalog WHERE id=? AND owner_id=? AND kind='opportunities'").bind(applicantFor,me.id).first();if(!own)return err(403,'not_owner','Only the poster can view applicants.');
  const applicants=await db.prepare('SELECT a.user_id AS userId,u.full_name AS fullName,u.email,u.course,a.note,a.status FROM career_applications a JOIN users u ON u.id=a.user_id WHERE a.opportunity_id=? ORDER BY a.created_at DESC').bind(applicantFor).all();return ok({applicants:applicants.results});
 }
 const [catalog,progress,saved,apps,attempts]=await db.batch<Record<string,unknown>>([
 db.prepare('SELECT * FROM career_catalog ORDER BY created_at,id'),
 db.prepare('SELECT track_id,completed,version FROM career_progress WHERE user_id=?').bind(me.id),
 db.prepare('SELECT opportunity_id FROM career_saved WHERE user_id=?').bind(me.id),
 db.prepare('SELECT opportunity_id,status FROM career_applications WHERE user_id=?').bind(me.id),
 db.prepare('SELECT id,kind,target_id AS targetId,answer,feedback,created_at AS createdAt FROM career_attempts WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(me.id)]);
 const profile=await getCareerProfile(me.id);const rows=catalog.results as unknown as Row[];
 return ok({...profile,opportunities:rows.filter(r=>r.kind==='opportunities'&&(!r.closed||r.owner_id===me.id||apps.results.some(a=>a.opportunity_id===r.id))).map(r=>{
 const d=JSON.parse(r.data);const matched=(d.requirements as string[]).filter(k=>profile.profile.skills.some(s=>keywordMatch(s,k)));
 return {...d,id:r.id,ownerId:r.owner_id,sample:!!r.sample,closed:!!r.closed,match:d.requirements.length?Math.round(matched.length/d.requirements.length*100):null,matched,saved:saved.results.some(s=>s.opportunity_id===r.id),application:apps.results.find(a=>a.opportunity_id===r.id)?.status??null};
 }).sort((a,b)=>(b.match??0)-(a.match??0)),tracks:rows.filter(r=>r.kind==='tracks').map(r=>{const p=progress.results.find(x=>x.track_id===r.id);return {...JSON.parse(r.data),id:r.id,completed:p?JSON.parse(String(p.completed)):[],version:p?.version??-1,enrolled:!!p};}),questions:rows.filter(r=>r.kind==='questions').map(r=>({...JSON.parse(r.data),id:r.id})),attempts:attempts.results.map(a=>({...a,feedback:JSON.parse(String(a.feedback))}))});
}
export async function POST(req:Request){
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in first.');
 await seedCareer();const b=await readBody(req),db=database(),now=Date.now();
 if(b.action==='profile'){
  if(!b.profile||typeof b.profile!=='object'||Array.isArray(b.profile))return err(422,'invalid','Enter a valid profile.');
  const input=b.profile as Record<string,unknown>,profile={...emptyCareerProfile} as CareerProfile;
  for(const key of Object.keys(emptyCareerProfile) as (keyof CareerProfile)[]){if(key==='skills')continue;const v=input[key];if(typeof v!=='string'||v.length>(key==='resume'?12000:500))return err(422,'invalid','Check the profile fields and length.');profile[key]=v.trim();}
  if(!Array.isArray(input.skills)||input.skills.length>30||input.skills.some(s=>typeof s!=='string'||!s.trim()||s.length>60))return err(422,'skills','Enter up to 30 skills, each under 60 characters.');
  profile.skills=[...new Set((input.skills as string[]).map(s=>s.trim()))];
  for(const [key,max] of [['cgpa',10],['cgpaGoal',10],['attendance',100],['internshipHours',100000],['internshipGoal',100000]] as const){const v=profile[key];if(v!==''&&(!Number.isFinite(Number(v))||Number(v)<0||Number(v)>max))return err(422,'invalid',`Check ${key}.`);}
  if(!Number.isInteger(b.version))return err(422,'version','Reload the profile first.');
  const result=b.version===-1?await db.prepare('INSERT OR IGNORE INTO career_profiles(user_id,data,version,updated_at) VALUES(?,?,0,?)').bind(me.id,JSON.stringify(profile),now).run():await db.prepare('UPDATE career_profiles SET data=?,version=version+1,updated_at=? WHERE user_id=? AND version=?').bind(JSON.stringify(profile),now,me.id,b.version).run();
  if(result.meta.changes!==1)return err(409,'stale','Profile changed elsewhere. Reload before saving.');return ok({saved:true});
 }
 if(b.action==='create-opportunity'){
  const data:Record<string,unknown>={};for(const key of ['title','company','type','category','stipend','description']){if(typeof b[key]!=='string'||!String(b[key]).trim()||String(b[key]).length>(key==='description'?2000:120))return err(422,'invalid','Complete all opportunity fields.');data[key]=String(b[key]).trim();}
  if(!Array.isArray(b.requirements)||!b.requirements.length||b.requirements.length>15||b.requirements.some(v=>typeof v!=='string'||!v.trim()||v.length>60))return err(422,'requirements','Add 1–15 required skills.');
  data.requirements=[...new Set(b.requirements.map(s=>String(s).trim()))];const id=crypto.randomUUID();await db.prepare("INSERT INTO career_catalog(id,kind,owner_id,data,sample,created_at) VALUES(?,'opportunities',?,?,0,?)").bind(id,me.id,JSON.stringify(data),now).run();return ok({id},201);
 }
 const id=String(b.id??'');const row=await db.prepare('SELECT * FROM career_catalog WHERE id=?').bind(id).first<Row>();if(!row)return err(404,'not_found','Record not found.');const data=JSON.parse(row.data);
 if(b.action==='bookmark'&&row.kind==='opportunities'){
  if(typeof b.saved!=='boolean')return err(422,'invalid','Choose save or unsave.');
  if(b.saved)await db.prepare('INSERT OR IGNORE INTO career_saved(user_id,opportunity_id) VALUES(?,?)').bind(me.id,id).run();else await db.prepare('DELETE FROM career_saved WHERE user_id=? AND opportunity_id=?').bind(me.id,id).run();return ok({saved:b.saved});
 }
 if(b.action==='apply'&&row.kind==='opportunities'){
  if(row.closed)return err(409,'closed','This opportunity is closed.');if(row.owner_id===me.id)return err(422,'own','You cannot apply to your own listing.');
  if(b.consent!==true||typeof b.note!=='string'||b.note.trim().length<10||b.note.length>4000)return err(422,'application','Add a short application note and consent to share your profile with the poster.');
  await db.prepare("INSERT OR IGNORE INTO career_applications(user_id,opportunity_id,note,status,created_at) VALUES(?,?,?,'Pending',?)").bind(me.id,id,b.note.trim(),now).run();return ok({saved:true,sample:!!row.sample});
 }
 if(b.action==='close-opportunity'&&row.kind==='opportunities'){
  if(row.owner_id!==me.id)return err(403,'not_owner','Only the poster can close it.');await db.prepare('UPDATE career_catalog SET closed=1 WHERE id=? AND owner_id=?').bind(id,me.id).run();return ok({saved:true});
 }
 if(b.action==='review-application'&&row.kind==='opportunities'){
  if(row.owner_id!==me.id)return err(403,'not_owner','Only the poster can review applications.');if(!['Accepted','Declined','Pending'].includes(String(b.status)))return err(422,'invalid','Choose an application status.');
  const result=await db.prepare('UPDATE career_applications SET status=? WHERE opportunity_id=? AND user_id=?').bind(b.status,id,String(b.userId??'')).run();return result.meta.changes?ok({saved:true}):err(404,'not_found','Application not found.');
 }
 if(b.action==='progress'&&row.kind==='tracks'){
  if(!Array.isArray(b.completed)||b.completed.some(i=>!Number.isInteger(i)||Number(i)<0||Number(i)>=data.modules.length)||!Number.isInteger(b.version))return err(422,'invalid','Check module progress.');
  const completed=JSON.stringify([...new Set(b.completed)].sort());const result=b.version===-1?await db.prepare('INSERT OR IGNORE INTO career_progress(user_id,track_id,completed,version,updated_at) VALUES(?,?,?,0,?)').bind(me.id,id,completed,now).run():await db.prepare('UPDATE career_progress SET completed=?,version=version+1,updated_at=? WHERE user_id=? AND track_id=? AND version=?').bind(completed,now,me.id,id,b.version).run();
  return result.meta.changes?ok({saved:true}):err(409,'stale','Progress changed elsewhere. Refresh to continue.');
 }
 if((b.action==='resume-check'&&row.kind==='opportunities')||(b.action==='interview'&&row.kind==='questions')){
  if(typeof b.answer!=='string'||b.answer.trim().length<20||b.answer.length>12000)return err(422,'answer','Enter 20–12,000 characters to evaluate.');
  const requirements=b.action==='resume-check'?data.requirements:(data.concepts as string[][]).map(c=>c.join('/'));const result=feedback(b.answer,requirements);
  await db.prepare('INSERT INTO career_attempts(id,user_id,kind,target_id,answer,feedback,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),me.id,b.action,id,b.answer,JSON.stringify(result),now).run();return ok({feedback:result});
 }
 return err(422,'action','Action does not apply to this record.');
}
