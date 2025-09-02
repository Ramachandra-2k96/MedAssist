"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconUsers,
  IconMicrophone,
  IconFileText,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PatientList } from "@/components/dashboard/patient-list";
import { VoiceRecorder } from "@/components/dashboard/voice-recorder";
import { PrescriptionEditor } from "@/components/dashboard/prescription-editor";
import { PatientRecords } from "@/components/dashboard/patient-records";
import { PatientRecordings } from "@/components/dashboard/patient-recordings";
import { PatientChat } from "@/components/dashboard/patient-chat";
import { getDoctorSidebarLinks, DoctorLogo, DoctorLogoIcon } from "@/components/dashboard/doctor-sidebar";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DoctorDashboard() {
  const params = useParams();
  const hash = params.hash as string;

  const links = getDoctorSidebarLinks(hash);
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-auto md:overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <DoctorLogo /> : <DoctorLogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Dr. Smith",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <DoctorDashboardContent />
    </div>
  );
}
// Dummy dashboard component with content
const DoctorDashboardContent = () => {
  // Mock data
  const patients = [
    {
      id: "1",
      name: "John Doe",
      phone: "+1234567890",
      email: "john@example.com",
      lastVisit: "2025-08-20",
      status: "active" as const,
      adherence: 85
    },
    {
      id: "2",
      name: "Jane Smith",
      phone: "+1234567891",
      email: "jane@example.com",
      lastVisit: "2025-08-15",
      status: "active" as const,
      adherence: 92
    },
    {
      id: "3",
      name: "Bob Johnson",
      phone: "+1234567892",
      email: "bob@example.com",
      lastVisit: "2025-07-30",
      status: "inactive" as const,
      adherence: 45
    }
  ]

  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)

  const handleSelectPatient = (patient: typeof patients[0]) => {
    setSelectedPatient(patient)
  }

  const handleRecordingComplete = (audioBlob: Blob) => {
    console.log("Recording completed:", audioBlob)
    // Here you would typically send the audio to a speech-to-text service
  }

  const handleSavePrescription = (prescription: { medicines: any[]; notes: string }) => {
    console.log("Saving prescription:", prescription)
    // Here you would save the prescription to the backend
  }

  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
        {!selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientList patients={patients} onSelectPatient={handleSelectPatient} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Patient: {selectedPatient.name}</h2>
              <Button onClick={() => setSelectedPatient(null)}>Back to Patients</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PatientRecords patientId={selectedPatient.id} patientName={selectedPatient.name} />
              <PatientRecordings patientId={selectedPatient.id} patientName={selectedPatient.name} />
            </div>
            <PatientChat patientId={selectedPatient.id} patientName={selectedPatient.name} />
            <PrescriptionEditor
              patientName={selectedPatient.name}
              onSave={handleSavePrescription}
            />
          </div>
        )}
      </div>
    </div>
  );
};
