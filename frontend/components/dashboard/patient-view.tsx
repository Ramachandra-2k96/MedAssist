"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PatientRecords } from "@/components/dashboard/patient-records";
import { PatientRecordings } from "@/components/dashboard/patient-recordings";
import { PatientChat } from "@/components/dashboard/patient-chat";
import { PrescriptionEditor } from "@/components/dashboard/prescription-editor";
import { PatientAppointments } from "@/components/dashboard/patient-appointments";
import { cn } from "@/lib/utils";

type Props = {
  patientId: string;
  patientName: string;
  onBack?: () => void;
  onRecordingComplete?: (b: Blob) => void;
  onSavePrescription?: (p: { medicines: any[]; notes: string; duration_days: number }) => void;
};

export const PatientView: React.FC<Props> = ({
  patientId,
  patientName,
  onBack,
  onRecordingComplete,
  onSavePrescription,
}) => {
  const [active, setActive] = useState<"records" | "recordings" | "chat" | "prescription" | "appointments">("records");

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* Mobile-first header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden"
              >
                ← Back
              </Button>
            )}
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {patientName}
            </h1>
          </div>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hidden md:flex"
            >
              Back to Patients
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable navigation tabs - centered */}
      <div className="sticky top-[57px] md:top-[73px] z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 md:px-6">
        <div className="flex justify-center">
          <div className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide max-w-full">
            <button
              onClick={() => setActive("records")}
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                active === "records"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Records
            </button>
            <button
              onClick={() => setActive("recordings")}
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                active === "recordings"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Recordings
            </button>
            <button
              onClick={() => setActive("chat")}
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                active === "chat"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setActive("prescription")}
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                active === "prescription"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Prescription
            </button>
            <button
              onClick={() => setActive("appointments")}
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                active === "appointments"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Appointments
            </button>
          </div>
        </div>
      </div>

      {/* Full page content */}
      <div className="flex-1 w-full px-4 py-6 md:px-6 md:py-8 h-full">
        <div className="max-w-7xl mx-auto">
          {active === "records" && (
            <div className="w-full">
              <PatientRecords patientId={patientId} patientName={patientName} />
            </div>
          )}
          {active === "recordings" && (
            <div className="w-full">
              <PatientRecordings patientId={patientId} patientName={patientName} />
            </div>
          )}
          {active === "chat" && (
            <div className="w-full h-full">
              <PatientChat patientId={patientId} patientName={patientName} />
            </div>
          )}
          {active === "prescription" && (
            <div className="w-full">
              <PrescriptionEditor
                patientId={patientId}
                patientName={patientName}
              />
            </div>
          )}
          {active === "appointments" && (
            <div className="w-full">
              <PatientAppointments patientId={patientId} patientName={patientName} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientView;
