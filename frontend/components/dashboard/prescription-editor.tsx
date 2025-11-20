"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pill, Clock, Plus, Trash2, Save, FileText, Calendar, Timer } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { apiFetch } from '@/lib/api'
import { toast } from "sonner"

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
  onSave?: (prescription: { medicines: Medicine[]; notes: string; duration_days: number }) => void
  onUpdate?: (prescriptionId: number, prescription: { medicines: Medicine[]; notes: string }) => void
  onDelete?: (prescriptionId: number) => void
}

const medicineEmojis = ["💊", "🧴", "💉", "🩹", "🌡️", "🩺", "🧬", "🩸"]
const medicineColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]

const frequencyOptions = [
  { value: "once-daily", label: "Once daily" },
  { value: "twice-daily", label: "Twice daily" },
  { value: "three-times-daily", label: "Three times daily" },
  { value: "four-times-daily", label: "Four times daily" },
  { value: "as-needed", label: "As needed" },
  { value: "every-4-hours", label: "Every 4 hours" },
  { value: "every-6-hours", label: "Every 6 hours" },
  { value: "every-8-hours", label: "Every 8 hours" },
  { value: "every-12-hours", label: "Every 12 hours" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "every-30-minutes", label: "Every 30 minutes (Test)" }
]

const durationOptions = [
  { value: "3-days", label: "3 days" },
  { value: "5-days", label: "5 days" },
  { value: "7-days", label: "1 week" },
  { value: "10-days", label: "10 days" },
  { value: "14-days", label: "2 weeks" },
  { value: "21-days", label: "3 weeks" },
  { value: "30-days", label: "1 month" },
  { value: "60-days", label: "2 months" },
  { value: "90-days", label: "3 months" },
  { value: "ongoing", label: "Ongoing" },
  { value: "as-needed", label: "As needed" }
]

const dosageUnits = [
  { value: "mg", label: "mg" },
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "mcg", label: "mcg" },
  { value: "IU", label: "IU" },
  { value: "units", label: "units" },
  { value: "tablets", label: "tablets" },
  { value: "capsules", label: "capsules" },
  { value: "drops", label: "drops" },
  { value: "puffs", label: "puffs" }
]

