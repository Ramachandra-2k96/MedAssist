"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "@/components/dashboard/voice-recorder";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getDoctorSidebarLinks, DoctorLogo, DoctorLogoIcon } from "@/components/dashboard/doctor-sidebar";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VoiceRecorderPage() {
  const params = useParams();
  const hash = params.hash as string;

  const links = getDoctorSidebarLinks(hash);
  const [open, setOpen] = React.useState(false);

  const handleRecordingComplete = (audioBlob: Blob) => {
    console.log("Recording completed:", audioBlob)
    // Here you would typically send the audio to a speech-to-text service
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
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      </div>
    </div>
  );
}
