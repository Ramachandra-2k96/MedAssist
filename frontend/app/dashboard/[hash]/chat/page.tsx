"use client";
import React, { useEffect, useState, useRef } from 'react'
import { API_BASE_URL } from '@/lib/config'
import { apiFetch, buildQuery } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { Send, Mic, MicOff, Bot, User, Stethoscope } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string | number
  text: string
  sender: 'patient' | 'doctor'
  timestamp: string
  doctor_name?: string
}

export default function ChatPage(){
  const [linkedDoctors, setLinkedDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number|null>(null);
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const onComplete = async (blob: Blob, transcript: string) => {
    // Keep the final transcript when recording stops
    setText(prev => (prev ? `${prev} ${transcript}`.trim() : transcript))
  }

  const { isRecording, start, stop, seconds, transcript: liveTranscript } = useAudioRecorder({ language: 'en-US', continuous: true, onComplete })

  // Update text in realtime while recording
  useEffect(() => {
    if (isRecording && liveTranscript) {
      setText(liveTranscript)
    }
  }, [isRecording, liveTranscript])

  useEffect(()=>{ (async()=>{
    try { const data = await apiFetch('/patient/doctors/'); setLinkedDoctors(data); if(!selectedDoctorId && data.length) setSelectedDoctorId(data[0].id); } catch(e){ console.error(e)}
  })(); }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchMessages()
    }
  }, [selectedDoctorId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      setFetchLoading(true)
      const qs = buildQuery({ doctor_id: selectedDoctorId })
      const data = await apiFetch<Message[]>(`/patient/chat/${qs}`)
      setMessages(data || [])
    } catch(e:any){
      console.error(e);
      toast({
        title:'Failed to load chat',
        description: e?.detail ? JSON.stringify(e.detail): String(e),
        variant:'destructive' as any
      })
    } finally {
      setFetchLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!text.trim() || !selectedDoctorId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'patient',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    const msg = text.trim()
    setText('')
    setLoading(true)

    try {
      await apiFetch(`/patient/chat/`, {
        method: 'POST',
        body: JSON.stringify({ text: msg, doctor: selectedDoctorId })
      })
      fetchMessages()
    } catch(e:any){
      console.error(e);
      toast({
        title:'Send failed',
        description: e?.detail ? JSON.stringify(e.detail): String(e),
        variant:'destructive' as any
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedDoctor = linkedDoctors.find(d => d.id === selectedDoctorId)

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900 pb-2 h-full">
      {/* Doctor Selection Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Stethoscope className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
            {selectedDoctor ? `Chat with Dr. ${selectedDoctor.name}` : 'Select a Doctor'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            {selectedDoctor ? 'Discuss your health concerns' : 'Choose a doctor to start chatting'}
          </p>
        </div>
      </div>

      {/* Doctor Selection */}
      <div className="p-3 sm:p-4 border-b bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Select Doctor</p>
          <div className="flex flex-wrap gap-2">
            {linkedDoctors.map(d=> (
              <Button
                key={d.id}
                size="sm"
                variant={selectedDoctorId===d.id? 'default':'outline'}
                onClick={()=> setSelectedDoctorId(d.id)}
                className="text-xs"
              >
                {d.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
        {fetchLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 px-4">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm mt-2">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 px-4">
            <Stethoscope className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-base sm:text-lg font-medium">Start a conversation</p>
            <p className="text-xs sm:text-sm mt-1">Send a message to your doctor or use voice input.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 sm:gap-3 ${
                message.sender === 'patient' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'doctor' && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                  message.sender === 'patient'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed break-words">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.sender === 'patient' && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 sm:px-4 sm:py-2 border">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="pr-10 sm:pr-12 rounded-full border-gray-300 dark:border-gray-600 focus:border-blue-500 text-sm sm:text-base"
              disabled={loading || !selectedDoctorId}
            />
            <Button
              onClick={() => isRecording ? stop() : start()}
              variant="ghost"
              size="sm"
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-6 h-6 sm:w-8 sm:h-8 p-0 ${
                isRecording ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'
              }`}
              disabled={loading || !selectedDoctorId}
            >
              {isRecording ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!text.trim() || loading || !selectedDoctorId}
            className="rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 bg-blue-500 hover:bg-blue-600 flex-shrink-0"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-red-500">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording... {seconds}s
          </div>
        )}
        {!selectedDoctorId && (
          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-gray-500">
            Please select a doctor to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
