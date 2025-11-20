"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { API_BASE_URL } from '@/lib/config'
import { buildMediaUrl } from '@/lib/media'
import { apiFetch } from '@/lib/api'
import { Trash2, Upload } from 'lucide-react'
import { toast } from "sonner"

interface PRecord { id: number; type: string; title: string; file?: string; uploaded_at: string; uploaded_by: string; doctor_name?: string }

export function PatientSelfRecords({ doctorId }: { doctorId: number | null }) {
  const [records, setRecords] = useState<PRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ type: '', title: '', file: null as File | null })

  useEffect(() => { fetchRecords() }, [doctorId])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const url = new URL(`${API_BASE_URL}/patient/records/`)
      if (doctorId) url.searchParams.set('doctor_id', String(doctorId))
      const data = await apiFetch(url.pathname + url.search)
      setRecords(data)
    } catch (e) {
      console.error(e);
      toast.error('Failed to load records', { description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const addRecord = async () => {
    if (!doctorId) { toast.error('Select a doctor', { description: 'Please choose a doctor first.' }); return }
    if (!form.type || !form.title) { toast.error('Missing fields', { description: 'Type and title are required.' }); return }
    if (!form.file) { toast.error('File required', { description: 'Please attach a document before submitting.' }); return }
    setAdding(true)
    try {
      const fd = new FormData()
      fd.append('doctor', String(doctorId))
      fd.append('type', form.type)
      fd.append('title', form.title)
      if (form.file) fd.append('file', form.file)
      await apiFetch('/patient/records/', { method: 'POST', body: fd, asForm: true })
      await fetchRecords()
      setForm({ type: '', title: '', file: null })
      await fetchRecords()
      setForm({ type: '', title: '', file: null })
      toast.success('Record uploaded')
    } catch (e) {
      console.error(e);
      toast.error('Upload failed', { description: String(e) })
    } finally {
      setAdding(false)
    }
  }

  const delRecord = async (id: number, uploaded_by: string) => {
    if (uploaded_by !== 'patient') return // cannot delete doctor's
    try {
      await apiFetch('/patient/records/', { method: 'DELETE', body: JSON.stringify({ record_id: id }) })
      setRecords(prev => prev.filter(r => r.id !== id))
      toast.success('Record deleted')
    } catch (e) {
      console.error(e);
      toast.error('Delete failed', { description: String(e) })
    }
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
              <Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g. Lab Report" />
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Record title" />
            </div>
          </div>
          <div>
            <Label className="text-xs">File (required)</Label>
            <Input type="file" required accept=".pdf,.jpg,.png,.doc,.docx" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
          <Button disabled={!doctorId || adding || !form.file} onClick={addRecord} className="w-full">
            <Upload className="w-4 h-4 mr-2" /> {adding ? 'Saving...' : 'Save Record'}
          </Button>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Existing</h3>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            records.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
              records.map(r => (
                <div key={r.id} className="p-3 border rounded flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type} • {new Date(r.uploaded_at).toLocaleDateString()} • {r.uploaded_by === 'patient' ? 'You' : (r.doctor_name ? 'Dr. ' + r.doctor_name : 'Doctor')}</p>
                    {r.file && <a className="text-xs text-blue-500" target="_blank" href={buildMediaUrl(r.file)}>View File</a>}
                  </div>
                  {r.uploaded_by === 'patient' && (
                    <Button size="sm" variant="destructive" onClick={() => delRecord(r.id, r.uploaded_by)}>
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
