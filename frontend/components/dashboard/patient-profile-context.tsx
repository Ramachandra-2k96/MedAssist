"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PatientProfile { id:number; name?:string|null; email?:string; photo_url?:string|null; role?:string }
interface Ctx { profile: PatientProfile | null; loading:boolean; refresh:()=>void }

const CtxObj = createContext<Ctx>({ profile:null, loading:true, refresh:()=>{} });

export const PatientProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<PatientProfile|null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setProfile(JSON.parse(stored)); } catch {}
      }
      // ping endpoint to validate token
      await apiFetch('/patient/dashboard/');
    } catch(e: any){ 
      console.error(e); 
      // Only show toast for non-auth errors (auth errors redirect)
      if (e?.status !== 401 && e?.status !== 403) {
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "Could not verify session. Please try refreshing."
        });
      }
    } finally { setLoading(false); }
  };
  useEffect(()=> { load(); }, []);
  return <CtxObj.Provider value={{ profile, loading, refresh: load }}>{children}</CtxObj.Provider>;
};

export const usePatientProfile = () => useContext(CtxObj);
