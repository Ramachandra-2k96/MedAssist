"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Play, Pause } from "lucide-react"

interface Recording {
  id: string
  title: string
  date: string
  duration: string
  uploadedBy: "doctor" | "patient"
  audioUrl?: string
}

interface PatientRecordingsProps {
  patientId: string
  patientName: string
}

export function PatientRecordings({ patientId, patientName }: PatientRecordingsProps) {
  const [recordings, setRecordings] = useState<Recording[]>([
    {
      id: "1",
      title: "Consultation Notes",
      date: "2025-08-15",
      duration: "2:30",
      uploadedBy: "doctor"
    },
    {
      id: "2",
      title: "Patient Symptoms",
      date: "2025-08-10",
      duration: "1:45",
      uploadedBy: "patient"
    }
  ])

  const [playingId, setPlayingId] = useState<string | null>(null)

  const handleDeleteRecording = (id: string) => {
    setRecordings(recordings.filter(r => r.id !== id))
  }

  const handlePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null)
    } else {
      setPlayingId(id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recordings for {patientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Audio Recordings</h3>
          {recordings.map((recording) => (
            <div key={recording.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayPause(recording.id)}
                >
                  {playingId === recording.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div>
                  <p className="font-medium">{recording.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {recording.date} - {recording.duration} (by {recording.uploadedBy})
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRecording(recording.id)}
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
