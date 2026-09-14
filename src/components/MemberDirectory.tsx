"use client";
import {useEffect,useState} from 'react';
import {api} from '@/lib/client';
type Member={id:string;fullName:string;regId:string|null;course:string;academicYear:number;email:string|null;mobile:string|null;isDemo:number};
type Page={members:Member[];counts:{total:number;buddies:number;food:number;vendors:number};nextOffset:number|null};
export function MemberDirectory(){
 const [data,setData]=useState<Page|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(offset=0){setBusy(true);setError('');try{const next=await api<Page>('/api/directory?offset='+offset);setData(old=>({...next,members:offset&&old?[...old.members,...next.members]:next.members}));}catch(e){setError(e instanceof Error?e.message:'Could not load members.');}finally{setBusy(false);}}
 useEffect(()=>{let active=true;api<Page>('/api/directory').then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Could not load members.');});return()=>{active=false;};},[]);
 return <div className="max-h-[70dvh] overflow-y-auto space-y-3">
 <h3 className="font-display font-bold text-ink">Member directory</h3>
 <p className="text-xs text-ink-soft">{data?`${data.counts.total} members including you · ${data.counts.buddies} discoverable buddies · ${data.counts.food} of ${data.counts.vendors} cafés open`:'Loading records…'}</p>
 <p className="text-xs text-ink-faint">Sample accounts have illustrative email IDs and phone numbers, not verified inboxes or contact numbers. Other members’ private contacts are hidden.</p>
 {error&&<p role="alert" className="text-xs text-clay">{error} <button onClick={()=>load()} className="underline">Retry</button></p>}
 {data?.members.map(m=><article key={m.id} className="rounded-xl border border-line bg-cream p-3 text-xs space-y-1">
 <p className="font-bold text-ink">{m.fullName} {m.isDemo?'· Sample':''}</p><p>{m.regId ? m.regId+" · " : ""}{m.course} · Year {m.academicYear}</p>
 {m.email&&<p className="break-all">Email: {m.email}</p>}{m.mobile&&<p>Phone: {m.mobile}</p>}
 </article>)}
 {data?.nextOffset!=null&&<button disabled={busy} onClick={()=>load(data.nextOffset!)} className="rounded-xl bg-pine p-3 text-cream">{busy?'Loading…':'Load more members'}</button>}
 </div>;
}
