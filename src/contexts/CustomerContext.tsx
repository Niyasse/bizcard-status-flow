import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { customerService } from '@/services';
import { toggleSaved, toggleMuted } from '@/services/discovery';
import type { CustomerPreferences } from '@/types';
import { toast } from 'sonner';
interface CustomerState { preferences: CustomerPreferences; save: (id:string)=>void; mute: (id:string)=>void }
const CustomerContext=createContext<CustomerState|undefined>(undefined);
export function CustomerProvider({children}:{children:ReactNode}) {
 const [preferences,setPreferences]=useState(customerService.read);
 useEffect(()=>{ const listener=(e:StorageEvent)=>{if(e.key==='bizapp.customer.v1')setPreferences(customerService.read());}; window.addEventListener('storage',listener); return ()=>window.removeEventListener('storage',listener); },[]);
 const change=(fn:(p:CustomerPreferences)=>CustomerPreferences)=>{ const next=fn(preferences); try {customerService.write(next);setPreferences(next);} catch {toast.error('Unable to save on this device. Please allow browser storage.');} };
 return <CustomerContext.Provider value={{preferences,save:id=>change(p=>toggleSaved(p,id)),mute:id=>change(p=>toggleMuted(p,id))}}>{children}</CustomerContext.Provider>;
}
export function useCustomer(){const c=useContext(CustomerContext);if(!c)throw new Error('CustomerProvider required');return c;}
