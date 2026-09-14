'use client';
import {useEffect,useState,useCallback} from 'react';
import {api} from '@/lib/client';
import {useApp} from '@/app/page';
type Data={session:{id:string;duration:number;remaining:number;deadline:number;status:string}|null;stats:{sessionsToday:number;minutesCompleted:number}};
export function useFocus(kind:'solo'|'duo',duration:number){
 const {toast}=useApp();const [data,setData]=useState<Data>({session:null,stats:{sessionsToday:0,minutesCompleted:0}});const [now,setNow]=useState(()=>Date.now());const [busy,setBusy]=useState(false);
 const load=useCallback(()=>api<Data>(`/api/focus?kind=${kind}`).then(setData),[kind]);
 useEffect(()=>{void load().catch(()=>toast('Could not load focus history.','warn'));const t=setInterval(()=>setNow(Date.now()),1000);const p=setInterval(()=>void load().catch(()=>{}),15000);return()=>{clearInterval(t);clearInterval(p);};},[load,toast]);
 const s=data.session;const running=s?.status==='active';const seconds=running?Math.max(0,Math.ceil((s.deadline-now)/1000)):s?.status==='paused'?s.remaining:duration*60;
 useEffect(()=>{if(running&&seconds===0)void load().catch(()=>{});},[running,seconds,load]);
 const action=async(action:string)=>{if(busy)return;setBusy(true);try{setData(await api<Data>('/api/focus',{method:'POST',body:JSON.stringify({action,kind,duration})}));setNow(Date.now());}catch(e){toast(e instanceof Error?e.message:'Could not save timer.','warn');}finally{setBusy(false);}};
 return {seconds,running,stats:data.stats,toggle:()=>action(running?'pause':s?.status==='paused'?'resume':'start'),reset:()=>action('reset'),busy};
}