export function PrescriptionEditor({ patientId, patientName, onDelete }: PrescriptionEditorProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // New prescription state
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", frequency: "", duration: "", emoji: "💊", color: "#FF6B6B" }
  ])
  const [notes, setNotes] = useState("")
  const [prescriptionDuration, setPrescriptionDuration] = useState("7-days")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (patientId) {
      fetchPrescriptions()
    }
  }, [patientId])

  const fetchPrescriptions = async () => {
    try {
      const data = await apiFetch(`/doctor/patients/${patientId}/prescriptions/`)
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

    const durationDays = parseInt(prescriptionDuration.split('-')[0]) || 7

    setSaving(true)
    try {
      // We need to call the API directly here instead of relying on onSave prop
      // because onSave was originally designed for a different flow
      await apiFetch(`/doctor/patients/${patientId}/prescriptions/`, {
        method: 'POST',
        body: JSON.stringify({ medicines: validMedicines, notes, duration_days: durationDays })
      })

      toast.success("Prescription saved", {
        description: "The prescription has been successfully created."
      })

      // Reset form
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "", emoji: "💊", color: "#FF6B6B" }])
      setNotes("")
      setPrescriptionDuration("7-days")
      setShowAddForm(false)
      // Refresh prescriptions
      fetchPrescriptions()
    } catch (error: any) {
      console.error('Error saving prescription:', error)
      toast.error("Save failed", {
        description: error?.detail ? JSON.stringify(error.detail) : "Could not save prescription."
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrescription = async (prescriptionId: number) => {
    try {
      await apiFetch(`/doctor/patients/${patientId}/prescriptions/`, {
        method: 'DELETE',
        body: JSON.stringify({ prescription_id: prescriptionId })
      })
      setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId))
      toast.success("Prescription deleted", {
        description: "The prescription has been successfully deleted."
      })
      if (onDelete) onDelete(prescriptionId)
    } catch (error: any) {
      console.error('Error deleting prescription:', error)
      toast.error("Delete failed", {
        description: error?.detail ? JSON.stringify(error.detail) : "Could not delete prescription."
      })
    }
  }

  // Create a printable HTML and open print dialog
  const handlePrintPrescriptions = () => {
    try {
      const printable = prescriptions.map(p => {
        const medsHtml = (p.medicines || []).map((m: Medicine) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd">${m.emoji || '💊'} ${m.name}</td>
            <td style="padding:8px;border:1px solid #ddd">${m.dosage || ''}</td>
            <td style="padding:8px;border:1px solid #ddd">${m.frequency || ''}</td>
            <td style="padding:8px;border:1px solid #ddd">${m.duration || ''}</td>
          </tr>
        `).join('')

        return `
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 8px 0">Prescription - ${new Date(p.created_at).toLocaleString()}</h3>
            <table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif"> 
              <thead>
                <tr>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Medicine</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Dosage</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Frequency</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${medsHtml}
              </tbody>
            </table>
            ${p.notes ? `<p style="margin-top:8px"><strong>Notes:</strong> ${p.notes}</p>` : ''}
          </div>
        `
      }).join('\n')

      const html = `
        <html>
          <head>
            <title>Prescriptions - ${patientName}</title>
            <meta name="viewport" content="width=device-width,initial-scale=1" />
          </head>
          <body style="padding:16px;">
            <h1>Prescriptions for ${patientName}</h1>
            ${printable}
          </body>
        </html>
      `

      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.open()
        newWindow.document.write(html)
        newWindow.document.close()
        // Give browser a moment to render before printing
        setTimeout(() => {
          newWindow.print()
        }, 500)
      } else {
        console.error('Unable to open print window')
      }
    } catch (e) {
      console.error('Error printing prescriptions', e)
    }
  }

  const handleSendViaSMS = async () => {
    try {
      const res = await apiFetch(`/doctor/patients/${patientId}/prescriptions/send-sms/`, {
        method: 'POST'
      })
      // apiFetch should throw for non-2xx but handle gracefully
      console.log('Send SMS response', res)
      toast.success('SMS sent to patient (if phone number exists).')
    } catch (err) {
      console.error('Error sending SMS:', err)
      toast.error('Failed to send SMS. Check console for details.')
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
              <div className="flex items-center gap-2">
                <Button onClick={() => handlePrintPrescriptions()} variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Download / Print
                </Button>
                <Button onClick={() => handleSendViaSMS()} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Send via SMS
                </Button>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {showAddForm ? 'Cancel' : 'Add Prescription'}
                </Button>
              </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
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
                      <div className="md:col-span-2">
                        <Label htmlFor={`dosage-${index}`} className="text-xs">Dosage</Label>
                        <div className="flex gap-1">
                          <Input
                            id={`dosage-${index}`}
                            value={medicine.dosage}
                            onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                            placeholder="e.g., 500"
                            className="h-8 flex-1"
                          />
                          <Select
                            value={medicine.dosage.split(' ').pop() || "mg"}
                            onValueChange={(value) => {
                              const currentDosage = medicine.dosage.split(' ')[0] || ""
                              updateMedicine(index, "dosage", `${currentDosage} ${value}`)
                            }}
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dosageUnits.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`frequency-${index}`} className="text-xs">Frequency</Label>
                        <Select
                          value={medicine.frequency}
                          onValueChange={(value) => updateMedicine(index, "frequency", value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`duration-${index}`} className="text-xs">Duration</Label>
                        <Select
                          value={medicine.duration}
                          onValueChange={(value) => updateMedicine(index, "duration", value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {durationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                <Label htmlFor="prescription-duration">Prescription Duration</Label>
                <Select
                  value={prescriptionDuration}
                  onValueChange={setPrescriptionDuration}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select prescription duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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


