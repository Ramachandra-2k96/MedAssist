"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { API_BASE_URL } from '@/lib/config'
import { buildMediaUrl } from '@/lib/media'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { Mic, MicOff, FileAudio, Play, Pause, Languages, Trash2, Upload } from 'lucide-react'

interface Recording {
  id: number
  title: string
  audio_file: string
  transcription: string
  language: string
  recorded_at: string
  uploaded_by: string
  doctor_name?: string
}

export function PatientAudioSection({ doctorId }: { doctorId: number | null }) {
  const [effectiveDoctorId, setEffectiveDoctorId] = useState<number | null>(doctorId)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [playId, setPlayId] = useState<number | null>(null)
  const [playProgress, setPlayProgress] = useState<Record<number, number>>({})
  const [showTx, setShowTx] = useState<Record<number, boolean>>({})
  const [uploading, setUploading] = useState(false)

  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({})
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const finalTranscriptRef = useRef<string | null>(null)

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  // sync prop -> internal
  useEffect(()=> { if (doctorId !== null) setEffectiveDoctorId(doctorId) }, [doctorId])
  // if no doctor provided (dedicated page) fetch list and auto pick first
  useEffect(()=> { if (doctorId === null) { (async()=> { try { const token = localStorage.getItem('access_token'); if(!token) return; const resp = await fetch(`${API_BASE_URL}/patient/doctors/`, { headers:{'Authorization':`Bearer ${token}`} }); if(resp.ok){ const data = await resp.json(); if(data.length) setEffectiveDoctorId(data[0].id); } } catch(e){ console.error(e)} })(); } }, [doctorId])

  useEffect(()=>{ fetchRecordings() }, [effectiveDoctorId])

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const url = new URL(`${API_BASE_URL}/patient/audio/`)
  if (effectiveDoctorId) url.searchParams.set('doctor_id', String(effectiveDoctorId))
      const resp = await fetch(url.toString(), { headers:{ 'Authorization': `Bearer ${token}` } })
      if (resp.ok) setRecordings(await resp.json())
    } catch(e){ console.error(e)} finally { setLoading(false) }
  }

  const langCode = (l:string) => ({ en:'en-US', kn:'kn-IN', es:'es-ES', fr:'fr-FR', de:'de-DE', hi:'hi-IN', zh:'zh-CN', ja:'ja-JP' }[l]||'en-US')
  const fmt = (s:number)=>{ if(!s||!isFinite(s)) return '0:00'; const m=Math.floor(s/60); const sec=Math.floor(s%60); return `${m}:${sec.toString().padStart(2,'0')}` }

  const startRecording = async () => {
  if (!effectiveDoctorId) return alert('Select a doctor first')
    if (!showLanguageSelect) return setShowLanguageSelect(true)
    if (!browserSupportsSpeechRecognition) return alert('Speech recognition not supported in this browser')
    try {
      resetTranscript(); finalTranscriptRef.current=null; recordedChunksRef.current=[]
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
      const mr = new MediaRecorder(stream); mediaRecorderRef.current = mr
      mr.ondataavailable = ev=> { if(ev.data && ev.data.size) recordedChunksRef.current.push(ev.data) }
      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type:'audio/webm' })
        const finalTx = (finalTranscriptRef.current && finalTranscriptRef.current.trim()) || (transcript && transcript.trim()) || 'No speech detected.'
        await uploadBlob(blob, finalTx)
        try { stream.getTracks().forEach(t=>t.stop()) } catch {}
        setRecordingSeconds(0)
      }
      mr.start(); setIsRecording(true); setShowLanguageSelect(false)
      SpeechRecognition.startListening({ continuous:true, language: langCode(selectedLanguage) })
      timerRef.current = window.setInterval(()=> setRecordingSeconds(s=>s+1), 1000)
    } catch(err){ console.error(err); alert('Mic permission denied') }
  }

  const stopRecording = () => {
    if(!isRecording) return
    SpeechRecognition.stopListening()
    finalTranscriptRef.current = transcript || finalTranscriptRef.current
    setIsRecording(false)
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current=null }
    setTimeout(()=>{ try { mediaRecorderRef.current?.stop() } catch(e){ console.warn(e)} }, 300)
  }

  const uploadBlob = async (blob: Blob, transcription: string) => {
    setUploading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const fd = new FormData()
  fd.append('doctor', String(effectiveDoctorId))
      fd.append('title', `Recording ${new Date().toLocaleTimeString()}`)
      fd.append('audio_file', blob, 'recording.webm')
      fd.append('transcription', transcription)
      fd.append('language', selectedLanguage)
      const resp = await fetch(`${API_BASE_URL}/patient/audio/`, { method:'POST', headers:{ 'Authorization': `Bearer ${token}` }, body: fd })
      if (resp.ok) { await fetchRecordings() }
    } catch(e){ console.error(e)} finally { setUploading(false) }
  }

  // Removed manual file upload per requirement

  const togglePlay = (id:number, url:string) => {
    if (!url) return
    const current = audioRefs.current[id]
    if (playId === id && current) { current.pause(); setPlayId(null); return }
    if (!current) {
      const a = new Audio(buildMediaUrl(url))
      audioRefs.current[id] = a
      a.addEventListener('timeupdate', ()=> { const pct = a.duration? (a.currentTime/a.duration)*100:0; setPlayProgress(p=>({...p,[id]:pct})) })
      a.addEventListener('ended', ()=> setPlayId(null))
      a.play().then(()=> setPlayId(id)).catch(e=>console.error(e))
    } else {
      current.play().then(()=> setPlayId(id)).catch(e=>console.error(e))
    }
  }

  const deleteRecording = async (id:number) => {
    try {
      const token = localStorage.getItem('access_token')
      const resp = await fetch(`${API_BASE_URL}/patient/audio/`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ recording_id: id }) })
      if (resp.status === 204) setRecordings(prev=> prev.filter(r=> r.id!==id))
    } catch(e){ console.error(e)}
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Audio Recordings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recorder */}
        <div className="space-y-4">
          <h3 className="font-semibold">Record New Audio</h3>
          {!isRecording && (
            <Button onClick={()=> setShowLanguageSelect(true)} disabled={!effectiveDoctorId} className="w-full">
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
                <Button onClick={startRecording} className="flex-1"><Mic className="w-4 h-4 mr-2" />Start</Button>
                <Button variant="outline" onClick={()=> setShowLanguageSelect(false)}>Cancel</Button>
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
                    <div className="text-xs text-muted-foreground">{fmt(recordingSeconds)}</div>
                  </div>
                </div>
                <Button variant="destructive" onClick={stopRecording}><MicOff className="w-4 h-4 mr-2" />Stop</Button>
              </div>
              <div className="text-xs">
                {listening ? <span className="italic">Listening…</span> : <span className="text-muted-foreground">Processing…</span>}
                {transcript && <div className="mt-2 text-sm italic">Live: "{transcript}"</div>}
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          <h3 className="font-semibold">All Recordings</h3>
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            recordings.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No recordings yet.</p> : (
              recordings.map(r => (
                <div key={r.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="outline" onClick={()=> togglePlay(r.id, r.audio_file)}>
                        {playId===r.id? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.recorded_at).toLocaleString()} • {r.uploaded_by==='patient'? 'You' : (r.doctor_name? 'Dr. '+r.doctor_name : 'Doctor')}</p>
                        <div className="h-1 bg-muted rounded mt-1 w-40 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${playProgress[r.id]||0}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.transcription && (
                        <Button variant="outline" size="sm" onClick={()=> setShowTx(p=> ({...p, [r.id]: !p[r.id]}))}>
                          <Languages className="w-4 h-4 mr-1" /> {showTx[r.id]? 'Hide':'Show'}
                        </Button>
                      )}
                      {r.uploaded_by==='patient' && (
                        <Button variant="destructive" size="sm" onClick={()=> deleteRecording(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {showTx[r.id] && r.transcription && (
                    <Textarea readOnly value={r.transcription} className="min-h-[80px]" />
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
