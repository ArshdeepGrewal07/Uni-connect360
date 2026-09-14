import { database } from '@/db';
import { ensureSeeded } from '@/db/seed';
import { getCurrentUser } from '@/lib/server/auth';
import { err,ok,readBody } from '@/lib/server/util';
import { kinds,project,getRecord,type RecordRow } from '@/lib/server/community';
const creatable=new Set(['beacons','pins','games','posts','bounties','barters','market','chai','projects','schedules']);
const allowed:Record<string,string[]>={beacons:['join'],pins:['join'],games:['join'],posts:['vote'],bounties:['claim'],barters:['propose'],market:['reserve'],food:['reserve'],culture:['hype'],flash:['join'],practice:['claim'],equipment:['borrow'],projects:['propose'],chai:['join'],lectures:['note'],schedules:['join']};
export async function GET(req:Request){try{
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in to see campus records.');await ensureSeeded();
 const kind=new URL(req.url).searchParams.get('kind')||'';if(!kinds.has(kind))return err(422,'kind','Unknown campus section.');
 const rows=await database().prepare("SELECT * FROM community_records WHERE kind=? AND (expires_at IS NULL OR expires_at>? OR kind IN ('practice','equipment')) ORDER BY created_at DESC,id LIMIT 300").bind(kind,Date.now()).all<RecordRow>();
 return ok({items:rows.results.map(r=>project(r,me))});
}catch(e){console.error('community read',e);return err(503,'storage','Campus records are unavailable. Retry shortly.');}}
export async function POST(req:Request){try{
 const me=await getCurrentUser();if(!me)return err(401,'no_session','Sign in to save changes.');const b=await readBody(req);const action=String(b.action||'');const db=database();
 if(action==='create'){
  const kind=String(b.kind||'');if(!creatable.has(kind))return err(403,'kind','This collection is managed by the campus administrator.');
  const input=(b.data&&typeof b.data==='object'&&!Array.isArray(b.data))?b.data as Record<string,unknown>:{};
  const fields:Record<string,string[]>={beacons:['subject','goal'],pins:['title','locationName','x','y','category','duration'],games:['sport','title','court','neededPlayers'],posts:['authorRoom','tag','content'],bounties:['dormCluster','title','deadline','reward'],barters:['offering','seeking','duration','note'],market:['dormLocation','title','category','price','condition'],chai:['activity','message','location','topic','text'],projects:['title','stack','description','lookingFor'],schedules:['day','time','recommendation']};
  const data:Record<string,unknown>={};for(const k of fields[kind])if(input[k]!==undefined)data[k]=input[k];
  const required:Record<string,string[]>={beacons:['subject','goal'],pins:['title','locationName','category'],games:['sport','title','court'],posts:['content','tag','authorRoom'],bounties:['title','dormCluster','deadline'],barters:['offering','seeking'],market:['title','category'],chai:['activity','location'],projects:['title','description'],schedules:['day','time']};
  if(required[kind].some(k=>typeof data[k]!=='string'||!String(data[k]).trim()))return err(422,'required','Complete the required fields.');
  const numeric=new Set(['price','reward','neededPlayers','x','y','duration']);
  if(Object.entries(data).some(([k,v])=>!numeric.has(k)&&typeof v!=='string'))return err(422,'type','Enter text in the text fields.');
  if(kind==='schedules')data.friends=[];
  if(JSON.stringify(data).length>12000)return err(413,'size','Keep the post below 12 KB.');
  if(!Object.values(data).some(v=>typeof v==='string'&&v.trim().length>=2))return err(422,'empty','Add a title or description.');
  for(const k of ['title','subject','content','offering','seeking'])if(k in data&&(typeof data[k]!=='string'||!String(data[k]).trim()))return err(422,'text','Complete the required text fields.');
  for(const k of ['price','reward','neededPlayers','x','y','duration'])if(k in data&&(!Number.isFinite(data[k])||Number(data[k])<0))return err(422,'number','Enter a valid positive number.');
  if(kind==='pins'&&(!Number.isFinite(data.x)||!Number.isFinite(data.y)||Number(data.x)>100||Number(data.y)>100||!['chai','gaming','study','sports'].includes(String(data.category))))return err(422,'pin','Choose a valid map location and category.');
  if(kind==='games'&&(!Number.isInteger(data.neededPlayers)||Number(data.neededPlayers)<2||Number(data.neededPlayers)>100))return err(422,'capacity','Choose between 2 and 100 players.');
  const id=crypto.randomUUID(),now=Date.now();const expiry=['pins','beacons','posts','chai'].includes(kind)?now+(kind==='posts'?360:Math.min(1440,Math.max(5,Number(data.duration)||60)))*60000:null;
  Object.assign(data,{id,creatorName:me.fullName,author:me.fullName,sellerName:me.fullName,avatarHue:me.avatarHue,avatarSeed:me.avatarHue,course:me.course,year:me.academicYear,status:kind==='bounties'?'open':'available',createdMinsAgo:0,replyCount:0});
  if(['pins','games'].includes(kind))data._members={join:{[me.id]:me.fullName.split(' ')[0]}};
  if(kind==='games')data.startsAt='Organising now';
  await db.prepare('INSERT INTO community_records (id,kind,owner_id,data,sample,expires_at,version,created_at,updated_at) VALUES (?,?,?,?,0,?,0,?,?)').bind(id,kind,me.id,JSON.stringify(data),expiry,now,now).run();
  return ok({item:project((await getRecord(id))!,me)},201);
 }
 const id=String(b.id||'');
 for(let attempt=0;attempt<4;attempt++){
  const row=await getRecord(id);if(!row)return err(404,'missing','Record not found.');
  if(action==='delete'){
   if(row.owner_id!==me.id)return err(403,'owner','Only the creator can delete this record.');
   await db.prepare('DELETE FROM community_records WHERE id=? AND owner_id=?').bind(id,me.id).run();return ok({deleted:true});
  }
  if(!allowed[row.kind]?.includes(action))return err(422,'action','This action is not available here.');
  if(row.expires_at&&row.expires_at<=Date.now()&&!['practice','equipment'].includes(row.kind))return err(410,'expired','This activity has expired.');
  const d=JSON.parse(row.data);const members=d._members||{};if(row.kind==='practice'&&row.expires_at&&row.expires_at<=Date.now())members.claim={};const group=members[action]||{};const already=!!group[me.id];
  if(already&&action!=='vote')return ok({item:project(row,me)});
  if(action==='note'){
   const text=String(b.text||'').trim();if(!text||text.length>2000)return err(422,'note','Write a note of 1–2,000 characters.');
   d.notes=[{id:crypto.randomUUID(),author:me.fullName,text,time:new Date().toISOString()},...(d.notes||[])].slice(0,200);
  }else{
   if(action==='vote'&&already)delete group[me.id];else group[me.id]=me.fullName.split(' ')[0];
   if(action==='join'&&row.kind==='games'&&Object.keys(group).length>Number(d.neededPlayers))return err(409,'full','This game is full.');
   if(['claim','borrow'].includes(action)||action==='reserve'&&row.kind==='market'){
    const available=['open','available'].includes(d.status)||(row.expires_at&&row.expires_at<=Date.now());
    if(!available)return err(409,'taken','Another student already claimed this item.');
    d.status=action==='borrow'?'borrowed':action==='reserve'?'reserved':'claimed';d.claimedBy=me.fullName.split(' ')[0];d.borrowedBy=me.fullName.split(' ')[0];
    if(row.kind==='practice')d.until=new Date(Date.now()+3600000).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'});
   }
   if(action==='reserve'&&row.kind==='food'){if(Number(d.platesLeft)<=0)return err(409,'sold_out','No portions remain.');d.platesLeft=Number(d.platesLeft)-1;}
   members[action]=group;d._members=members;
  }
  const token=crypto.randomUUID(),now=Date.now();const expiry=row.kind==='practice'?now+3600000:row.expires_at;
  const statements=[db.prepare('UPDATE community_records SET data=?,version=version+1,updated_at=?,mutation_token=?,expires_at=? WHERE id=? AND version=? RETURNING id').bind(JSON.stringify(d),now,token,expiry,id,row.version)];
  if(action==='vote'&&already)statements.push(db.prepare('DELETE FROM community_interactions WHERE record_id=? AND user_id=? AND action=? AND EXISTS (SELECT 1 FROM community_records WHERE id=? AND mutation_token=?)').bind(id,me.id,action,id,token));
  else statements.push(db.prepare('INSERT INTO community_interactions (id,record_id,user_id,action,created_at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM community_records WHERE id=? AND mutation_token=?) ON CONFLICT(record_id,user_id,action) DO UPDATE SET created_at=excluded.created_at').bind(crypto.randomUUID(),id,me.id,action,now,id,token));
  statements.push(db.prepare('INSERT INTO community_activity (id,record_id,user_id,action,data,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM community_records WHERE id=? AND mutation_token=?)').bind(crypto.randomUUID(),id,me.id,action,JSON.stringify(action==='note'?{text:String(b.text)}:{}),now,id,token));
  if(row.owner_id && row.owner_id!==me.id)statements.push(db.prepare('INSERT INTO notifications (id,user_id,actor_id,record_id,body,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM community_records WHERE id=? AND mutation_token=?)').bind(crypto.randomUUID(),row.owner_id,me.id,id,`${me.fullName}: ${action} on your ${row.kind} record.`,now,id,token));
  const result=await db.batch(statements);if(result[0].results.length)return ok({item:project((await getRecord(id))!,me)});
 }
 return err(409,'conflict','This item changed while saving. Please try again.');
}catch(e){console.error('community write',e);return err(503,'storage','Could not save. Please keep your input and retry.');}}
