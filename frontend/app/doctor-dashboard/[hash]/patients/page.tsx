"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PatientList } from "@/components/dashboard/patient-list";
import PatientView from "@/components/dashboard/patient-view";
import { API_BASE_URL, MEDIA_BASE_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import Protected from "@/components/auth/Protected";
import { Stethoscope } from "lucide-react";

import { getDoctorSidebarLinks, DoctorLogo, DoctorLogoIcon } from "@/components/dashboard/doctor-sidebar";
import { useParams } from "next/navigation";
import { toast } from "sonner"

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: "active" | "inactive";
  adherence: number;
}

export default function PatientsPage() {
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
      console.error('Error fetching doctor profile:', error);
      // toast.error("Failed to fetch doctor profile")
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await apiFetch('/doctor/patients/')
      const formattedPatients: Patient[] = data
        .filter((dp: any) => dp.patient && dp.patient.id)
        .map((dp: any) => ({
          id: dp.patient.id?.toString() || '',
          name: dp.patient_name || dp.patient.profile?.name || dp.patient.username || 'Unknown',
          phone: dp.phone || '',
          email: dp.patient.email || '',
          lastVisit: dp.added_at || '',
          status: 'active' as const,
          adherence: 0,
        }))
        .filter((patient: Patient) => patient.id && patient.name);
      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error("Failed to fetch patients")
    }
    setLoading(false);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleAddPatient = async (patientData: { name: string; phone: string; email: string }) => {
    try {
      await apiFetch('/doctor/patients/', {
        method: 'POST',
        body: JSON.stringify({ email: patientData.email }),
      })
      toast.success("Patient added successfully")
      fetchPatients()
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error("Failed to add patient")
    }
  };

  const handleSavePrescription = (prescription: { medicines: any[]; notes: string }) => {
    console.log("Saving prescription:", prescription);
    if (selectedPatient) {
      savePrescription(prescription);
    }
  };

  const savePrescription = async (prescription: { medicines: any[]; notes: string }) => {
    if (!selectedPatient) return;
    try {
      await apiFetch(`/doctor/patients/${selectedPatient.id}/prescriptions/`, {
        method: 'POST',
        body: JSON.stringify(prescription),
      })
      console.log('Prescription saved');
      toast.success("Prescription saved successfully")
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error("Failed to save prescription")
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
        <div className="flex flex-1">
          <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
            {!selectedPatient ? (
              <PatientList patients={patients} onSelectPatient={handleSelectPatient} onAddPatient={handleAddPatient} />
            ) : selectedPatient && selectedPatient.id && selectedPatient.id !== 'undefined' && selectedPatient.name ? (
              <PatientView
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                onBack={() => setSelectedPatient(null)}
                onSavePrescription={handleSavePrescription}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Protected>
  );
}
