"use client";
import React, { useEffect, useState } from "react";
import { PatientChatView } from "@/components/dashboard/patient-chat-view";
import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default function ChatPage(){
  const [linkedDoctors, setLinkedDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number|null>(null);
  useEffect(()=>{ (async()=>{
    try { const token = localStorage.getItem('access_token'); if(!token) return; const resp = await fetch(`${API_BASE_URL}/patient/doctors/`, { headers:{'Authorization':`Bearer ${token}`} }); if(resp.ok){ const data = await resp.json(); setLinkedDoctors(data); if(!selectedDoctorId && data.length) setSelectedDoctorId(data[0].id); } } catch(e){ console.error(e)}
  })(); }, []);
  return (
    <PatientDashboardLayout>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg space-y-2">
          <p className="text-sm font-semibold">Select Doctor</p>
          <div className="flex flex-wrap gap-2">
            {linkedDoctors.map(d=> (
              <Button key={d.id} size="sm" variant={selectedDoctorId===d.id? 'default':'outline'} onClick={()=> setSelectedDoctorId(d.id)}>{d.name}</Button>
            ))}
          </div>
        </div>
        <PatientChatView doctorId={selectedDoctorId} />
      </div>
    </PatientDashboardLayout>
  )
}
