"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

interface Doctor {
  id: string
  name: string
  email: string
  photo_url?: string
}

interface AppointmentRequest {
  doctor: string
  requested_start_date: string
  requested_end_date: string
  notes: string
}

export function PatientAppointmentRequest() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<AppointmentRequest>({
    doctor: "",
    requested_start_date: "",
    requested_end_date: "",
    notes: ""
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Doctor[]>("/patient/doctors/")
      setDoctors(data)
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast.error("Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.doctor || !formData.requested_start_date || !formData.requested_end_date) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate dates: start <= end and not in the past
    const now = new Date()
    const start = new Date(formData.requested_start_date)
    const end = new Date(formData.requested_end_date)

    if (end < start) {
      toast.error("End date must be the same or after start date")
      return
    }

    // prevent requesting a range that is entirely in the past
    // allow if start is today or later
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (start < today) {
      toast.error("Start date cannot be in the past")
      return
    }

    setSubmitting(true)
    try {
      await apiFetch("/patient/appointments/", {
        method: "POST",
        body: JSON.stringify(formData)
      })
      toast.success("Appointment request sent successfully")
      // Reset form
      setFormData({
        doctor: "",
        requested_start_date: "",
        requested_end_date: "",
        notes: ""
      })
    } catch (error: any) {
      console.error("Error submitting appointment request:", error)
      const errorMessage = error?.detail?.error || error?.message || "Failed to send appointment request"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof AppointmentRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading doctors...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Request Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctor">Select Doctor</Label>
            <Select value={formData.doctor} onValueChange={(value) => handleInputChange("doctor", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {doctor.name} ({doctor.email})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Preferred Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.requested_start_date}
                onChange={(e) => handleInputChange("requested_start_date", e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Preferred End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.requested_end_date}
                onChange={(e) => handleInputChange("requested_end_date", e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe your symptoms or reason for appointment..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending Request..." : "Send Appointment Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}