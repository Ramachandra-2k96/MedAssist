"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Clock } from "lucide-react"
import { getMedicationIconStyle } from "@/lib/medication-utils"

interface Medicine {
  name: string
  dosage: string
  timing: string
  color: string
  shape: string
  emoji: string
  doctorName?: string
}

interface MedicineScheduleProps {
  medicines: Medicine[]
  hasPendingDoses?: boolean
  onMarkTaken?: () => void
}

export function MedicineSchedule({ medicines, hasPendingDoses = false, onMarkTaken }: MedicineScheduleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medicine Schedule
          </div>
          {hasPendingDoses && onMarkTaken && (
            <Button onClick={onMarkTaken} size="sm" className="flex items-center gap-2">
              <span className="text-lg">💊</span>
              Take Medication
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {medicines.map((medicine, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div style={getMedicationIconStyle(medicine.name)} className="text-2xl flex items-center justify-center">
                  {medicine.emoji}
                </div>
                <div>
                  <h3 className="font-semibold">{medicine.name}</h3>
                  <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                  {medicine.doctorName && (
                    <p className="text-xs text-muted-foreground">{medicine.doctorName.startsWith('Dr.') ? medicine.doctorName : `Dr. ${medicine.doctorName}`}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {medicine.timing}
                </Badge>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: medicine.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
