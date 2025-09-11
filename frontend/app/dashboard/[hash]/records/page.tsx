"use client";
import React from "react";
import { PatientSelfRecords } from "@/components/dashboard/patient-self-records";
import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout";

export default function RecordsPage(){
  // doctor filter handled inside component when integrated from dashboard route; here allow all by passing null
  return (
    <PatientDashboardLayout>
      <PatientSelfRecords doctorId={null} />
    </PatientDashboardLayout>
  )
}
