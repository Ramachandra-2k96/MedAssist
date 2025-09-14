"use client";
import React, { useEffect, useState } from 'react'
import { MedicineSchedule } from '@/components/dashboard/medicine-schedule'
import { apiFetch } from '@/lib/api'

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [rawPrescriptions, setRawPrescriptions] = useState<any[]>([]);
  useEffect(()=> { (async()=> {
    try {
      const data:any[] = await apiFetch('/patient/prescriptions/') as any
      setRawPrescriptions(data || [])
      const meds:any[] = []
      ;(data||[]).forEach((p:any)=>(p.medicines||[]).forEach((m:any)=> meds.push({ name:m.name||'Medicine', dosage:m.dosage||'', timing:m.frequency||'N/A', color:m.color||'#4ECDC4', shape:'round', emoji:m.emoji||'💊', doctorName:p.doctor_name })))
      setMedicines(meds)
    } catch(e){ console.error(e) }
  })() }, [])

  const handlePrint = () => {
    try {
      const printable = (rawPrescriptions||[]).map((p:any) => {
        const meds = (p.medicines||[]).map((m:any) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd">${m.emoji||'💊'} ${m.name}</td>
            <td style="padding:8px;border:1px solid #ddd">${m.dosage||''}</td>
            <td style="padding:8px;border:1px solid #ddd">${m.frequency||''}</td>
            <td style="padding:8px;border:1px solid #ddd">${m.duration||''}</td>
          </tr>
        `).join('')
        return `
          <div style="margin-bottom:20px">
            <h3>Prescription - ${new Date(p.created_at).toLocaleString()}</h3>
            <table style="border-collapse:collapse;width:100%">
              <thead>
                <tr>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Medicine</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Dosage</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Frequency</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${meds}
              </tbody>
            </table>
          </div>
        `
      }).join('\n')

      const html = `
        <html><head><title>Prescriptions</title></head><body style="padding:16px;font-family:Arial,Helvetica,sans-serif"><h1>Prescriptions</h1>${printable}</body></html>`
      const w = window.open('', '_blank')
      if (w) {
        w.document.open()
        w.document.write(html)
        w.document.close()
        setTimeout(()=> w.print(), 500)
      }
    } catch(e) { console.error(e) }
  }

  return (
    <div>
      <div className="mb-4">
        <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded bg-blue-600 text-white px-3 py-1 text-sm">Download / Print</button>
      </div>
      <MedicineSchedule medicines={medicines} />
    </div>
  )
}
