"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { MedicineSchedule } from "@/components/dashboard/medicine-schedule";
import { AppointmentReminders } from "@/components/dashboard/appointment-reminders";
import { HealthRecords } from "@/components/dashboard/health-records";
import { Chatbot } from "@/components/dashboard/chatbot";
import { DoctorRecordings } from "@/components/dashboard/doctor-recordings";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getUserSidebarLinks, Logo, LogoIcon } from "@/components/dashboard/user-sidebar";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserDashboard() {
  const params = useParams();
  const hash = params.hash as string;

  const links = getUserSidebarLinks(hash);
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
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Patient Name",
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
      <UserDashboardContent />
    </div>
  );
}
// Dummy dashboard component with content
const UserDashboardContent = () => {
  // Mock data
  const medicines = [
    {
      name: "Paracetamol",
      dosage: "500mg",
      timing: "8:00 AM, 2:00 PM, 8:00 PM",
      color: "#FF6B6B",
      shape: "round",
      emoji: "💊"
    },
    {
      name: "Amoxicillin",
      dosage: "250mg",
      timing: "8:00 AM, 8:00 PM",
      color: "#4ECDC4",
      shape: "capsule",
      emoji: "🧴"
    }
  ]

  const appointments = [
    {
      id: "1",
      doctor: "Dr. Smith",
      date: "2025-09-05",
      time: "10:00 AM",
      type: "General Checkup",
      location: "City Hospital",
      status: "upcoming" as const
    },
    {
      id: "2",
      doctor: "Dr. Johnson",
      date: "2025-09-10",
      time: "2:00 PM",
      type: "Follow-up",
      status: "upcoming" as const
    }
  ]

  const records = [
    {
      id: "1",
      type: "Prescription",
      title: "Blood Pressure Medication",
      date: "2025-08-15",
      doctor: "Dr. Smith"
    },
    {
      id: "2",
      type: "Lab Report",
      title: "Blood Test Results",
      date: "2025-08-10",
      doctor: "Dr. Johnson"
    }
  ]

  const doctorRecordings = [
    {
      id: "1",
      doctorName: "Smith",
      title: "Consultation Notes",
      date: "2025-08-15",
      duration: "2:30"
    },
    {
      id: "2",
      doctorName: "Johnson",
      title: "Follow-up Instructions",
      date: "2025-08-10",
      duration: "1:45"
    }
  ]

  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; sender: "user" | "bot"; timestamp: Date }[]>([
    {
      id: "1",
      text: "Hello! How can I help you with your health today?",
      sender: "bot",
      timestamp: new Date()
    }
  ])

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user" as const,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, newMessage])

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your question. Please consult with your doctor for personalized medical advice.",
        sender: "bot" as const,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, botResponse])
    }, 1000)
  }

  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MedicineSchedule medicines={medicines} />
          <AppointmentReminders appointments={appointments} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthRecords records={records} />
          <DoctorRecordings recordings={doctorRecordings} />
        </div>
      </div>
    </div>
  );
};
