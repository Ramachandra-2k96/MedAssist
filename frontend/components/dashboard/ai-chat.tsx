"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { API_BASE_URL } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { Send, Mic, MicOff, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const sendMessage = async () => {
    if (!text.trim()) return
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setText('')
    setLoading(true)

    // Generate session ID if not present
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID()
      setSessionId(currentSessionId)
    }

    try {
      const data = await apiFetch('/patient/ai-chat/', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage.text, session_id: currentSessionId })
      })
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'No reply',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (e: any) {
      console.error('AI chat failed', e)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: e.status === 401 || e.status === 403
          ? 'Authentication error. Redirecting to login...'
          : 'Sorry, I couldn\'t process your message. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900 pb-2 h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">AI Assistant</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Ask me anything about your health</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 px-4">
            <Bot className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-base sm:text-lg font-medium">Welcome to AI Chat</p>
            <p className="text-xs sm:text-sm mt-1">Start a conversation by typing a message or using voice input.</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 sm:gap-3 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'ai' && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
              }`}
            >
              {message.sender === 'ai' ? (
                <div className="text-sm sm:text-base leading-relaxed break-words prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm sm:text-base leading-relaxed break-words">{message.text}</p>
              )}
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.sender === 'user' && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
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
              disabled={loading}
            />
            <Button
              onClick={() => isRecording ? stop() : start()}
              variant="ghost"
              size="sm"
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-6 h-6 sm:w-8 sm:h-8 p-0 ${
                isRecording ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'
              }`}
              disabled={loading}
            >
              {isRecording ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!text.trim() || loading}
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
      </div>
    </div>
  )
}

export default AIChat
