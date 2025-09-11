"use client";
import React, { useEffect, useState } from "react";
import { MedicineSchedule } from "@/components/dashboard/medicine-schedule";
import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout";
import { API_BASE_URL } from "@/lib/config";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  useEffect(()=>{ (async()=> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const resp = await fetch(`${API_BASE_URL}/patient/prescriptions/`, { headers:{ 'Authorization':`Bearer ${token}` } });
      if (resp.ok) {
        const data = await resp.json();
        const meds:any[] = [];
        data.forEach((p:any)=>(p.medicines||[]).forEach((m:any)=> meds.push({
          name:m.name||'Medicine', dosage:m.dosage||'', timing:m.frequency||'N/A', color:m.color||'#4ECDC4', shape:'round', emoji:m.emoji||'💊', doctorName:p.doctor_name
        })));
        setMedicines(meds);
      }
    } catch(e){ console.error(e)}
  })(); }, []);

  return (
    <PatientDashboardLayout>
      <MedicineSchedule medicines={medicines} />
    </PatientDashboardLayout>
  )
}
