"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Pill, MessageSquare, FileText } from "lucide-react"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <section className="relative overflow-hidden min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-24 sm:py-32 relative z-10 flex-1 flex flex-col">
          <div className="mx-auto max-w-4xl text-center flex-1 flex flex-col justify-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2 text-sm">
                <Heart className="h-4 w-4 text-red-500" />
                Healthcare Innovation
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <h1 id="main-title" className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                MedAssist: <strong>Audio-Visual</strong> <br />
                <strong>Health Support</strong> <em className="italic text-primary">System</em>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground"
            >
              Comprehensive mobile and web-based health education system that improves treatment adherence through SMS reminders, voice-to-text conversion, and visual medication guides. Perfect for semi-urban and rural patients.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Feature Icons */}
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Pill className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Medication Reminders</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Voice-to-Text</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Health Records</span>
                </div>
              </div>

              {/* Get started button */}
              <div className="flex items-center justify-center gap-4">
                <a href="#features">
                  <div className="group cursor-pointer border border-border bg-card gap-2 h-[60px] flex items-center p-[10px] rounded-full hover:shadow-lg transition-all">
                    <div className="border border-border bg-primary h-[40px] rounded-full flex items-center justify-center text-primary-foreground">
                      <p className="font-medium tracking-tight mr-3 ml-3 flex items-center gap-2 justify-center text-base">
                        <Heart className="h-4 w-4" />
                        Learn More
                      </p>
                    </div>
                    <div className="text-muted-foreground group-hover:ml-4 ease-in-out transition-all size-[24px] flex items-center justify-center rounded-full border-2 border-border">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right group-hover:rotate-180 ease-in-out transition-all"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </a>
                <Link href="/doctor-login">
                  <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium py-3 px-6 rounded-full transition-colors">
                    Doctor Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </section>
    </>
  )
}
