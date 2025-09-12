"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_BASE_URL } from "@/lib/config"
import { apiFetch } from "@/lib/api"
import { buildMediaUrl } from "@/lib/media"
import { Trash2, Upload } from "lucide-react"

interface Record {
  id: number
  type: string
  title: string
  file?: string
  uploaded_at: string
  uploaded_by: string
}

interface PatientRecordsProps {
  patientId: string
  patientName: string
}

export function PatientRecords({ patientId, patientName }: PatientRecordsProps) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [newRecord, setNewRecord] = useState({
    type: "",
    title: "",
    file: null as File | null
  })

  useEffect(() => {
    if (patientId) {
      fetchRecords()
    }
  }, [patientId])

  const fetchRecords = async () => {
    try {
      const data = await apiFetch<Record[]>(`/doctor/patients/${patientId}/records/`)
      setRecords(data || [])
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecord = async () => {
    if (!newRecord.type || !newRecord.title) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('type', newRecord.type)
      formData.append('title', newRecord.title)
      if (newRecord.file) formData.append('file', newRecord.file)

      const data = await apiFetch<Record>(`/doctor/patients/${patientId}/records/`, { method: 'POST', body: formData, asForm: true })
      if (data) {
        setRecords(prev => [...prev, data])
        setNewRecord({ type: "", title: "", file: null })
      }
    } catch (error) {
      console.error('Error adding record:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRecord = async (id: number) => {
    try {
      await apiFetch(`/doctor/patients/${patientId}/records/`, { method: 'DELETE', body: JSON.stringify({ record_id: id }) })
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting record:', error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewRecord({ ...newRecord, file })
    }
  }

  if (loading) {
    return <Card><CardContent>Loading records...</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records for {patientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="record-type">Record Type</Label>
            <Input
              id="record-type"
              value={newRecord.type}
              onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
              placeholder="e.g., Prescription, Lab Report"
            />
          </div>
          <div>
            <Label htmlFor="record-title">Title</Label>
            <Input
              id="record-title"
              value={newRecord.title}
              onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
              placeholder="Record title"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="file-upload">Upload File (optional)</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.png,.doc,.docx"
          />
        </div>
        <Button onClick={handleAddRecord} className="w-full" disabled={uploading}>
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Add Record'}
        </Button>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing Records</h3>
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="font-medium">{record.title}</p>
                <p className="text-sm text-muted-foreground">{record.type} - {new Date(record.uploaded_at).toLocaleDateString()} (by {record.uploaded_by})</p>
                {record.file && (
                  <a href={buildMediaUrl(record.file)} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">View File</a>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRecord(record.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
