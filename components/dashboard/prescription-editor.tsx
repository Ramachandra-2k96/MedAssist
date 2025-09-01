"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface PrescriptionEditorProps {
  patientName: string
  onSave: (prescription: { medicines: Medicine[]; notes: string }) => void
}

export function PrescriptionEditor({ patientName, onSave }: PrescriptionEditorProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ])
  const [notes, setNotes] = useState("")

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }])
  }

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updatedMedicines = medicines.map((medicine, i) =>
      i === index ? { ...medicine, [field]: value } : medicine
    )
    setMedicines(updatedMedicines)
  }

  const handleSave = () => {
    onSave({ medicines, notes })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescription for {patientName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Medicines</Label>
            <div className="space-y-4 mt-2">
              {medicines.map((medicine, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label htmlFor={`name-${index}`}>Medicine Name</Label>
                    <Input
                      id={`name-${index}`}
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, "name", e.target.value)}
                      placeholder="e.g., Paracetamol"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                    <Input
                      id={`dosage-${index}`}
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                    <Input
                      id={`frequency-${index}`}
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                      placeholder="e.g., 3 times/day"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`duration-${index}`}>Duration</Label>
                    <Input
                      id={`duration-${index}`}
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                      placeholder="e.g., 7 days"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedicine(index)}
                      disabled={medicines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={addMedicine} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Prescription
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
