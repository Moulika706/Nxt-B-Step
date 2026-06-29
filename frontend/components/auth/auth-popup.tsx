"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Shield } from "lucide-react"
import { useDemo } from "@/components/auth/demo-auth-context"

interface AuthPopupProps {
  isOpen: boolean
  onClose: () => void
  onContinueAsGuest: () => void
}

export function AuthPopup({ isOpen, onClose, onContinueAsGuest }: AuthPopupProps) {
  const { openSignIn } = useDemo()

  const handleSignIn = () => {
    onClose()
    openSignIn()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="bg-slate-950 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-teal-400" />
                <h2 className="text-white font-semibold">Sign In Required</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Sign in to access personalized background check data based on your role.
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleSignIn}
                  className="w-full py-2.5 bg-slate-950 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onContinueAsGuest}
                  className="w-full py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
