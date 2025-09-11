"use client";
import React from "react";
import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout";
import { PatientAudioSection } from "@/components/dashboard/patient-audio-section";

export default function RecordingsPage(){
  return (
    <PatientDashboardLayout>
      <PatientAudioSection doctorId={null} />
    </PatientDashboardLayout>
  )
}
