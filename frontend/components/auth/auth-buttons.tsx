"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDemo } from '@/components/auth/demo-auth-context'
import { LogOut, User } from 'lucide-react'

interface AuthButtonsProps {
  className?: string
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const { user, signOut, openSignIn } = useDemo()

  if (user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
          <User className="h-3.5 w-3.5" />
          <span className="truncate max-w-[120px]">{user.name}</span>
          <span className="text-teal-500 text-[10px]">({user.role})</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openSignIn}
        className="px-4 py-2 rounded-full bg-slate-950 text-white text-sm font-medium hover:bg-slate-800 transition-all duration-200 shadow-sm"
      >
        Sign In
      </motion.button>
    </div>
  )
}
