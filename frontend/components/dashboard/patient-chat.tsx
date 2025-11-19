"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: number
  text: string
  sender: string
  timestamp: string
}

interface PatientChatProps {
  patientId: string
  patientName: string
}

export function PatientChat({ patientId, patientName }: PatientChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (patientId) {
      fetchMessages()
    }
  }, [patientId])

  const fetchMessages = async () => {
    try {
      const data = await apiFetch<Message[]>(`/doctor/patients/${patientId}/chat/`)
      setMessages(data || [])
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast({
        variant: "destructive",
        title: "Error fetching messages",
        description: error?.detail ? JSON.stringify(error.detail) : "Could not load chat history."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const data = await apiFetch<Message>(`/doctor/patients/${patientId}/chat/`, { method: 'POST', body: JSON.stringify({ text: newMessage }) })
      if (data) {
        setMessages(prev => [...prev, data])
        setNewMessage("")
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error?.detail ? JSON.stringify(error.detail) : "Could not send message."
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Chat with {patientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full border rounded p-2">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No messages yet.</p>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "doctor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-2 rounded-lg ${
                      message.sender === "doctor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
            disabled={sending}
          />
          <Button onClick={handleSendMessage} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
