"use client";
import {useState} from 'react';
import {api} from '@/lib/client';
import type {MeData} from '@/lib/types';
import {IconLayers,IconChevronLeft} from '@/components/icons';
const COURSES = [
  "BCA", "BCA AI & ML", "BCA Cyber Security", "MCA",
  "B.Tech AI & ML", "B.Tech IT", "B.Tech Civil", "B.Tech Electrical",
  "B.Tech Biotechnology", "M.Tech", "MBA", "B.Pharm", "M.Pharm",
  "B.Sc Agriculture", "B.Sc Computer Science", "B.Sc Mathematics",
  "B.Sc Chemistry", "B.Sc Nursing", "BPT", "BHMCT", "B.A.",
  "B.A. LL.B.", "BBA LL.B.", "LL.B.", "LL.M.", "B.Ed.", "M.Ed.",
  "M.Sc", "M.Com", "Ph.D.", "Diploma", "Other",
  "B.Tech CSE",
  "B.Tech ECE",
  "B.Tech Mechanical",
  "B.Des",
  "B.Arch",
  "BBA",
  "B.Com",
  "B.Sc Physics",
  "B.Sc Psychology",
  "MA English",
];

export function Onboarding({onDone,toast,onSwitchToLogin}:{onDone:()=>Promise<MeData|null>;toast:(message:string,tone?:'ok'|'warn'|'err')=>void;onSwitchToLogin?:()=>void}){
 const [step,setStep]=useState(1),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [name,setName]=useState(''),[course,setCourse]=useState('BCA AI & ML'),[year,setYear]=useState('1'),[gender,setGender]=useState('prefer_not_to_say');
 return <div className="shell-bg flex min-h-dvh items-center justify-center md:py-6"><div className="phone-frame relative flex h-dvh w-full flex-col overflow-hidden bg-paper md:h-[min(94dvh,920px)] md:max-w-105 md:rounded-[2rem]">
 <header className="flex items-center gap-3 border-b border-line bg-white px-5 py-4"><span className="rounded-2xl bg-orange-100 p-3 text-orange-600"><IconLayers/></span><div><p className="font-display font-bold">Quad Campus</p><p className="text-xs text-slate-500">Your own account · your campus space</p></div></header>
 <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6"><div className="mb-6 flex items-center justify-between"><h1 className="font-display text-2xl font-bold text-slate-900">Create your account</h1><span className="career-chip">{step} / 2</span></div>
 <p className="mb-5 text-sm text-slate-500">Sign up with an email and password. Use the same email to return whenever you log out. No phone number needed.</p>
 {error&&<p role="alert" className="career-error mb-4">{error}</p>}
 {step===1?<form className="space-y-4" onSubmit={e=>{e.preventDefault();if(password!==confirm){setError('The passwords do not match.');return;}setError('');setStep(2);}}>
 <label className="career-label">Email address<input aria-label="Email address" className="career-input" type="email" required autoComplete="email" autoCapitalize="none" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
 <label className="career-label">Password<input aria-label="Password" className="career-input" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><p className="text-xs text-slate-500">Use 12–128 characters. Your password is stored as a secure hash.</p>
 <label className="career-label">Confirm password<input aria-label="Confirm password" className="career-input" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
 <button className="career-primary w-full">Continue</button>
 </form>:<form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api('/api/auth',{method:'POST',body:JSON.stringify({action:'signup',email,password,fullName:name,course,academicYear:Number(year),gender})});toast('Your account is saved. Welcome to Quad!','ok');await onDone();}catch(e){setError(e instanceof Error?e.message:'Could not create your account.');}finally{setBusy(false);}}}>
 <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 break-all">Your login email: {email.trim().toLowerCase()}</p>
 <label className="career-label">Full name<input aria-label="Full name" className="career-input" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>
 <label className="career-label">Course<select aria-label="Course" className="career-input" value={course} onChange={e=>setCourse(e.target.value)}>{COURSES.map(c=><option key={c}>{c}</option>)}</select></label>
 <label className="career-label">Academic year<select aria-label="Academic year" className="career-input" value={year} onChange={e=>setYear(e.target.value)}>{[1,2,3,4,5,6].map(y=><option key={y} value={y}>Year {y}</option>)}</select></label>
 <label className="career-label">Gender<select aria-label="Gender" className="career-input" value={gender} onChange={e=>setGender(e.target.value)}><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option></select></label>
 <p className="text-xs text-slate-500">Your email is a login ID. Email ownership and university enrollment are not verified by this signup.</p>
 <button disabled={busy} className="career-primary w-full">{busy?'Creating account…':'Create account'}</button><button type="button" disabled={busy} onClick={()=>{setStep(1);setError('');}} className="career-secondary w-full"><IconChevronLeft size={14}/>Edit email or password</button>
 </form>}
 <div className="mt-6 border-t border-line pt-4 text-center text-sm text-slate-500">Already have an account? <button className="font-bold text-emerald-700" onClick={onSwitchToLogin}>Log in</button></div>
 </main></div></div>;
}
