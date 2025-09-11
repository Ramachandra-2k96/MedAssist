"use client";
import React from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { getUserSidebarLinks, Logo, LogoIcon } from './user-sidebar';
import { useParams } from 'next/navigation';
import { usePatientProfile, PatientProfileProvider } from './patient-profile-context';
import { cn } from '@/lib/utils';

const Frame = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const hash = params.hash as string;
  const links = getUserSidebarLinks(hash);
  const [open, setOpen] = React.useState(false);
  const { profile } = usePatientProfile();
  return (
    <div className={cn("mx-auto flex w-full flex-1 flex-col overflow-auto md:overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800","h-screen")}>      
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (<SidebarLink key={idx} link={link} />))}
            </div>
          </div>
          <div>
            <SidebarLink link={{ label: open ? (profile?.name || 'Patient') : '', href:'#', icon: profile?.photo_url ? (<img src={profile.photo_url} className="h-7 w-7 shrink-0 rounded-full" />) : (<div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs">{(profile?.name||'P').slice(0,1)}</div>) }} />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PatientDashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <PatientProfileProvider><Frame>{children}</Frame></PatientProfileProvider>
);
