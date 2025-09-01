"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { useState } from "react"

interface DoctorRecording {
  id: string
  doctorName: string
  title: string
  date: string
  duration: string
  audioUrl?: string
}

interface DoctorRecordingsProps {
  recordings: DoctorRecording[]
}

export function DoctorRecordings({ recordings }: DoctorRecordingsProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)

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
        <CardTitle>Doctor Recordings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
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
                    Dr. {recording.doctorName} - {recording.date} - {recording.duration}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
