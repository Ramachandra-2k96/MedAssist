"use client";
import React, { useState, useEffect } from "react";
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
import { PatientRecords } from "@/components/dashboard/patient-records";
import { PatientRecordings } from "@/components/dashboard/patient-recordings";
import { PatientChat } from "@/components/dashboard/patient-chat";
import { API_BASE_URL } from "@/lib/config";
import { PrescriptionEditor } from "@/components/dashboard/prescription-editor";
import { Stethoscope } from "lucide-react";

import { getDoctorSidebarLinks, DoctorLogo, DoctorLogoIcon } from "@/components/dashboard/doctor-sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { useParams } from "next/navigation";

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
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/doctor-login';
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctorProfile(data);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchPatients = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/doctor-login';
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/patients/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const formattedPatients: Patient[] = data
          .filter((dp: any) => dp.patient && dp.patient.id)
          .map((dp: any) => ({
            id: dp.patient.id?.toString() || '',
            name: dp.patient.profile?.name || dp.patient.username || 'Unknown',
            phone: '+1234567890',
            email: dp.patient.email || '',
            lastVisit: dp.added_at?.split('T')[0] || '',
            status: 'active' as const,
            adherence: 85,
          }))
          .filter((patient: Patient) => patient.id && patient.name);
        setPatients(formattedPatients);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
    setLoading(false);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleAddPatient = async (patientData: { name: string; phone: string; email: string }) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/patients/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: patientData.email }),
      });
      if (response.ok) {
        fetchPatients();
      } else {
        console.error('Failed to add patient');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
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
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/patients/${selectedPatient.id}/prescriptions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescription),
      });
      if (response.ok) {
        console.log('Prescription saved');
      } else {
        console.error('Failed to save prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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
            {doctorProfile && (
              <SidebarLink
                link={{
                  label: open ? (doctorProfile.name || doctorProfile.user?.email || "Doctor") : "",
                  href: "#",
                  icon: doctorProfile.photo_url ? (
                    <img
                      src={`${API_BASE_URL}${doctorProfile.photo_url}`}
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
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                onSave={handleSavePrescription}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
