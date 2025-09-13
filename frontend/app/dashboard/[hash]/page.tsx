"use client";
import React, { useState, useEffect } from 'react'
import { MedicineSchedule } from '@/components/dashboard/medicine-schedule'
import { PatientAppointmentRequest } from '@/components/dashboard/patient-appointment-request'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import Protected from '@/components/auth/Protected'

export default function UserDashboard(){
  return (<Protected><DashboardContent /></Protected>)
}

const DashboardContent = () => {
  const [medicines, setMedicines] = useState<any[]>([])
  // legacy aggregated records state kept for compatibility with existing mapping but not directly rendered
  const [records, setRecords] = useState<any[]>([])
  // const [doctorRecordings, setDoctorRecordings] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; sender: "user" | "bot" | "doctor"; timestamp: Date }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null)
  const [linkedDoctors, setLinkedDoctors] = useState<any[]>([])
  const [hasPendingDoses, setHasPendingDoses] = useState(false)


  useEffect(() => { fetchDoctors() }, [])
  useEffect(() => { fetchDashboard() }, [selectedDoctorId])
  useEffect(() => { fetchMedicationLogs() }, [])

  const fetchDoctors = async () => {
    try {
      const data:any[] = await apiFetch('/patient/doctors/') as any
      setLinkedDoctors(data||[])
      if (!selectedDoctorId && data && data.length) setSelectedDoctorId(data[0].id)
    } catch(e){ console.error(e) }
  }

  const fetchMedicationLogs = async () => {
    try {
      const data: any[] = await apiFetch('/patient/medication-logs/') as any
      setHasPendingDoses(data.some(log => log.status === 'pending'))
    } catch(e){ console.error(e) }
  }

    const markAllTaken = async () => {
    try {
      const logs: any[] = await apiFetch('/patient/medication-logs/') as any
      const pendingLogs = logs.filter(log => log.status === 'pending')
      for (const log of pendingLogs) {
        await apiFetch('/patient/medication-logs/', { method: 'POST', body: JSON.stringify({ log_id: log.id }) })
      }
      fetchMedicationLogs()  // Refresh
    } catch(e){ console.error(e) }
  }

  const fetchDashboard = async () => {
    try {
      const qs = selectedDoctorId? `?doctor_id=${selectedDoctorId}`:''
      const data:any = await apiFetch(`/patient/dashboard/${qs}`)
      if (data) {
        // prescriptions -> transform into medicine schedule (flatten medicines with timing if present)
        const medList: any[] = []
        data.prescriptions.forEach((p: any) => {
          (p.medicines || []).forEach((m: any) => {
            medList.push({
              name: m.name || 'Medicine',
              dosage: m.dosage || '',
              timing: m.frequency || 'N/A',
              color: m.color || '#4ECDC4',
              shape: 'round',
              emoji: m.emoji || '💊',
              doctorName: p.doctor_name
            })
          })
        })
        setMedicines(medList)
        setRecords(data.records.map((r: any) => ({
          id: String(r.id),
          type: r.type,
          title: r.title,
          date: r.uploaded_at?.split('T')[0] || '',
          doctor: r.doctor_name || 'Doctor',
          fileUrl: r.file
        })))
        setChatMessages(data.chat.map((c: any) => ({ id: String(c.id), text: c.text, sender: c.sender === 'patient' ? 'user' : 'doctor', timestamp: new Date(c.timestamp) })))
      }
    } catch (e) {
      console.error('dashboard fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap gap-2 mb-2">
          {linkedDoctors.map(d => (
            <Button key={d.id} size="sm" variant={selectedDoctorId===d.id? 'default':'outline'} onClick={()=> setSelectedDoctorId(d.id)}>
              {d.name || 'Doctor'}
            </Button>
          ))}
          {linkedDoctors.length>0 && (
            <Button size="sm" variant={!selectedDoctorId? 'default':'outline'} onClick={()=> setSelectedDoctorId(null)}>All</Button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MedicineSchedule medicines={medicines} hasPendingDoses={hasPendingDoses} onMarkTaken={markAllTaken} />
          <PatientAppointmentRequest />
        </div>
      </div>
  );
};
