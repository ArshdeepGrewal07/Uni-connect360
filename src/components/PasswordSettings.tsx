"use client";
import {useState} from 'react';
import {api} from '@/lib/client';
export function PasswordSettings(){
 const [currentPassword,setCurrent]=useState(''),[password,setPassword]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 return <form className="rounded-2xl border border-line bg-paper p-4 space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);setStatus('');try{await api('/api/auth',{method:'POST',body:JSON.stringify({action:'set-password',currentPassword,password})});setCurrent('');setPassword('');setStatus('Password saved. Other sessions were signed out.');}catch(e){setStatus(e instanceof Error?e.message:'Could not save.');}finally{setBusy(false);}}}>
 <h3 className="font-display font-bold text-ink">Account password</h3>
 <label className="block text-xs">Current password (leave empty only if none is set)<input type="password" autoComplete="current-password" maxLength={128} value={currentPassword} onChange={e=>setCurrent(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-cream p-3"/></label>
 <label className="block text-xs">New password (12–128 characters)<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-cream p-3"/></label>
 <button disabled={busy} className="rounded-xl bg-pine px-4 py-2 text-xs font-bold text-cream">{busy?'Saving…':'Save password'}</button>
 <p role="status" className="text-xs text-ink-soft">{status}</p>
 </form>;
}
