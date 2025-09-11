"use client";
import React from "react";
import { AppointmentReminders } from "@/components/dashboard/appointment-reminders";
import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout";

// still mock for now
const appointments = [
  { id:"1", doctor:"Dr. Smith", date:"2025-09-05", time:"10:00 AM", type:"General Checkup", location:"City Hospital", status:"upcoming" as const },
  { id:"2", doctor:"Dr. Johnson", date:"2025-09-10", time:"2:00 PM", type:"Follow-up", status:"upcoming" as const }
];

export default function AppointmentsPage(){
  return (
    <PatientDashboardLayout>
      <AppointmentReminders appointments={appointments} />
    </PatientDashboardLayout>
  )
}
