"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { API_BASE_URL } from '@/lib/config'
import { buildMediaUrl } from '@/lib/media'
import { Trash2, Upload } from 'lucide-react'

interface PRecord { id:number; type:string; title:string; file?:string; uploaded_at:string; uploaded_by:string; doctor_name?:string }

export function PatientSelfRecords({ doctorId }: { doctorId: number | null }) {
  const [records, setRecords] = useState<PRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ type:'', title:'', file: null as File | null })

  useEffect(()=> { fetchRecords() }, [doctorId])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const url = new URL(`${API_BASE_URL}/patient/records/`)
      if (doctorId) url.searchParams.set('doctor_id', String(doctorId))
      const resp = await fetch(url.toString(), { headers:{ 'Authorization':`Bearer ${token}` } })
      if (resp.ok) setRecords(await resp.json())
    } catch(e){ console.error(e)} finally { setLoading(false) }
  }

  const addRecord = async () => {
    if (!doctorId || !form.type || !form.title) return
    setAdding(true)
    try {
      const token = localStorage.getItem('access_token')
      const fd = new FormData()
      fd.append('doctor', String(doctorId))
      fd.append('type', form.type)
      fd.append('title', form.title)
      if (form.file) fd.append('file', form.file)
      const resp = await fetch(`${API_BASE_URL}/patient/records/`, { method:'POST', headers:{ 'Authorization':`Bearer ${token}` }, body: fd })
      if (resp.ok) { await fetchRecords(); setForm({ type:'', title:'', file:null }) }
    } catch(e){ console.error(e)} finally { setAdding(false) }
  }

  const delRecord = async (id:number, uploaded_by:string) => {
    if (uploaded_by !== 'patient') return // cannot delete doctor's
    try {
      const token = localStorage.getItem('access_token')
      const resp = await fetch(`${API_BASE_URL}/patient/records/`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ record_id: id }) })
      if (resp.status === 204) setRecords(prev=> prev.filter(r=> r.id!==id))
    } catch(e){ console.error(e)}
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Health Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Add Record</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Type</Label>
              <Input value={form.type} onChange={e=> setForm(f=> ({...f, type:e.target.value}))} placeholder="e.g. Lab Report" />
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={e=> setForm(f=> ({...f, title:e.target.value}))} placeholder="Record title" />
            </div>
          </div>
          <div>
            <Label className="text-xs">File (optional)</Label>
            <Input type="file" accept=".pdf,.jpg,.png,.doc,.docx" onChange={e=> setForm(f=> ({...f, file: e.target.files?.[0]||null}))} />
          </div>
          <Button disabled={!doctorId || adding} onClick={addRecord} className="w-full">
            <Upload className="w-4 h-4 mr-2" /> {adding? 'Saving...':'Save Record'}
          </Button>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Existing</h3>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            records.length===0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
              records.map(r => (
                <div key={r.id} className="p-3 border rounded flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type} • {new Date(r.uploaded_at).toLocaleDateString()} • {r.uploaded_by==='patient'? 'You' : (r.doctor_name? 'Dr. '+r.doctor_name : 'Doctor')}</p>
                    {r.file && <a className="text-xs text-blue-500" target="_blank" href={buildMediaUrl(r.file)}>View File</a>}
                  </div>
                  {r.uploaded_by==='patient' && (
                    <Button size="sm" variant="destructive" onClick={()=> delRecord(r.id, r.uploaded_by)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
