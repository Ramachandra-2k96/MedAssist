"use client";
import React, { useEffect, useState } from 'react'
import { MedicineSchedule } from '@/components/dashboard/medicine-schedule'
import { apiFetch } from '@/lib/api'

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  useEffect(()=> { (async()=> {
    try {
      const data:any[] = await apiFetch('/patient/prescriptions/') as any
      const meds:any[] = []
      ;(data||[]).forEach((p:any)=>(p.medicines||[]).forEach((m:any)=> meds.push({ name:m.name||'Medicine', dosage:m.dosage||'', timing:m.frequency||'N/A', color:m.color||'#4ECDC4', shape:'round', emoji:m.emoji||'💊', doctorName:p.doctor_name })))
      setMedicines(meds)
    } catch(e){ console.error(e) }
  })() }, [])

  return <MedicineSchedule medicines={medicines} />
}
