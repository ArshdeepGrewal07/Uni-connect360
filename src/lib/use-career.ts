"use client";
import {useCallback,useEffect,useState} from 'react';
import {api} from '@/lib/client';
import type {CareerData} from '@/lib/career-types';
export function useCareer(){
 const [data,setData]=useState<CareerData|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const reload=useCallback(async()=>{const result=await api<CareerData>('/api/career');setData(result);setError('');return result;},[]);
 useEffect(()=>{let active=true;api<CareerData>('/api/career').then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 const mutate=async(body:Record<string,unknown>)=>{setBusy(true);setError('');try{const result=await api('/api/career',{method:'POST',body:JSON.stringify(body)});await reload();return result;}catch(e){setError(e instanceof Error?e.message:'Could not save. Your changes have not been confirmed.');return null;}finally{setBusy(false);}};
 return {data,error,busy,reload,mutate};
}
