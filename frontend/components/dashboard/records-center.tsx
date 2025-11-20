"use client"
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { toast } from "sonner"
import { buildMediaUrl } from '@/lib/media'
import { Trash2, Upload } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RecordItem { id: number; type: string; title: string; file?: string; uploaded_at: string; uploaded_by: string }

interface RecordsCenterProps {
  mode: 'doctor' | 'patient'
  patientId?: string
  patientName?: string
}

export function RecordsCenter({ mode, patientId, patientName }: RecordsCenterProps) {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newRecord, setNewRecord] = useState({ type: '', title: '', file: null as File | null })
  const basePath = mode === 'doctor' ? `/doctor/patients/${patientId}/records/` : '/patient/records/'
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string; email: string; photo_url?: string }>>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null)

  const fetchRecords = async () => {
    try {
      let path = basePath
      if (mode === 'patient' && selectedDoctorId) path += `?doctor_id=${selectedDoctorId}`
      const data = await apiFetch<RecordItem[]>(path); setRecords(data || [])
    }
    catch (e: any) { console.error(e); toast.error('Failed to load records', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchRecords() }, [patientId, selectedDoctorId])

  useEffect(() => {
    if (mode === 'patient') {
      (async () => {
        try {
          const docs = await apiFetch<Array<{ id: number; name: string; email: string; photo_url?: string }>>('/patient/doctors/')
          setDoctors(docs || [])
          if ((docs || []).length) setSelectedDoctorId(docs[0].id)
        } catch (e: any) { console.error(e); toast.error('Failed to load doctors', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) }
      })()
    }
  }, [mode])

  const addRecord = async () => {
    if (mode === 'patient' && !selectedDoctorId) {
      toast.error('Select a doctor', { description: 'Choose a doctor before uploading.' })
      return
    }
    if (!newRecord.type || !newRecord.title) {
      toast.error('Missing fields', { description: 'Type and title are required' })
      return
    }
    if (!newRecord.file) {
      toast.error('File required', { description: 'Please attach a document before submitting.' })
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('type', newRecord.type)
      fd.append('title', newRecord.title)
      fd.append('file', newRecord.file)
      if (mode === 'patient' && selectedDoctorId) fd.append('doctor', String(selectedDoctorId))
      const rec = await apiFetch<RecordItem>(basePath, { method: 'POST', body: fd, asForm: true })
      if (rec) { setRecords(prev => [...prev, rec]); setNewRecord({ type: '', title: '', file: null }); toast.success('Record uploaded', { description: 'Your document was uploaded successfully.' }) }
    } catch (e: any) { console.error(e); toast.error('Upload failed', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) } finally { setUploading(false) }
  }

  const deleteRecord = async (id: number) => {
    try { await apiFetch(basePath, { method: 'DELETE', body: JSON.stringify({ record_id: id }) }); setRecords(prev => prev.filter(r => r.id !== id)); toast.success('Record deleted') }
    catch (e: any) { console.error(e); toast.error('Delete failed', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) }
  }

  if (loading) return <Card><CardContent>Loading records...</CardContent></Card>

  return (
    <Card>
      <CardHeader><CardTitle>Records {patientName ? `for ${patientName}` : ''}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {mode === 'patient' && (
          <div>
            <label className="text-sm font-medium mb-1 block">Select Doctor</label>
            <Select value={selectedDoctorId ? String(selectedDoctorId) : undefined} onValueChange={(v) => setSelectedDoctorId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder={doctors.length ? 'Choose doctor' : 'No doctors linked'} />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(d => (<SelectItem key={d.id} value={String(d.id)}>{d.name || d.email}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="record-type">Record Type</Label>
            <Input id="record-type" value={newRecord.type} onChange={e => setNewRecord(p => ({ ...p, type: e.target.value }))} placeholder="e.g., Prescription, Lab Report" />
          </div>
          <div>
            <Label htmlFor="record-title">Title</Label>
            <Input id="record-title" value={newRecord.title} onChange={e => setNewRecord(p => ({ ...p, title: e.target.value }))} placeholder="Record title" />
          </div>
        </div>
        <div>
          <Label htmlFor="file-upload">Upload File (required)</Label>
          <Input id="file-upload" type="file" required onChange={e => { const f = e.target.files?.[0] || null; setNewRecord(p => ({ ...p, file: f })) }} accept=".pdf,.jpg,.png,.doc,.docx" />
        </div>
        <Button onClick={addRecord} className="w-full" disabled={uploading || !newRecord.file}> <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Uploading...' : 'Add Record'} </Button>
        <div className="space-y-2">
          <h3 className="font-semibold">Existing Records</h3>
          {records.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.type} - {new Date(r.uploaded_at).toLocaleDateString()} (by {r.uploaded_by})</p>
                {r.file && <a href={buildMediaUrl(r.file)} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">View File</a>}
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteRecord(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
