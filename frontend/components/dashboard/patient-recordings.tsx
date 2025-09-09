"use client"

import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Play, Pause, FileAudio, Languages, Volume2, Mic, MicOff } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"

interface Recording {
  id: number
  title: string
  audio_file: string
  transcription: string
  language: string
  recorded_at: string
  uploaded_by: string
}

interface PatientRecordingsProps {
  patientId: string
  patientName: string
}

export function PatientRecordings({ patientId, patientName }: PatientRecordingsProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [playProgress, setPlayProgress] = useState<{ [key: number]: number }>({})
  const [showTranscription, setShowTranscription] = useState<{ [key: number]: boolean }>({})

  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({})
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const finalTranscriptRef = useRef<string | null>(null)

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(() => {
    if (patientId) {
      fetchRecordings()
    }
  }, [patientId])

  useEffect(() => {
    // keep a live preview of the transcript while listening
    if (listening && transcript) {
      finalTranscriptRef.current = transcript
    }
  }, [transcript, listening])

  useEffect(() => {
    return () => {
      // cleanup audio objects and object URLs
      Object.values(audioRefs.current).forEach(a => {
        try { a?.pause() } catch {}
        if (a?.src?.startsWith('blob:')) URL.revokeObjectURL(a.src)
      })
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/doctor/patients/${patientId}/audio/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRecordings(data)
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSpeechLanguageCode = (lang: string) => {
    const map: Record<string, string> = {
      en: 'en-US', kn: 'kn-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR', hi: 'hi-IN', ar: 'ar-SA', zh: 'zh-CN', ja: 'ja-JP'
    }
    return map[lang] || 'en-US'
  }

  const formatDuration = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds <= 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    return () => {
      // cleanup audio objects and object URLs
      Object.values(audioRefs.current).forEach(a => {
        try { a?.pause() } catch {}
        if (a?.src?.startsWith('blob:')) URL.revokeObjectURL(a.src)
      })
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])
  const startRecording = async () => {
    // show language selector first
    if (!showLanguageSelect) return setShowLanguageSelect(true)

    if (!browserSupportsSpeechRecognition) {
      alert('Speech recognition is not available in this browser.')
      return
    }

    try {
      resetTranscript()
      finalTranscriptRef.current = null
      recordedChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) recordedChunksRef.current.push(ev.data)
      }

      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(blob)

        // compute accurate duration using AudioContext if available
        let durationSeconds: number | null = null
        try {
          const arrayBuffer = await blob.arrayBuffer()
          const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
          if (AudioCtx) {
            const ctx = new AudioCtx()
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
            durationSeconds = audioBuffer?.duration ?? null
            ctx.close().catch(() => {})
          }
        } catch (e) {
          // fallback to metadata
          console.warn('AudioContext decode failed', e)
        }

        if (durationSeconds === null) {
          // fallback: try HTMLAudioElement
          try {
            const a = new Audio()
            a.preload = 'metadata'
            a.src = audioUrl
            await new Promise<void>((res) => {
              const onloaded = () => { res() }
              const onerr = () => { res() }
              a.addEventListener('loadedmetadata', onloaded, { once: true })
              a.addEventListener('error', onerr, { once: true })
            })
            durationSeconds = a.duration || null
          } catch (e) {
            console.warn('audio element duration failed', e)
            durationSeconds = null
          }
        }

        const finalTranscript = (finalTranscriptRef.current && finalTranscriptRef.current.trim()) || (transcript && transcript.trim()) || 'No speech detected during recording.'

        // Upload to backend
        await uploadRecording(blob, finalTranscript, selectedLanguage, durationSeconds ?? recordingSeconds)

        setRecordingSeconds(0)
        finalTranscriptRef.current = null
        resetTranscript()

        // stop tracks
        try { stream.getTracks().forEach(t => t.stop()) } catch {}
      }

      mr.start()
      setIsRecording(true)
      setShowLanguageSelect(false)

      // start speech recognition
      SpeechRecognition.startListening({ continuous: true, language: getSpeechLanguageCode(selectedLanguage) })

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(s => s + 1)
      }, 1000)

    } catch (err) {
      console.error('startRecording failed', err)
      alert('Could not start recording. Check microphone permissions.')
    }
  }

  const uploadRecording = async (blob: Blob, transcription: string, language: string, duration: number) => {
    setUploading(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('title', `Recording ${new Date().toLocaleTimeString()}`)
      formData.append('audio_file', blob, 'recording.webm')
      formData.append('transcription', transcription)
      formData.append('language', language)

      const response = await fetch(`${API_BASE_URL}/doctor/patients/${patientId}/audio/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setRecordings(prev => [...prev, data])
      }
    } catch (error) {
      console.error('Error uploading recording:', error)
    } finally {
      setUploading(false)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return

    // stop speech recognition first and snapshot transcript
    SpeechRecognition.stopListening()
    finalTranscriptRef.current = (transcript && transcript.trim()) || finalTranscriptRef.current
    setIsRecording(false)
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }

    // give speech recognition a small moment to finalize before stopping the recorder
    setTimeout(() => {
      try { mediaRecorderRef.current?.stop() } catch (e) { console.warn(e) }
    }, 400)
  }

  const handlePlayPause = (id: number) => {
    const rec = recordings.find(r => r.id === id)
    if (!rec) return

    // if already playing pause
    if (playingId === id) {
      const a = audioRefs.current[id]
      a?.pause()
      setPlayingId(null)
      return
    }

    // pause any other
    if (playingId && audioRefs.current[playingId]) audioRefs.current[playingId]?.pause()

    // create audio element if needed
    if (!audioRefs.current[id]) {
      const a = new Audio(`${API_BASE_URL}${rec.audio_file}`)
      audioRefs.current[id] = a
      a.addEventListener('timeupdate', () => {
        const pct = a.duration ? (a.currentTime / a.duration) * 100 : 0
        setPlayProgress(prev => ({ ...prev, [id]: pct }))
      })
      a.addEventListener('ended', () => {
        setPlayingId(null)
        setPlayProgress(prev => ({ ...prev, [id]: 100 }))
      })
      a.addEventListener('loadedmetadata', () => {
        // update duration text in recordings state
        setRecordings(prev => prev.map(r => r.id === id ? { ...r, duration: formatDuration(a.duration) } : r))
      })
    }

    audioRefs.current[id]?.play()
    setPlayingId(id)
  }

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/doctor/patients/${patientId}/audio/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recording_id: id })
      })

      if (response.ok) {
        const rec = recordings.find(r => r.id === id)
        if (rec) {
          if (audioRefs.current[id]) {
            audioRefs.current[id]?.pause()
            try { URL.revokeObjectURL(audioRefs.current[id]!.src) } catch {}
            delete audioRefs.current[id]
          }
        }
        setRecordings(prev => prev.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error('Error deleting recording:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recordings for {patientName || 'Patient'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recorder controls */}
        <div className="space-y-4">
          <h3 className="font-semibold">Record New Audio</h3>

          {!isRecording && (
            <div className="flex gap-2">
              <Button onClick={() => setShowLanguageSelect(true)} className="flex-1">
                <Mic className="w-4 h-4 mr-2" />
                Record (Language: {selectedLanguage.toUpperCase()})
              </Button>
              <Button variant="outline" onClick={() => { /* reserved for future */ }}>
                Upload
              </Button>
            </div>
          )}

          {showLanguageSelect && !isRecording && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Select language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="kn">Kannada</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={startRecording} className="flex-1">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording in {selectedLanguage.toUpperCase()}
                </Button>
                <Button variant="outline" onClick={() => setShowLanguageSelect(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <div>
                    <div className="text-sm">Recording ({selectedLanguage.toUpperCase()})</div>
                    <div className="text-xs text-muted-foreground">{formatDuration(recordingSeconds)}</div>
                  </div>
                </div>
                <Button variant="destructive" onClick={stopRecording}><MicOff className="w-4 h-4 mr-2" />Stop</Button>
              </div>
              <div className="text-xs">
                {listening ? <span className="italic">Listening…</span> : <span className="text-muted-foreground">Recognition idle</span>}
                {transcript && <div className="mt-2 text-sm italic">Live: "{transcript}"</div>}
              </div>
            </div>
          )}
        </div>

        {/* Recordings list */}
        <div className="space-y-4">
          <h3 className="font-semibold">Audio Recordings</h3>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading recordings...</p>
          ) : recordings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recordings yet.</p>
          ) : (
            recordings.map(r => (
              <div key={r.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-muted-foreground">{new Date(r.recorded_at).toLocaleString()} · {r.language.toUpperCase()} · Uploaded by: {r.uploaded_by}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handlePlayPause(r.id)}>
                      {playingId === r.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowTranscription(prev => ({ ...prev, [r.id]: !prev[r.id] }))}>
                      <Languages className="w-4 h-4 mr-1" /> {showTranscription[r.id] ? 'Hide' : 'Show'} Transcription
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* progress bar while playing */}
                {playingId === r.id && (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${playProgress[r.id] ?? 0}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{Math.round(playProgress[r.id] ?? 0)}% listened</div>
                  </div>
                )}

                {showTranscription[r.id] && (
                  <div className="mt-2">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Volume2 className="w-4 h-4" /> Transcription</h4>
                    <Textarea value={r.transcription} readOnly className="min-h-[100px] resize-none" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
