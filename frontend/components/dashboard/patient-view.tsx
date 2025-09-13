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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Patient: {patientName}</h2>
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back to Patients
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActive("records")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium",
              active === "records"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            )}
          >
            Records
          </button>
          <button
            onClick={() => setActive("recordings")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium",
              active === "recordings"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            )}
          >
            Recordings
          </button>
          <button
            onClick={() => setActive("chat")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium",
              active === "chat"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            )}
          >
            Chat
          </button>
          <button
            onClick={() => setActive("prescription")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium",
              active === "prescription"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            )}
          >
            Prescription
          </button>
          <button
            onClick={() => setActive("appointments")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium",
              active === "appointments"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            )}
          >
            Appointments
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {active === "records" && <PatientRecords patientId={patientId} patientName={patientName} />}
          {active === "recordings" && (
            <PatientRecordings patientId={patientId} patientName={patientName} />
          )}
          {active === "chat" && <PatientChat patientId={patientId} patientName={patientName} />}
          {active === "prescription" && (
            <PrescriptionEditor
              patientId={patientId}
              patientName={patientName}
              // PrescriptionEditor expects a required onSave; provide a no-op when not passed
              onSave={onSavePrescription ?? (() => undefined)}
            />
          )}
          {active === "appointments" && (
            <PatientAppointments patientId={patientId} patientName={patientName} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientView;
