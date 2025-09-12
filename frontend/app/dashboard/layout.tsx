import React from 'react'
import { PatientDashboardLayout } from '@/components/dashboard/patient-dashboard-layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PatientDashboardLayout>{children}</PatientDashboardLayout>
}
