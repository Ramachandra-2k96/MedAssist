"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

interface Appointment {
  id: string
  doctor: string
  date: string
  time: string
  type: string
  location?: string
  status: "upcoming" | "completed" | "missed"
}

interface AppointmentRemindersProps {
  appointments: Appointment[]
}

export function AppointmentReminders({ appointments }: AppointmentRemindersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold">{appointment.doctor}</h3>
                <p className="text-sm text-muted-foreground">{appointment.type}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4" />
                    {appointment.date}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {appointment.time}
                  </div>
                  {appointment.location && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {appointment.location}
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  appointment.status === "upcoming"
                    ? "default"
                    : appointment.status === "completed"
                    ? "secondary"
                    : "destructive"
                }
              >
                {appointment.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
