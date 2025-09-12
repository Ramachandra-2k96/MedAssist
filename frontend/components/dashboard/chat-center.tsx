"use client"
import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch, buildQuery } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

interface ChatMessage { id: number|string; text: string; sender: string; timestamp: string; doctor_name?: string }

interface ChatCenterProps {
  mode: 'doctor' | 'patient' | 'bot'
  patientId?: string
  doctorId?: number | null
}

export function ChatCenter({ mode, patientId, doctorId }: ChatCenterProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement|null>(null)
  const { toast } = useToast()

  useEffect(()=> { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])
  useEffect(()=> { if (mode !== 'bot') fetchMessages() }, [patientId, doctorId, mode])

  const fetchMessages = async () => {
    if (mode==='bot') return
    try {
      setLoading(true)
      if (mode==='doctor' && patientId) {
        const data = await apiFetch<ChatMessage[]>(`/doctor/patients/${patientId}/chat/`)
        setMessages(data||[])
      } else if (mode==='patient') {
        const qs = buildQuery({ doctor_id: doctorId })
        const data = await apiFetch<ChatMessage[]>(`/patient/chat/${qs}`)
        setMessages(data||[])
      }
    } catch(e:any){ console.error(e); toast({ title:'Failed to load chat', description: e?.detail ? JSON.stringify(e.detail): String(e), variant:'destructive' as any }) } finally { setLoading(false) }
  }

  const sendMessage = async () => {
  if (!input.trim()) return
  if (mode==='patient' && !doctorId) { toast({ title:'Select a doctor', description:'Choose a doctor to send a message.', variant:'destructive' as any }); return }
    const local = { id: Date.now(), text: input, sender: mode==='doctor'? 'doctor':'patient', timestamp: new Date().toISOString() }
    setMessages(prev=> [...prev, local])
    const msg = input; setInput('')
    try {
      if (mode==='bot') {
        // naive echo for now
        setTimeout(()=> setMessages(prev=> [...prev, { id: Date.now()+1, text: 'Bot: '+msg, sender: 'bot', timestamp: new Date().toISOString() }]), 400)
        return
      }
      if (mode==='doctor' && patientId) {
        await apiFetch(`/doctor/patients/${patientId}/chat/`, { method:'POST', body: JSON.stringify({ text: msg }) })
      } else if (mode==='patient' && doctorId) {
        await apiFetch(`/patient/chat/`, { method:'POST', body: JSON.stringify({ text: msg, doctor: doctorId }) })
      }
      fetchMessages()
    } catch(e:any){ console.error(e); toast({ title:'Send failed', description: e?.detail ? JSON.stringify(e.detail): String(e), variant:'destructive' as any }) }
  }

  return (
    <Card>
      <CardHeader><CardTitle>{mode==='bot'? 'Health Assistant' : 'Chat'}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full border rounded p-2">
          {loading ? <p className="text-sm text-muted-foreground text-center py-4">Loading...</p> : (
            messages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No messages</p> : (
              <div className="space-y-2">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender==='patient' ? 'justify-end':'justify-start'}`}>
                    <div className={`max-w-xs p-2 rounded-lg ${m.sender==='patient' ? 'bg-primary text-primary-foreground':'bg-muted'}`}>
                      <p className="text-xs opacity-70 mb-1">{m.sender==='patient' ? 'You' : (m.doctor_name || (m.sender==='doctor'? 'Doctor':'Bot'))}</p>
                      <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                      <p className="text-[10px] opacity-60">{new Date(m.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Input value={input} onChange={e=> setInput(e.target.value)} placeholder='Type a message' onKeyDown={e=> { if(e.key==='Enter') sendMessage() }} />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  )
}
