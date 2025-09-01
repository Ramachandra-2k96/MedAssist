"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Phone, Mail } from "lucide-react"

interface Patient {
  id: string
  name: string
  phone: string
  email: string
  lastVisit: string
  status: "active" | "inactive"
  adherence: number // percentage
}

interface PatientListProps {
  patients: Patient[]
  onSelectPatient: (patient: Patient) => void
}

export function PatientList({ patients, onSelectPatient }: PatientListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Patients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{patient.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{patient.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {patient.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {patient.email}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Last visit: {patient.lastVisit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                  {patient.status}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">{patient.adherence}%</p>
                  <p className="text-xs text-muted-foreground">Adherence</p>
                </div>
                <Button variant="outline" onClick={() => onSelectPatient(patient)}>
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
