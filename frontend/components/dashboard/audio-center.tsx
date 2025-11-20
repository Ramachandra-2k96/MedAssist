"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Languages, Mic, MicOff, Play, Pause, Trash2, FileAudio, Volume2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { buildMediaUrl } from '@/lib/media'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { toast } from "sonner"

interface BaseRecording { id: number; title: string; audio_file: string; transcription: string; language: string; recorded_at: string; uploaded_by: string; doctor_name?: string }

interface AudioCenterProps {
  mode: 'doctor' | 'patient'
  patientId?: string
  doctorId?: number | null
  patientName?: string
}

const langMap: Record<string, string> = { en: 'en-US', kn: 'kn-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', hi: 'hi-IN', zh: 'zh-CN', ja: 'ja-JP' }

export function AudioCenter({ mode, patientId, doctorId, patientName }: AudioCenterProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [recordings, setRecordings] = useState<BaseRecording[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [playProgress, setPlayProgress] = useState<Record<number, number>>({})
  const [showTx, setShowTx] = useState<Record<number, boolean>>({})
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string; email: string; photo_url?: string }>>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(doctorId ?? null)

  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({})

  const basePath = mode === 'doctor' ? `/doctor/patients/${patientId}/audio/` : '/patient/audio/'

  const { isRecording, seconds, start, stop, transcript, listening } = useAudioRecorder({
    language: langMap[selectedLanguage] || 'en-US', onComplete: async (blob, tx) => {
      const fd = new FormData()
      fd.append('title', `Recording ${new Date().toLocaleTimeString()}`)
      fd.append('audio_file', blob, 'recording.webm')
      fd.append('transcription', tx || 'No speech detected.')
      fd.append('language', selectedLanguage)
      if (mode === 'patient') {
        const eff = selectedDoctorId || doctorId
        if (!eff) { toast.error('Select a doctor', { description: 'Please choose a doctor first.' }); return }
        fd.append('doctor', String(eff))
      }
      try { const rec = await apiFetch<BaseRecording>(basePath, { method: 'POST', body: fd, asForm: true }); if (rec) { setRecordings(prev => [...prev, rec]); toast.success('Recording uploaded') } }
      catch (e: any) { console.error(e); toast.error('Upload failed', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) }
    }
  })

  const fetchRecordings = async () => {
    try {
      let path = basePath
      const eff = selectedDoctorId || doctorId
      if (mode === 'patient' && eff) path += `?doctor_id=${eff}`
      const data = await apiFetch<BaseRecording[]>(path)
      setRecordings(data || [])
    } catch (e: any) { console.error(e); toast.error('Failed to load recordings', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) } finally { setLoading(false) }
  }
  useEffect(() => { fetchRecordings() }, [patientId, doctorId, selectedDoctorId])

  useEffect(() => {
    if (mode === 'patient') {
      (async () => {
        try {
          const docs = await apiFetch<Array<{ id: number; name: string; email: string; photo_url?: string }>>('/patient/doctors/')
          setDoctors(docs || [])
          if ((docs || []).length && !selectedDoctorId) setSelectedDoctorId(docs[0].id)
        } catch (e: any) { console.error(e); toast.error('Failed to load doctors', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) }
      })()
    }
  }, [mode])

  const togglePlay = (id: number) => {
    const rec = recordings.find(r => r.id === id); if (!rec) return
    if (playingId === id) { audioRefs.current[id]?.pause(); setPlayingId(null); return }
    if (playingId && audioRefs.current[playingId]) audioRefs.current[playingId]?.pause()
    if (!audioRefs.current[id]) {
      const a = new Audio(buildMediaUrl(rec.audio_file))
      audioRefs.current[id] = a
      a.addEventListener('timeupdate', () => { const pct = a.duration ? (a.currentTime / a.duration) * 100 : 0; setPlayProgress(p => ({ ...p, [id]: pct })) })
      a.addEventListener('ended', () => { setPlayingId(null); setPlayProgress(p => ({ ...p, [id]: 100 })) })
    }
    audioRefs.current[id]?.play().then(() => setPlayingId(id))
  }

  const deleteRecording = async (id: number) => {
    try { await apiFetch(basePath, { method: 'DELETE', body: JSON.stringify({ recording_id: id }) }); setRecordings(prev => prev.filter(r => r.id !== id)); toast.success('Recording deleted') }
    catch (e: any) { console.error(e); toast.error('Delete failed', { description: e?.detail ? JSON.stringify(e.detail) : String(e) }) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'doctor' ? `Recordings for ${patientName || 'Patient'}` : 'Your Audio Recordings'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <div className="space-y-4">
          <h3 className="font-semibold">Record New Audio</h3>
          {!isRecording && (
            <Button onClick={() => setShowLanguageSelect(true)} className="w-full">
              <Mic className="w-4 h-4 mr-2" /> Record (Language: {selectedLanguage.toUpperCase()})
            </Button>
          )}
          {showLanguageSelect && !isRecording && (
            <div className="p-4 border rounded space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Select language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
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
              <div className="flex gap-2">
                <Button onClick={start} className="flex-1"><Mic className="w-4 h-4 mr-2" />Start</Button>
                <Button variant="outline" onClick={() => setShowLanguageSelect(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {isRecording && (
            <div className="p-4 border rounded bg-red-50 dark:bg-red-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <div>
                    <div className="text-sm">Recording ({selectedLanguage.toUpperCase()})</div>
                    <div className="text-xs text-muted-foreground">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div>
                  </div>
                </div>
                <Button variant="destructive" onClick={stop}><MicOff className="w-4 h-4 mr-2" />Stop</Button>
              </div>
              <div className="text-xs">
                {listening ? <span className="italic">Listening…</span> : <span className="text-muted-foreground">Processing…</span>}
                {transcript && <div className="mt-2 text-sm italic">Live: "{transcript}"</div>}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold">Audio Recordings</h3>
          {loading ? <p className="text-muted-foreground text-center py-8">Loading recordings...</p> : recordings.length === 0 ? <p className="text-muted-foreground text-center py-8">No recordings yet.</p> : (
            recordings.map(r => (
              <div key={r.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-muted-foreground">{new Date(r.recorded_at).toLocaleString()} · {r.language.toUpperCase()} · {r.uploaded_by === 'patient' ? 'You' : (r.doctor_name ? 'Dr. ' + r.doctor_name : 'Doctor')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePlay(r.id)}>
                      {playingId === r.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    {r.transcription && <Button size="sm" variant="outline" onClick={() => setShowTx(p => ({ ...p, [r.id]: !p[r.id] }))}><Languages className="w-4 h-4 mr-1" /> {showTx[r.id] ? 'Hide' : 'Show'} Transcription</Button>}
                    {r.uploaded_by === 'patient' && <Button size="sm" variant="destructive" onClick={() => deleteRecording(r.id)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                </div>
                {playingId === r.id && (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${playProgress[r.id] ?? 0}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{Math.round(playProgress[r.id] ?? 0)}% listened</div>
                  </div>
                )}
                {showTx[r.id] && r.transcription && (
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
