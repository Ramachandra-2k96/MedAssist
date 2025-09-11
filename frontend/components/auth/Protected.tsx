"use client"

import { useEffect } from "react"
import { isTokenValid } from "@/lib/auth"

export default function Protected({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token')
      if (!isTokenValid(token)) {
        window.location.href = '/login'
      }
    } catch (e) {
      window.location.href = '/login'
    }
  }, [])

  return <>{children}</>
}
