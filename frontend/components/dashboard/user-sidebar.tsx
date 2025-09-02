"use client";
import React from "react";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconMessage,
  IconFileText,
  IconCalendar,
  IconPill,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export const getUserSidebarLinks = (hash: string) => [
  {
    label: "Dashboard",
    href: `/dashboard/${hash}`,
    icon: (
      <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Medicines",
    href: `/dashboard/${hash}/medicines`,
    icon: (
      <IconPill className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Appointments",
    href: `/dashboard/${hash}/appointments`,
    icon: (
      <IconCalendar className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Records",
    href: `/dashboard/${hash}/records`,
    icon: (
      <IconFileText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Recordings",
    href: `/dashboard/${hash}/recordings`,
    icon: (
      <IconMessage className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Chat",
    href: `/dashboard/${hash}/chat`,
    icon: (
      <IconMessage className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Logout",
    href: "/",
    icon: (
      <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

export const Logo = () => {
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

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </Link>
  );
};
