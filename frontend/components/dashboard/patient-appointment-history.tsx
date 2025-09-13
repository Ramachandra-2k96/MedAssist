"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface Appointment {
  id: number
  doctor: number
  doctor_name: string
  patient: number
  patient_name: string
  patient_phone: string
  requested_start_date: string | null
  requested_end_date: string | null
  status: "pending" | "accepted" | "booked" | "cancelled"
  booked_date: string | null
  booked_time: string | null
  notes: string
  created_at: string
  updated_at: string
}

export function PatientAppointmentHistory() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Appointment[]>("/patient/appointments/")
      setAppointments(data)
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
      case "accepted":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
      case "booked":
        return <Badge variant="default"><Calendar className="h-3 w-3 mr-1" />Booked</Badge>
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your appointments...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          My Appointment Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No appointment requests yet. Request an appointment from your dashboard.
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold">{appointment.doctor_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Requested: {appointment.requested_start_date} to {appointment.requested_end_date}
                    </div>
                    {appointment.notes && (
                      <div className="text-sm mb-2">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                    {appointment.booked_date && appointment.booked_time && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Calendar className="h-4 w-4" />
                        Booked for {appointment.booked_date} at {appointment.booked_time}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(appointment.status)}
                    <div className="text-xs text-muted-foreground">
                      {new Date(appointment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}