"use client"

import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuthButtonsProps {
  className?: string
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="h-8 w-16 bg-card/30 rounded-full animate-pulse" />
        <div className="h-8 w-16 bg-card/30 rounded-full animate-pulse" />
      </div>
    )
  }

  if (isSignedIn) {
    return (
      <div className={cn("flex items-center", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-7 w-7 ring-1 ring-white/30 ring-offset-1 ring-offset-transparent hover:ring-white/50 transition-all duration-200",
                userButtonPopoverCard: "bg-card/95 backdrop-blur-xl border border-white/10 shadow-xl rounded-xl",
                userButtonPopoverText: "text-foreground text-sm",
                userButtonPopoverActionButton: "text-foreground hover:bg-white/10 rounded-lg text-sm",
                userButtonPopoverActionButtonText: "text-foreground text-sm",
                userButtonPopoverActionButtonIcon: "text-foreground/70 h-4 w-4",
                userButtonPopoverFooter: "hidden",
              }
            }}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SignInButton mode="modal">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-full bg-card/30 backdrop-blur-xl border border-white/10 hover:bg-card/50 hover:border-white/20 text-sm font-medium text-foreground transition-all duration-200 shadow-lg"
          >
            Sign In
          </motion.button>
        </SignInButton>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <SignUpButton mode="modal">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-all duration-200 shadow-lg shadow-primary/25"
          >
            Sign Up
          </motion.button>
        </SignUpButton>
      </motion.div>
    </div>
  )
}
