"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PatientList } from "@/components/dashboard/patient-list";
import PatientView from "@/components/dashboard/patient-view";
import { DoctorAppointmentRequests } from "@/components/dashboard/doctor-appointment-requests";
import { getDoctorSidebarLinks, DoctorLogo, DoctorLogoIcon } from "@/components/dashboard/doctor-sidebar";
import Protected from "@/components/auth/Protected";
import { API_BASE_URL, MEDIA_BASE_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";
import { Stethoscope } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: "active" | "inactive";
  adherence: number;
}

export default function DoctorDashboard() {
  const params = useParams();
  const hash = params.hash as string;

  const links = getDoctorSidebarLinks(hash);
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  useEffect(() => {
    fetchPatients();
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const data = await apiFetch('/doctor/profile/')
      setDoctorProfile(data)
    } catch (error) {
      console.error('Error fetching doctor profile:', error)
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await apiFetch('/doctor/patients/')
      const formattedPatients: Patient[] = data
        .filter((dp: any) => dp.patient && dp.patient.id) // Filter out invalid entries
        .map((dp: any) => ({
          id: dp.patient.id?.toString() || '',
          name: dp.patient_name || dp.patient.profile?.name || dp.patient.username || 'Unknown',
          phone: dp.phone || '',
          email: dp.patient.email || '',
          lastVisit: dp.added_at?.split('T')[0] || '',
          status: 'active' as const,
          adherence: 85, // Mock
        }))
        .filter((patient: Patient) => patient.id && patient.name); // Filter out patients without id or name
      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
    setLoading(false);
  };

  const handleAddPatient = async (patientData: { name: string; phone: string; email: string }) => {
    try {
      await apiFetch('/doctor/patients/', {
        method: 'POST',
        body: JSON.stringify({ email: patientData.email }),
      })
      fetchPatients() // Refresh list
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleSelectPatient = (patient: Patient | null) => {
    setSelectedPatient(patient);
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    console.log("Recording completed:", audioBlob);
    // Upload to backend
    if (selectedPatient) {
      uploadAudio(audioBlob);
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    if (!selectedPatient) return;
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    formData.append('transcription', 'Mock transcription'); // In real, get from API

    try {
      await apiFetch(`/doctor/patients/${selectedPatient.id}/audio/`, {
        method: 'POST',
        body: formData,
        asForm: true,
      })
      console.log('Audio uploaded');
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const handleSavePrescription = (prescription: { medicines: any[]; notes: string; duration_days: number }) => {
    console.log("Saving prescription:", prescription);
    if (selectedPatient) {
      savePrescription(prescription);
    }
  };

  const savePrescription = async (prescription: { medicines: any[]; notes: string; duration_days: number }) => {
    if (!selectedPatient) return;
    try {
      await apiFetch(`/doctor/patients/${selectedPatient.id}/prescriptions/`, {
        method: 'POST',
        body: JSON.stringify(prescription),
      })
      console.log('Prescription saved');
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
  <Protected>
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
            {doctorProfile && (
              <SidebarLink
                link={{
                  label: open ? (doctorProfile.name || doctorProfile.user?.email || "Doctor") : "",
                  href: "#",
                   icon: doctorProfile.photo_url ? (
                     <img
                       src={`${MEDIA_BASE_URL}${doctorProfile.photo_url}`}
                       className="h-7 w-7 shrink-0 rounded-full"
                       width={28}
                       height={28}
                       alt="Doctor Avatar"
                     />
                   ) : (
                    <div className="h-7 w-7 shrink-0 rounded-full bg-blue-500 flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-white" />
                    </div>
                  ),
                }}
              />
            )}
          </div>
        </SidebarBody>
      </Sidebar>
      <DoctorDashboardContent
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={handleSelectPatient}
        onAddPatient={handleAddPatient}
        onRecordingComplete={handleRecordingComplete}
        onSavePrescription={handleSavePrescription}
      />
    </div>
  </Protected>
  );
}

// Dummy dashboard component with content
const DoctorDashboardContent = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onRecordingComplete,
  onSavePrescription,
}: {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient | null) => void;
  onAddPatient: (patientData: { name: string; phone: string; email: string }) => void;
  onRecordingComplete: (audioBlob: Blob) => void;
  onSavePrescription: (prescription: { medicines: any[]; notes: string; duration_days: number }) => void;
}) => {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
        {!selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientList patients={patients} onSelectPatient={onSelectPatient} onAddPatient={onAddPatient} />
            <DoctorAppointmentRequests />
          </div>
        ) : selectedPatient && selectedPatient.id && selectedPatient.id !== 'undefined' && selectedPatient.name ? (
          <div className="h-full w-full">
            <PatientView
              patientId={selectedPatient.id}
              patientName={selectedPatient.name}
              onBack={() => onSelectPatient(null)}
              onRecordingComplete={onRecordingComplete}
              onSavePrescription={onSavePrescription}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
