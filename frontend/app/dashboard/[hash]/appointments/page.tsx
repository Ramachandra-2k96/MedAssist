"use client";
import React from 'react'
import { PatientAppointmentHistory } from '@/components/dashboard/patient-appointment-history'

export default function AppointmentsPage(){
  return (
    <div className="space-y-6">
      <PatientAppointmentHistory />
    </div>
  )
}
