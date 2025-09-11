"use client";
import React from "react";
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
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const getDoctorSidebarLinks = (hash: string) => [
  {
    label: "Dashboard",
    href: `/doctor-dashboard/${hash}`,
    icon: (
      <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Patients",
    href: `/doctor-dashboard/${hash}/patients`,
    icon: (
      <IconUsers className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Logout",
    href: "/",
    icon: (
      <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
    // special: instruct consumers to treat this as a logout action
    logout: true,
  },
];

export const DoctorLogo = () => {
  return (
    <div className="flex flex-row justify-between items-center">
      <Link
        href="/"
        className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
      >
        <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-primary" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium whitespace-pre text-black dark:text-white"
        >
          MedAssist
        </motion.span>
      </Link>
      <div className="z-12">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export const DoctorLogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </Link>
  );
};
