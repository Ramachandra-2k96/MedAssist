"use client"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import TextPressure from "./ui/TextPressure"

export function StickyFooter() {
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY
          const windowHeight = window.innerHeight
          const documentHeight = document.documentElement.scrollHeight
          setIsAtBottom(scrollTop + windowHeight >= documentHeight - 100)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const year = new Date().getFullYear()

  return (
    <AnimatePresence>
      {isAtBottom && (
        <motion.footer
          className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md z-50 flex flex-col"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
           
          {/* main area: everything aligned to the right */}
          <div className="flex items-center justify-between w-full">
            <TextPressure
              text="MedAssist"
              flex={false}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="hsl(var(--primary))"
              strokeColor="transparent"
              minFontSize={40}
            />
            <div className="flex items-center gap-10">

            </div>
            <motion.div
              className="max-w-[320px] flex flex-col items-end gap-6 text-right"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
             <div className="flex gap-10 justify-end w-full p-18">
              <ul className="space-y-2 text-sm sm:text-base">
                <li className="hover:underline cursor-pointer">Home</li>
                <li className="hover:underline cursor-pointer">Features</li>
                <li className="hover:underline cursor-pointer">Pricing</li>
              </ul>
            </div>
            </motion.div>
          </div>

            {/* divider and copyright (right-aligned) */}
          <div className="relative border-t border-border flex items-center justify-center text-center">
            <div className="max-w-screen-xl w-full text-muted-foreground">
              © {year} MedAssist. All rights reserved.
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  )
}
