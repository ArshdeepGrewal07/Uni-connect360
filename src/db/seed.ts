import { database } from '@/db';
import core from './core-seed.json';
import catalog from './community-seed.json';
import credentials from './demo-credentials.json';
export async function ensureDemoCredentials(){
 if(process.env.DEMO_MODE!=='true')return;
 const db=database();
 if(await db.prepare('SELECT id FROM seed_versions WHERE id=?').bind('demo-passwords-v1').first())return;
 await db.batch(credentials.map(c=>db.prepare('INSERT OR IGNORE INTO user_credentials(user_id,password_hash,updated_at) SELECT id,?,? FROM users WHERE id=? AND is_demo=1').bind(c.hash,Date.now(),c.userId)));
 await db.prepare('INSERT OR IGNORE INTO seed_versions(id,applied_at) VALUES(?,?)').bind('demo-passwords-v1',Date.now()).run();
}
export async function ensureSeeded() {
  const db=database();
  if(await db.prepare('SELECT id FROM seed_versions WHERE id = ?').bind('catalog-v1').first()) return;
  const now=Date.now(); const statements:D1PreparedStatement[]=[];
  // Deterministic IDs and INSERT OR IGNORE make initialization retryable across Workers.
  if(process.env.DEMO_MODE === 'true') {
    core.DEMO_USERS.forEach((u,i)=>statements.push(db.prepare('INSERT OR IGNORE INTO users (id,full_name,reg_id,email,mobile,gender,course,academic_year,interests,looking_for,avatar_hue,visible,is_demo,is_restricted,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(`demo-user-${i}`,u.fullName,`REG-D-${1001+i}`,`student${i}@demo.campus.ac.in`,`900000${1000+i}`,u.gender,u.course,u.academicYear,JSON.stringify(u.interests),u.lookingFor,u.avatarHue,1,1,0,now)));
  }
  core.placeDefs.forEach((p,i)=>statements.push(db.prepare('INSERT OR IGNORE INTO places (id,name,kind,x,y) VALUES (?,?,?,?,?)').bind(`place-${i}`,p.name,p.kind,p.x,p.y)));
  core.vendorDefs.forEach((v,i)=>statements.push(db.prepare('INSERT OR IGNORE INTO vendors (id,name,blurb,is_open,image,top_dish,x,y,menu) VALUES (?,?,?,?,?,?,?,?,?)').bind(`vendor-${i}`,v.name,v.blurb,Number(v.isOpen),v.image,v.topDish,v.x,v.y,JSON.stringify(v.menu))));
  core.eventDefs.forEach((e,i)=>statements.push(db.prepare('INSERT OR IGNORE INTO events (id,title,description,location,starts_at,tag,image) VALUES (?,?,?,?,?,?,?)').bind(`event-${i}`,e.title,e.description,e.location,Date.parse(e.startsAt),e.tag,e.image)));
  for(const [kind,items] of Object.entries(catalog)) for(const item of items) {
    const data:Record<string,unknown>={...item};
    if(kind==='practice'){ data.status='available'; delete data.claimedBy; delete data.until; }
    if(kind==='games')data.currentPlayers=[];
    if(kind==='pins'){data.attendees=[];data.expiresAt=new Date(now+86400000).toISOString();}
    if(kind==='posts'){data.upvotes=0;data.hasUpvoted=false;}
    if(kind==='flash')data.attendeesCount=0;
    const expiry=['pins','beacons','posts','chai','flash'].includes(kind)?now+86400000:null;
    statements.push(db.prepare('INSERT OR IGNORE INTO community_records (id,kind,owner_id,data,sample,expires_at,version,created_at,updated_at) VALUES (?,?,NULL,?,1,?,0,?,?)').bind(`${kind}:${item.id}`,kind,JSON.stringify({...data,id:`${kind}:${item.id}`}),expiry,now,now));
  }
  // Bounded, retry-safe batches. Marker written only after every catalog row succeeds.
  for(let i=0;i<statements.length;i+=60) await db.batch(statements.slice(i,i+60));
  await db.prepare('INSERT OR IGNORE INTO seed_versions (id,applied_at) VALUES (?,?)').bind('catalog-v1',now).run();
}
export async function syncVendors(){ await ensureSeeded(); }
export async function seedStarterChats(_userId:string){ /* New accounts start with genuine, empty conversations. */ }

export async function ensureContactFields(){
 const db=database();
 if(await db.prepare('SELECT id FROM seed_versions WHERE id=?').bind('optional-phone-v1').first())return;
 await db.batch([
 db.prepare("UPDATE users SET phone_number=mobile WHERE phone_number IS NULL AND mobile NOT LIKE 'email:%'"),
 db.prepare('INSERT OR IGNORE INTO seed_versions(id,applied_at) VALUES(?,?)').bind('optional-phone-v1',Date.now())]);
}
