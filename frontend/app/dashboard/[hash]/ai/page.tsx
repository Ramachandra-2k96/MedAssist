"use client"
import React from 'react'
import Protected from '@/components/auth/Protected'
import { AIChat } from '@/components/dashboard/ai-chat'
import { useParams } from 'next/navigation'

export default function AIPage() {
  const params = useParams()
  const hash = params.hash
  return (
    <Protected>
      <AIChat />
    </Protected>
  )
}
