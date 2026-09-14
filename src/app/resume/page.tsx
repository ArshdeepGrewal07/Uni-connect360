"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {api} from '@/lib/client';
import type {CareerData} from '@/lib/career-types';
import type {MeData} from '@/lib/types';
export default function ResumePage(){
 const [data,setData]=useState<{career:CareerData;me:MeData}|null>(null),[error,setError]=useState('');
 useEffect(()=>{Promise.all([api<CareerData>('/api/career'),api<MeData>('/api/me')]).then(([career,me])=>setData({career,me})).catch(e=>setError(e.message));},[]);
 return <main className="mx-auto min-h-dvh max-w-3xl bg-white p-8 text-slate-900"><div className="print:hidden mb-8 flex flex-wrap items-center gap-3"><Link href="/" className="career-secondary">Back to campus</Link><button onClick={()=>window.print()} disabled={!data} className="career-primary">Print / save PDF</button><p className="text-xs text-slate-500">Choose Save as PDF in your browser’s print dialog.</p></div>{error?<p role="alert">{error} <Link href="/login" className="underline">Sign in</Link></p>:!data?<p>Loading saved resume…</p>:<><h1 className="text-3xl font-bold">{data.me.user.fullName}</h1><p className="mt-2">{data.career.profile.targetRole}</p><p className="text-sm">{data.me.user.email} · {data.me.user.course}</p><p className="mt-6 text-sm"><strong>Skills:</strong> {data.career.profile.skills.join(', ')||'No skills saved yet.'}</p><section className="mt-6 whitespace-pre-wrap break-words text-sm leading-relaxed">{data.career.profile.resume||'Save your resume draft in Career & Skills first.'}</section>{data.me.user.isDemo&&<p className="mt-8 text-xs text-slate-500">Sample campus account · self-reported information</p>}</>}</main>;
}
