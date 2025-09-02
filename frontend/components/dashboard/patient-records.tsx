"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Upload } from "lucide-react"

interface Record {
  id: string
  type: string
  title: string
  date: string
  uploadedBy: "doctor" | "patient"
  file?: File
}

interface PatientRecordsProps {
  patientId: string
  patientName: string
}

export function PatientRecords({ patientId, patientName }: PatientRecordsProps) {
  const [records, setRecords] = useState<Record[]>([
    {
      id: "1",
      type: "Prescription",
      title: "Blood Pressure Medication",
      date: "2025-08-15",
      uploadedBy: "doctor"
    },
    {
      id: "2",
      type: "Lab Report",
      title: "Blood Test Results",
      date: "2025-08-10",
      uploadedBy: "patient"
    }
  ])

  const [newRecord, setNewRecord] = useState({
    type: "",
    title: "",
    file: null as File | null
  })

  const handleAddRecord = () => {
    if (newRecord.type && newRecord.title) {
      const record: Record = {
        id: Date.now().toString(),
        type: newRecord.type,
        title: newRecord.title,
        date: new Date().toISOString().split('T')[0],
        uploadedBy: "doctor", // Assuming doctor is adding
        file: newRecord.file || undefined
      }
      setRecords([...records, record])
      setNewRecord({ type: "", title: "", file: null })
    }
  }

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewRecord({ ...newRecord, file })
    }
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
        <Button onClick={handleAddRecord} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Add Record
        </Button>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing Records</h3>
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="font-medium">{record.title}</p>
                <p className="text-sm text-muted-foreground">{record.type} - {record.date} (by {record.uploadedBy})</p>
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
