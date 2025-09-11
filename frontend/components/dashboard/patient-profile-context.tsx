"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

interface PatientProfile { id:number; name?:string|null; email?:string; photo_url?:string|null; role?:string }
interface Ctx { profile: PatientProfile | null; loading:boolean; refresh:()=>void }

const CtxObj = createContext<Ctx>({ profile:null, loading:true, refresh:()=>{} });

export const PatientProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<PatientProfile|null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setProfile(JSON.parse(stored)); } catch {}
      }
      // ping endpoint to validate token
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch(`${API_BASE_URL}/patient/dashboard/`, { headers:{ 'Authorization':`Bearer ${token}` } });
      }
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };
  useEffect(()=> { load(); }, []);
  return <CtxObj.Provider value={{ profile, loading, refresh: load }}>{children}</CtxObj.Provider>;
};

export const usePatientProfile = () => useContext(CtxObj);
