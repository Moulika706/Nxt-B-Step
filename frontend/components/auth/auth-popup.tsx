"use client"

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthPopupProps {
  isOpen: boolean
  onClose: () => void
  onContinueAsGuest?: () => void
  title?: string
  description?: string
}

export function AuthPopup({ 
  isOpen, 
  onClose, 
  onContinueAsGuest,
  title = "Authentication Required",
  description = "Please sign in or sign up to continue using the chat." 
}: AuthPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-muted-foreground mb-8 text-center leading-relaxed">
                  {description}
                </p>

                {/* Auth Buttons */}
                <div className="space-y-3">
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-card/30 backdrop-blur-xl border border-white/20 hover:border-white/30 hover:bg-card/50 text-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <User className="h-5 w-5" />
                      Sign In
                    </motion.button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-card/30 backdrop-blur-xl border border-white/20 hover:border-white/30 hover:bg-card/50 text-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <UserPlus className="h-5 w-5" />
                      Sign Up
                    </motion.button>
                  </SignUpButton>
                </div>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="flex items-center text-xs uppercase tracking-wide">
                    <div className="flex-1 border-t border-white/20"></div>
                    <span className="bg-card/30 backdrop-blur-xl px-6 py-2 mx-4 text-muted-foreground rounded-full border border-white/20">
                      or continue as guest
                    </span>
                    <div className="flex-1 border-t border-white/20"></div>
                  </div>
                </div>

                {/* Guest Option */}
                <motion.button
                  onClick={onContinueAsGuest || onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-xl bg-card/30 backdrop-blur-xl border border-white/20 hover:border-white/30 hover:bg-card/50 text-muted-foreground hover:text-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Continue as Guest
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
