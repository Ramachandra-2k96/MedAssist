"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

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

export function DoctorAppointmentRequests() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

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
      toast.error("Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  // Precompute currently booked slots for the doctor to help client-side validation
  const bookedSlots = appointments
    .filter((a) => a.status === 'booked' && a.booked_date && a.booked_time)
    .map((a) => `${a.booked_date} ${a.booked_time}`)

  const updateAppointmentStatus = async (appointmentId: number, status: string, bookedDate?: string, bookedTime?: string) => {
    try {
      const updateData: any = { status }
      if (bookedDate) updateData.booked_date = bookedDate
      if (bookedTime) updateData.booked_time = bookedTime

      await apiFetch(`/doctor/appointments/${appointmentId}/`, {
        method: "PATCH",
        body: JSON.stringify(updateData)
      })

      toast.success(`Appointment ${status} successfully`)

      fetchAppointments()
    } catch (error: any) {
      console.error("Error updating appointment:", error)
      const errorMessage = error?.detail?.error || error?.message || "Failed to update appointment"
      toast.error(errorMessage)
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
          <div className="text-center">Loading appointment requests...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          All Appointment Requests
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
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {appointment.status === "accepted" && (
                  <AppointmentBookingForm
                    appointment={appointment}
                    bookedSlots={bookedSlots}
                    onBook={(date, time) => updateAppointmentStatus(appointment.id, "booked", date, time)}
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
}

function AppointmentBookingForm({ appointment, onBook, bookedSlots }: AppointmentBookingFormProps & { bookedSlots: string[] }) {
  const [bookedDate, setBookedDate] = useState("")
  const [bookedTime, setBookedTime] = useState("")

  const handleBook = () => {
    if (!bookedDate || !bookedTime) {
      toast.error("Please select date and time")
      return
    }

    // Validate that the selected date/time is not in the past
    const now = new Date()
    const selectedDateTime = new Date(`${bookedDate}T${bookedTime}`)
    if (selectedDateTime < now) {
      toast.error("Selected date/time cannot be in the past")
      return
    }

    // Validate that the selected date is within the patient's requested range
    const selectedDate = new Date(bookedDate)
    const startDate = appointment.requested_start_date ? new Date(appointment.requested_start_date) : null
    const endDate = appointment.requested_end_date ? new Date(appointment.requested_end_date) : null

    if (startDate && selectedDate < startDate) {
      toast.error("Selected date must be on or after the requested start date")
      return
    }

    if (endDate && selectedDate > endDate) {
      toast.error("Selected date must be on or before the requested end date")
      return
    }

    // Check whether the slot is already taken
    const slotKey = `${bookedDate} ${bookedTime}`
    if (bookedSlots.includes(slotKey)) {
      toast.error("Selected slot is already booked. Choose another time or date.")
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
          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
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
      >
        Book
      </Button>
    </div>
  )
}