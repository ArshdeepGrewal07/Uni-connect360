'use client';
import { useCallback,useEffect,useRef,useState,type SetStateAction } from 'react';
import { api } from '@/lib/client';
import { useApp } from '@/app/page';
export type StoredMeta={id:string;ownerId?:string|null;sample?:boolean;joined?:boolean;reserved?:boolean;proposed?:boolean;isMine?:boolean;hypeCount?:number};
export function useCollection<T>(kind:string){
 const [items,setItems]=useState<(T&StoredMeta)[]>([]);const {toast}=useApp();const alive=useRef(true);const busy=useRef(false);
 const refresh=useCallback(async()=>{const result=await api<{items:(T&StoredMeta)[]}>(`/api/community?kind=${encodeURIComponent(kind)}`);if(alive.current&&!busy.current)setItems(result.items);},[kind]);
 useEffect(()=>{alive.current=true;void refresh().catch(()=>toast('Could not load campus records. Retrying…','warn'));const t=setInterval(()=>void refresh().catch(()=>{}),10000);return()=>{alive.current=false;clearInterval(t);};},[refresh,toast]);
 const mutate=useCallback(async(action:string,input:Record<string,unknown>={})=>{
  if(busy.current)return null;busy.current=true;
  try{const result=await api<{item?:T&StoredMeta;deleted?:boolean}>('/api/community',{method:'POST',body:JSON.stringify({kind,action,...input})});
   if(alive.current)setItems(prev=>result.deleted?prev.filter(i=>i.id!==input.id):result.item?[result.item,...prev.filter(i=>i.id!==result.item!.id)]:prev);
   return result.item??true;
  }catch(e){toast(e instanceof Error?e.message:'Could not save your changes.','warn');return null;}finally{busy.current=false;}
 },[kind,toast]);
 return {items,mutate,refresh};
}
// Private data uses revision checks and a serial queue. No browser storage is authoritative.
export function useSavedState<T>(key:string,initial:T):[T,(update:SetStateAction<T>)=>void]{
 const {toast,me}=useApp();const [value,setValue]=useState(initial);const current=useRef(initial);const version=useRef(-1);const chain=useRef<Promise<unknown>>(Promise.resolve());const alive=useRef(true);
 useEffect(()=>{alive.current=true;chain.current=api<{value:T|null;version:number}>(`/api/preferences?key=${key}`).then(r=>{version.current=r.version;if(r.value!==null){current.current=r.value;if(alive.current)setValue(r.value);}}).catch(()=>toast('Saved progress could not be loaded. Try again before editing.','warn'));return()=>{alive.current=false;};},[key,me?.user.id,toast]);
 const update=useCallback((next:SetStateAction<T>)=>{
  chain.current=chain.current.then(async()=>{
   const before=current.current;const nextValue=typeof next==='function'?(next as (v:T)=>T)(before):next;
   try{const result=await api<{version:number}>('/api/preferences',{method:'PUT',body:JSON.stringify({key,value:nextValue,version:version.current})});version.current=result.version;current.current=nextValue;if(alive.current)setValue(nextValue);}
   catch(e){toast(e instanceof Error?e.message:'Could not save progress.','warn');try{const fresh=await api<{value:T|null;version:number}>(`/api/preferences?key=${key}`);version.current=fresh.version;if(fresh.value!==null){current.current=fresh.value;if(alive.current)setValue(fresh.value);}}catch{} }
  });
 },[key,toast]);return [value,update];
}
