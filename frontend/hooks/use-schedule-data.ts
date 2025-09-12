import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Medicine { id?: string; name: string; dosage: string; timing: string; color: string; shape?: string; emoji: string; doctorName?: string }
interface Appointment { id: string; doctor: string; date: string; time: string; type: string; location?: string; status: string }

export function useScheduleData(enable:boolean) {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=> { if(!enable) return; (async()=> { setLoading(true); try { const [m,a] = await Promise.all([ apiFetch<Medicine[]>('/patient/medicines/').catch(()=>[]), apiFetch<Appointment[]>('/patient/appointments/').catch(()=>[]) ]); setMedicines(m||[]); setAppointments(a||[]) } finally { setLoading(false) } })() }, [enable])

  return { medicines, appointments, loading }
}
