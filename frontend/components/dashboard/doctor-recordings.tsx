"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Languages } from "lucide-react"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

interface DoctorRecording {
  id: string
  doctorName: string
  title: string
  date: string
  duration: string
  audioUrl?: string
  transcription?: string
}

interface DoctorRecordingsProps {
  recordings: DoctorRecording[]
}

export function DoctorRecordings({ recordings }: DoctorRecordingsProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [showTranscription, setShowTranscription] = useState<Record<string, boolean>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const handlePlayPause = (id: string, url?: string) => {
    if (!url) return
    const current = audioRefs.current[id]
    if (playingId === id && current) {
      current.pause()
      setPlayingId(null)
      return
    }
    if (!current) {
      const a = new Audio(url)
      audioRefs.current[id] = a
      a.addEventListener('ended', () => setPlayingId(null))
      a.play().then(() => setPlayingId(id)).catch(e => toast.error("Playback failed", { description: String(e) }))
    } else {
      current.play().then(() => setPlayingId(id)).catch(e => toast.error("Playback failed", { description: String(e) }))
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
            <div key={recording.id} className="p-3 border rounded space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayPause(recording.id, recording.audioUrl)}
                  >
                    {playingId === recording.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <div>
                    <p className="font-medium">{recording.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {recording.doctorName} - {recording.date} {recording.duration && `- ${recording.duration}`}
                    </p>
                  </div>
                </div>
                {recording.transcription && (
                  <Button variant="outline" size="sm" onClick={() => setShowTranscription(prev => ({ ...prev, [recording.id]: !prev[recording.id] }))}>
                    <Languages className="w-4 h-4 mr-1" /> {showTranscription[recording.id] ? 'Hide' : 'Show'}
                  </Button>
                )}
              </div>
              {showTranscription[recording.id] && recording.transcription && (
                <Textarea readOnly value={recording.transcription} className="min-h-[80px]" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
