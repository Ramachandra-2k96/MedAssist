"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react"
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

export function DoctorAppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Appointment[]>("/doctor/appointments/")
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

  const updateAppointmentStatus = async (appointmentId: number, status: string, bookedDate?: string, bookedTime?: string) => {
    setUpdating(appointmentId)
    try {
      const updateData: any = { status }
      if (bookedDate) updateData.booked_date = bookedDate
      if (bookedTime) updateData.booked_time = bookedTime

      await apiFetch(`/doctor/appointments/${appointmentId}/`, {
        method: "PATCH",
        body: JSON.stringify(updateData)
      })

      toast({
        title: "Success",
        description: `Appointment ${status} successfully`
      })

      // Refresh appointments
      fetchAppointments()
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive"
      })
    } finally {
      setUpdating(null)
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
          <div className="text-center">Loading appointments...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No appointment requests yet
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold">{appointment.patient_name}</span>
                      <span className="text-sm text-muted-foreground">({appointment.patient_phone})</span>
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

                {appointment.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAppointmentStatus(appointment.id, "accepted")}
                      disabled={updating === appointment.id}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                      disabled={updating === appointment.id}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {appointment.status === "accepted" && (
                  <AppointmentBookingForm
                    appointment={appointment}
                    onBook={(date, time) => updateAppointmentStatus(appointment.id, "booked", date, time)}
                    updating={updating === appointment.id}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AppointmentBookingFormProps {
  appointment: Appointment
  onBook: (date: string, time: string) => void
  updating: boolean
}

function AppointmentBookingForm({ appointment, onBook, updating }: AppointmentBookingFormProps) {
  const [bookedDate, setBookedDate] = useState("")
  const [bookedTime, setBookedTime] = useState("")

  const handleBook = () => {
    if (!bookedDate || !bookedTime) {
      toast({
        title: "Error",
        description: "Please select date and time",
        variant: "destructive"
      })
      return
    }
    onBook(bookedDate, bookedTime)
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label htmlFor={`date-${appointment.id}`}>Book Date</Label>
        <Input
          id={`date-${appointment.id}`}
          type="date"
          value={bookedDate}
          onChange={(e) => setBookedDate(e.target.value)}
        />
      </div>
      <div className="flex-1">
        <Label htmlFor={`time-${appointment.id}`}>Book Time</Label>
        <Input
          id={`time-${appointment.id}`}
          type="time"
          value={bookedTime}
          onChange={(e) => setBookedTime(e.target.value)}
        />
      </div>
      <Button
        size="sm"
        onClick={handleBook}
        disabled={updating}
      >
        Book
      </Button>
    </div>
  )
}