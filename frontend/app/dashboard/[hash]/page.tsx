"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MedicineSchedule } from "@/components/dashboard/medicine-schedule";
import { AppointmentReminders } from "@/components/dashboard/appointment-reminders";
// Removed HealthRecords & Chatbot (now separate specialized components)
// import { DoctorRecordings } from "@/components/dashboard/doctor-recordings";
import { PatientAudioSection } from "@/components/dashboard/patient-audio-section";
import { PatientSelfRecords } from "@/components/dashboard/patient-self-records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PatientChatView } from "@/components/dashboard/patient-chat-view";
import { API_BASE_URL } from "@/lib/config";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout";
import Protected from "@/components/auth/Protected";

export default function UserDashboard(){
  return (<Protected><PatientDashboardLayout><UserDashboardContent /></PatientDashboardLayout></Protected>);
}
// Dummy dashboard component with content
const UserDashboardContent = () => {
  const [medicines, setMedicines] = useState<any[]>([])
  // legacy aggregated records state kept for compatibility with existing mapping but not directly rendered
  const [records, setRecords] = useState<any[]>([])
  // const [doctorRecordings, setDoctorRecordings] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; sender: "user" | "bot" | "doctor"; timestamp: Date }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null)
  const [linkedDoctors, setLinkedDoctors] = useState<any[]>([])
  const [newRecordFile, setNewRecordFile] = useState<File | null>(null)
  const [newRecordTitle, setNewRecordTitle] = useState("")
  const [newRecordType, setNewRecordType] = useState("")
  const [uploadingRecord, setUploadingRecord] = useState(false)
  const [audioUploadBlob, setAudioUploadBlob] = useState<Blob | null>(null)
  const [audioUploading, setAudioUploading] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [selectedDoctorId])

  useEffect(() => { fetchDoctors() }, [])

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const resp = await fetch(`${API_BASE_URL}/patient/doctors/`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (resp.ok) {
        const data = await resp.json()
        setLinkedDoctors(data)
        // Auto select first doctor if none chosen so user can immediately record / add records
        if (!selectedDoctorId && data.length) {
          setSelectedDoctorId(data[0].id)
        }
      }
    } catch(e){ console.error(e)}
  }

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const url = new URL(`${API_BASE_URL}/patient/dashboard/`)
      if (selectedDoctorId) url.searchParams.set('doctor_id', String(selectedDoctorId))
      const resp = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } })
      if (resp.ok) {
        const data = await resp.json()
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
          fileUrl: r.file ? (r.file.startsWith('http') ? r.file : `${API_BASE_URL?.replace(/\/api\/?$/, '')}${r.file}`) : undefined
        })))
  // doctor recordings now fetched inside PatientAudioSection (combined list)
        setChatMessages(data.chat.map((c: any) => ({
          id: String(c.id),
          text: c.text,
            sender: c.sender === 'patient' ? 'user' : 'doctor',
          timestamp: new Date(c.timestamp)
        })))
      }
    } catch (e) {
      console.error('dashboard fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    const local = { id: Date.now().toString(), text: message, sender: 'user' as const, timestamp: new Date() }
    setChatMessages(prev => [...prev, local])
    try {
      const token = localStorage.getItem('access_token')
      const resp = await fetch(`${API_BASE_URL}/patient/chat/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, doctor: selectedDoctorId })
      })
      if (!resp.ok) throw new Error('send failed')
    } catch (e) { console.error('chat send failed', e) }
  }

  const uploadRecord = async () => {
    if (!newRecordFile || !selectedDoctorId) return
    setUploadingRecord(true)
    try {
      const token = localStorage.getItem('access_token')
      const fd = new FormData()
      fd.append('doctor', String(selectedDoctorId))
      fd.append('title', newRecordTitle || newRecordFile.name)
      fd.append('type', newRecordType || 'General')
      fd.append('file', newRecordFile)
      const resp = await fetch(`${API_BASE_URL}/patient/records/`, { method:'POST', headers:{'Authorization':`Bearer ${token}`}, body: fd })
      if (resp.ok) fetchDashboard()
    } catch(e){ console.error(e)} finally { setUploadingRecord(false); setNewRecordFile(null); setNewRecordTitle(''); setNewRecordType('') }
  }

  // audio upload & recording handled in PatientAudioSection

  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-6">
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
          <MedicineSchedule medicines={medicines} />
          {/* Appointments mock retained as per instruction */}
          <AppointmentReminders appointments={[]} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PatientAudioSection doctorId={selectedDoctorId} />
          <PatientSelfRecords doctorId={selectedDoctorId} />
        </div>
      </div>
    </div>
  );
};
