"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react"
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

interface PatientAppointmentsProps {
  patientId: string
  patientName: string
}

export function PatientAppointments({ patientId, patientName }: PatientAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    booked_date: "",
    booked_time: "",
    notes: ""
  })

  useEffect(() => {
    fetchAppointments()
  }, [patientId])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Appointment[]>("/doctor/appointments/")
      // Filter appointments for this specific patient
      const patientAppointments = data.filter(apt => apt.patient.toString() === patientId)
      setAppointments(patientAppointments)
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast.error("Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.booked_date || !formData.booked_time) {
      toast.error("Please fill in date and time")
      return
    }

    try {
      await apiFetch("/doctor/appointments/", {
        method: "POST",
        body: JSON.stringify({
          patient: patientId,
          status: "booked",
          ...formData
        })
      })

      toast.success("Appointment created successfully")

      // Reset form
      setFormData({
        booked_date: "",
        booked_time: "",
        notes: ""
      })
      setShowCreateForm(false)
      fetchAppointments()
    } catch (error: any) {
      console.error("Error creating appointment:", error)
      console.log("Error detail:", error?.detail)
      console.log("Error detail.error:", error?.detail?.error)
      const errorMessage = error?.detail?.error || error?.message || "Failed to create appointment"
      toast.error(errorMessage)
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

      toast.success(`Appointment ${status} successfully`)

      fetchAppointments()
    } catch (error: any) {
      console.error("Error updating appointment:", error)
      const errorMessage = error?.detail?.error || error?.message || "Failed to update appointment"
      toast.error(errorMessage)
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments for {patientName}
          </CardTitle>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Appointment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Create New Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="booked_date">Appointment Date</Label>
                    <Input
                      id="booked_date"
                      type="date"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      value={formData.booked_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, booked_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booked_time">Appointment Time</Label>
                    <Input
                      id="booked_time"
                      type="time"
                      value={formData.booked_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, booked_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Appointment notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Appointment</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No appointments yet
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
      toast.error("Please select date and time")
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