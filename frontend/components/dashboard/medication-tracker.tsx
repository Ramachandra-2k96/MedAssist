"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface MedicationLog {
  id: string | number
  prescription: number
  prescription_title: string
  medicine_name: string
  scheduled_time: string
  taken_at: string | null
  status: 'pending' | 'taken' | 'missed'
}

export function MedicationTracker() {
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | number | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/patient/medication-logs/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error fetching medication logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsTaken = async (logId: string | number) => {
    setMarking(logId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/patient/medication-logs/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ log_id: logId })
      })
      if (response.ok) {
        // Refresh logs
        fetchLogs()
      }
    } catch (error) {
      console.error('Error marking as taken:', error)
    } finally {
      setMarking(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Medication Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Loading medication schedule...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Medication Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No upcoming medications.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💊</div>
                  <div>
                    <h4 className="font-semibold">{log.medicine_name}</h4>
                    <p className="text-sm text-muted-foreground">{log.prescription_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {new Date(log.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      log.status === 'taken' ? 'default' :
                      log.status === 'missed' ? 'destructive' : 'secondary'
                    }
                    className="flex items-center gap-1"
                  >
                    {log.status === 'taken' ? <CheckCircle className="h-3 w-3" /> :
                     log.status === 'missed' ? <AlertCircle className="h-3 w-3" /> :
                     <Clock className="h-3 w-3" />}
                    {log.status}
                  </Badge>
                  {log.status === 'pending' && (
                    <Button
                      onClick={() => markAsTaken(log.id)}
                      disabled={marking === log.id}
                      size="sm"
                    >
                      {marking === log.id ? 'Marking...' : 'Mark Taken'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}