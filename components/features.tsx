"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { geist } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Pill, MessageSquare, FileText, Clock, Smartphone, Heart } from "lucide-react"

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { theme } = useTheme()
  const [isMedicationHovering, setIsMedicationHovering] = useState(false)
  const [isVoiceHovering, setIsVoiceHovering] = useState(false)
  const [isVisualHovering, setIsVisualHovering] = useState(false)
  const [isRecordsHovering, setIsRecordsHovering] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isHoveringFeature, setIsHoveringFeature] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.addEventListener('mousemove', handleMouseMove)
      return () => featuresSection.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <section id="features" className="text-foreground relative overflow-hidden py-12 sm:py-24 md:py-32 z-90">
      {/* Custom Cursor */}
      {isHoveringFeature && (
        <motion.div
          className="fixed top-0 left-0 z-[9999] pointer-events-none"
          style={{
            x: cursorPosition.x - 16,
            y: cursorPosition.y - 16,
          }}
          animate={{
            scale: isHoveringFeature ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-8 h-8 bg-primary/20 rounded-full border-2 border-primary flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </motion.div>
      )}

      <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
      <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0 }}
        className="container mx-auto flex flex-col items-center gap-6 sm:gap-12"
      >
        <h2
          className={cn(
            "via-foreground mb-8 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
            geist.className,
          )}
        >
          MedAssist Features
        </h2>
        <motion.div
          className="w-full"
          onMouseEnter={() => setIsHoveringFeature(true)}
          onMouseLeave={() => setIsHoveringFeature(false)}
        >
          <div className="cursor-none">
            <div className="grid grid-cols-12 gap-4 justify-center">
              {/* Medication Reminders */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsMedicationHovering(true)}
                onMouseLeave={() => setIsMedicationHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(34, 197, 94, 0.6)",
                  boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl leading-none font-semibold tracking-tight">Medication Reminders & SMS Alerts</h3>
                  </div>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Automated SMS reminders for medication schedules, appointment notifications, and follow-up care. Ensures patients never miss their important health milestones.
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none flex grow items-center justify-center select-none relative">
                  <div
                    className="relative w-full h-[400px] rounded-xl overflow-hidden"
                    style={{ borderRadius: "20px" }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <img
                        src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
                        alt="Healthcare professional with patient"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>

                    {/* Animated Elements */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={isMedicationHovering ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <Smartphone className="h-8 w-8 text-green-600" />
                          <span className="font-semibold text-lg">SMS Reminder</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Take your medication at 2:00 PM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Doctor appointment tomorrow 10:00 AM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Follow-up check in 3 days</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Voice-to-Text Conversion */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                onMouseEnter={() => setIsVoiceHovering(true)}
                onMouseLeave={() => setIsVoiceHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(59, 130, 246, 0.6)",
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl leading-none font-semibold tracking-tight">Voice-to-Text Conversion</h3>
                  </div>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Advanced speech recognition technology that converts patient consultations and health information into accurate text records. Perfect for rural areas with limited literacy.
                    </p>
                  </div>
                </div>
                <div className="flex min-h-[300px] grow items-start justify-center select-none">
                  <div className="w-full max-w-lg">
                    <div className="relative rounded-2xl border border-border bg-card/50 dark:bg-card/20 backdrop-blur-sm">
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <span className="font-semibold text-lg">Voice Recording</span>
                          <motion.div
                            className="ml-auto w-3 h-3 bg-red-500 rounded-full"
                            animate={isVoiceHovering ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 1, repeat: isVoiceHovering ? Number.POSITIVE_INFINITY : 0 }}
                          />
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 mb-4">
                          <p className="text-sm text-muted-foreground italic">
                            "Patient reports feeling better after taking the medication twice daily. No side effects observed..."
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600 dark:text-green-400">Recording transcribed</span>
                          </div>
                          <button className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground text-sm font-medium transition-colors">
                            Save Record
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Visual Medication Guides */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsVisualHovering(true)}
                onMouseLeave={() => setIsVisualHovering(false)}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(168, 85, 247, 0.6)",
                  boxShadow: "0 0 30px rgba(168, 85, 247, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Pill className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-2xl leading-none font-semibold tracking-tight">Visual Medication Guides</h3>
                  </div>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Interactive visual guides showing medication dosage, timing, and administration methods. Includes pill images, dosage charts, and simple instructions for better understanding.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="relative w-full max-w-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Pill className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-lg mb-2">Amoxicillin 500mg</h4>
                        <p className="text-sm text-muted-foreground">Take 1 capsule every 8 hours</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Morning (8:00 AM)</span>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium">Afternoon (4:00 PM)</span>
                          </div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Evening (12:00 AM)</span>
                          </div>
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Health Record Management */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                onMouseEnter={() => setIsRecordsHovering(true)}
                onMouseLeave={() => setIsRecordsHovering(false)}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(239, 68, 68, 0.6)",
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-2xl leading-none font-semibold tracking-tight">Health Record Management</h3>
                  </div>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Comprehensive digital health records with secure storage, easy access for healthcare providers, and patient-controlled sharing. Includes medical history, prescriptions, and treatment progress tracking.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="relative w-full max-w-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Patient Records</h4>
                          <p className="text-sm text-muted-foreground">Last updated: Today</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Medical History</span>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">Complete</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Prescriptions</span>
                          </div>
                          <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">Consultation Notes</span>
                          </div>
                          <span className="text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">Updated</span>
                        </div>
                      </div>

                      <button className="w-full mt-4 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground text-sm font-medium transition-colors">
                        View Full Record
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
