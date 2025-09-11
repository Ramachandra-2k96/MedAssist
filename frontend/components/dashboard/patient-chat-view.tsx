"use client"
import { useEffect, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { API_BASE_URL } from '@/lib/config'

interface ChatMessage {
  id: number|string
  text: string
  sender: string
  timestamp: string
  doctor_name?: string
}

export function PatientChatView({ doctorId }: { doctorId: number | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{ fetchMessages() }, [doctorId])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  const fetchMessages = async () => {
    if (!doctorId) return
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const url = new URL(`${API_BASE_URL}/patient/chat/`)
      url.searchParams.set('doctor_id', String(doctorId))
      const resp = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } })
      if (resp.ok) setMessages(await resp.json())
    } catch(e){ console.error(e) }
  }

  const sendMessage = async () => {
    if (!input.trim() || !doctorId) return
    const local = { id: Date.now(), text: input, sender: 'patient', timestamp: new Date().toISOString() }
    setMessages(prev=> [...prev, local])
    const msg = input; setInput('')
    try {
      const token = localStorage.getItem('access_token')
      await fetch(`${API_BASE_URL}/patient/chat/`, { method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'}, body: JSON.stringify({ text: msg, doctor: doctorId }) })
      fetchMessages()
    } catch(e){ console.error(e) }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full border rounded p-2">
          {messages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No messages</p> : (
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender==='patient' ? 'justify-end':'justify-start'}`}>
                  <div className={`max-w-xs p-2 rounded-lg ${m.sender==='patient' ? 'bg-primary text-primary-foreground':'bg-muted'}`}>
                    <p className="text-xs opacity-70 mb-1">{m.sender==='patient' ? 'You' : (m.doctor_name || 'Doctor')}</p>
                    <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                    <p className="text-[10px] opacity-60">{new Date(m.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Input value={input} onChange={e=>setInput(e.target.value)} placeholder={doctorId? 'Type a message':'Select a doctor'} disabled={!doctorId} onKeyDown={e=> { if(e.key==='Enter') sendMessage() }} />
          <Button onClick={sendMessage} disabled={!doctorId}>Send</Button>
        </div>
      </CardContent>
    </Card>
  )
}