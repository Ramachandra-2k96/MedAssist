"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PrescriptionEditor } from "@/components/dashboard/prescription-editor";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getDoctorSidebarLinks, DoctorLogo, DoctorLogoIcon } from "@/components/dashboard/doctor-sidebar";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PrescriptionsPage() {
  const params = useParams();
  const hash = params.hash as string;

  const links = getDoctorSidebarLinks(hash);
  const [open, setOpen] = React.useState(false);

  const handleSavePrescription = (prescription: { medicines: any[]; notes: string }) => {
    console.log("Saving prescription:", prescription)
    // Here you would save the prescription to the backend
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
          <PrescriptionEditor
            patientName="Selected Patient"
            onSave={handleSavePrescription}
          />
        </div>
      </div>
    </div>
  );
}
