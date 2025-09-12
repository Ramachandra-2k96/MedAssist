import { useCallback, useEffect, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface UseAudioRecorderOptions {
  language: string
  continuous?: boolean
  onComplete?: (blob: Blob, transcript: string) => Promise<void> | void
}

export function useAudioRecorder({ language, continuous = true, onComplete }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const finalTranscriptRef = useRef<string>('')
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(()=> { if (listening && transcript) finalTranscriptRef.current = transcript }, [listening, transcript])
  useEffect(()=> ()=> { if (timerRef.current) window.clearInterval(timerRef.current) }, [])

  const start = useCallback(async ()=> {
    if (!browserSupportsSpeechRecognition) throw new Error('Speech recognition unsupported')
    resetTranscript(); finalTranscriptRef.current=''; chunksRef.current=[]
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    mediaRecorderRef.current = mr
    mr.ondataavailable = ev => { if (ev.data && ev.data.size) chunksRef.current.push(ev.data) }
    mr.onstop = async () => {
      try { stream.getTracks().forEach(t=>t.stop()) } catch {}
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const finalTx = finalTranscriptRef.current.trim() || transcript.trim() || ''
      if (onComplete) await onComplete(blob, finalTx)
      setSeconds(0)
    }
    mr.start()
    SpeechRecognition.startListening({ continuous, language })
    timerRef.current = window.setInterval(()=> setSeconds(s=> s+1), 1000)
    setIsRecording(true)
  }, [browserSupportsSpeechRecognition, continuous, language, onComplete, resetTranscript, transcript])

  const stop = useCallback(()=> {
    if (!isRecording) return
    SpeechRecognition.stopListening()
    finalTranscriptRef.current = transcript || finalTranscriptRef.current
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current=null }
    setIsRecording(false)
    setTimeout(()=> { try { mediaRecorderRef.current?.stop() } catch {} }, 300)
  }, [isRecording, transcript])

  return { isRecording, seconds, start, stop, transcript, listening }
}
