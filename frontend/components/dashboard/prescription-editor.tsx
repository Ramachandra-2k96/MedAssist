"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Pill, Clock, Plus, Trash2, Save, FileText } from "lucide-react"

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  emoji?: string
  color?: string
}

interface Prescription {
  id: number
  medicines: Medicine[]
  notes: string
  created_at: string
}

interface PrescriptionEditorProps {
  patientName: string
  patientId: string
  onSave: (prescription: { medicines: Medicine[]; notes: string }) => void
  onUpdate?: (prescriptionId: number, prescription: { medicines: Medicine[]; notes: string }) => void
  onDelete?: (prescriptionId: number) => void
}

const medicineEmojis = ["💊", "🧴", "💉", "🩹", "🌡️", "🩺", "🧬", "🩸"]
const medicineColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]

export function PrescriptionEditor({ patientName, patientId, onSave }: PrescriptionEditorProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", frequency: "", duration: "", emoji: "💊", color: "#FF6B6B" }
  ])
  const [notes, setNotes] = useState("")
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (patientId) {
      fetchPrescriptions()
    }
  }, [patientId])

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/doctor/patients/${patientId}/prescriptions/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Add default emoji and color to medicines that don't have them
        const processedData = data.map((prescription: Prescription) => ({
          ...prescription,
          medicines: prescription.medicines.map((medicine: Medicine) => ({
            ...medicine,
            emoji: medicine.emoji || medicineEmojis[Math.floor(Math.random() * medicineEmojis.length)],
            color: medicine.color || medicineColors[Math.floor(Math.random() * medicineColors.length)]
          }))
        }))
        setPrescriptions(processedData)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMedicine = () => {
    const randomEmoji = medicineEmojis[Math.floor(Math.random() * medicineEmojis.length)]
    const randomColor = medicineColors[Math.floor(Math.random() * medicineColors.length)]
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", emoji: randomEmoji, color: randomColor }])
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

  const handleSave = async () => {
    // Filter out empty medicines
    const validMedicines = medicines.filter(med => med.name.trim() !== "")
    if (validMedicines.length === 0) return

    setSaving(true)
    try {
      await onSave({ medicines: validMedicines, notes })
      // Reset form
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "", emoji: "💊", color: "#FF6B6B" }])
      setNotes("")
      setShowAddForm(false)
      // Refresh prescriptions
      fetchPrescriptions()
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrescription = async (prescriptionId: number) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/doctor/patients/${patientId}/prescriptions/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prescription_id: prescriptionId })
      })

      if (response.ok) {
        setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId))
      }
    } catch (error) {
      console.error('Error deleting prescription:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Prescriptions for {patientName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Existing Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Existing Prescriptions
              </Label>
              <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? 'Cancel' : 'Add Prescription'}
              </Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading prescriptions...</p>
            ) : prescriptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No prescriptions found.</p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(prescription.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePrescription(prescription.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {prescription.medicines.map((medicine, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{medicine.emoji || "💊"}</div>
                            <div>
                              <h4 className="font-semibold">{medicine.name}</h4>
                              <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {medicine.frequency}
                            </Badge>
                            <Badge variant="secondary">{medicine.duration}</Badge>
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: medicine.color || "#FF6B6B" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {prescription.notes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Notes:</Label>
                        <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">{prescription.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Prescription Form */}
          {showAddForm && (
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
              <Label className="text-base font-semibold mb-4 block">Add New Prescription</Label>

              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
                    <div className="text-2xl">{medicine.emoji}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                      <div>
                        <Label htmlFor={`name-${index}`} className="text-xs">Medicine Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={medicine.name}
                          onChange={(e) => updateMedicine(index, "name", e.target.value)}
                          placeholder="e.g., Paracetamol"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`dosage-${index}`} className="text-xs">Dosage</Label>
                        <Input
                          id={`dosage-${index}`}
                          value={medicine.dosage}
                          onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                          placeholder="e.g., 500mg"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`frequency-${index}`} className="text-xs">Frequency</Label>
                        <Input
                          id={`frequency-${index}`}
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                          placeholder="e.g., 3 times/day"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`duration-${index}`} className="text-xs">Duration</Label>
                        <Input
                          id={`duration-${index}`}
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                          placeholder="e.g., 7 days"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedicine(index)}
                      disabled={medicines.length === 1}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={addMedicine} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>

              <div className="mt-4">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Prescription'}
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
