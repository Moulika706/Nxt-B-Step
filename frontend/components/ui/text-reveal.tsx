"use client"

import type React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TextRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn("relative", className)}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: 0.6,
          delay: delay + 0.2,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 origin-left"
      />
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration: 0.6,
          delay: delay + 0.8,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 origin-right z-10"
      />
      <div className="relative z-20">{children}</div>
    </motion.div>
  )
}
