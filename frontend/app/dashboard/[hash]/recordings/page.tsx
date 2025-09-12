"use client";
import React from 'react'
import { AudioCenter } from '@/components/dashboard/audio-center'

export default function RecordingsPage(){
  return <AudioCenter mode="patient" doctorId={null} />
}
