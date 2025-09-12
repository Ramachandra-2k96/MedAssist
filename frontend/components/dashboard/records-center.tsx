"use client"
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { buildMediaUrl } from '@/lib/media'
import { Trash2, Upload } from 'lucide-react'

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
  const basePath = mode==='doctor'? `/doctor/patients/${patientId}/records/` : '/patient/records/'

  const fetchRecords = async () => {
    try { const data = await apiFetch<RecordItem[]>(basePath); setRecords(data||[]) } catch(e){ console.error(e) } finally { setLoading(false) }
  }
  useEffect(()=> { fetchRecords() }, [patientId])

  const addRecord = async () => {
    if (!newRecord.type || !newRecord.title) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('type', newRecord.type)
      fd.append('title', newRecord.title)
      if (newRecord.file) fd.append('file', newRecord.file)
      const rec = await apiFetch<RecordItem>(basePath, { method:'POST', body: fd, asForm:true })
      if (rec) { setRecords(prev=> [...prev, rec]); setNewRecord({ type:'', title:'', file:null }) }
    } catch(e){ console.error(e) } finally { setUploading(false) }
  }

  const deleteRecord = async (id:number) => {
    try { await apiFetch(basePath, { method:'DELETE', body: JSON.stringify({ record_id: id }) }); setRecords(prev=> prev.filter(r=> r.id!==id)) } catch(e){ console.error(e) }
  }

  if (loading) return <Card><CardContent>Loading records...</CardContent></Card>

  return (
    <Card>
      <CardHeader><CardTitle>Records {patientName? `for ${patientName}`:''}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="record-type">Record Type</Label>
            <Input id="record-type" value={newRecord.type} onChange={e=> setNewRecord(p=> ({...p, type: e.target.value }))} placeholder="e.g., Prescription, Lab Report" />
          </div>
          <div>
            <Label htmlFor="record-title">Title</Label>
            <Input id="record-title" value={newRecord.title} onChange={e=> setNewRecord(p=> ({...p, title: e.target.value }))} placeholder="Record title" />
          </div>
        </div>
        <div>
          <Label htmlFor="file-upload">Upload File (optional)</Label>
          <Input id="file-upload" type="file" onChange={e=> { const f = e.target.files?.[0]; if (f) setNewRecord(p=> ({...p, file:f })) }} accept=".pdf,.jpg,.png,.doc,.docx" />
        </div>
        <Button onClick={addRecord} className="w-full" disabled={uploading}> <Upload className="w-4 h-4 mr-2" /> {uploading? 'Uploading...':'Add Record'} </Button>
        <div className="space-y-2">
          <h3 className="font-semibold">Existing Records</h3>
          {records.map(r=> (
            <div key={r.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.type} - {new Date(r.uploaded_at).toLocaleDateString()} (by {r.uploaded_by})</p>
                {r.file && <a href={buildMediaUrl(r.file)} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">View File</a>}
              </div>
              <Button variant="destructive" size="sm" onClick={()=> deleteRecord(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
