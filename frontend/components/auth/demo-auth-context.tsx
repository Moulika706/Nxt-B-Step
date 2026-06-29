"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Briefcase } from "lucide-react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DemoUser {
  name: string
  email: string
  role: "admin" | "company" | "subject" | "guest"
}

interface DemoAuthContextType {
  user: DemoUser | null
  isSignedIn: boolean
  signIn: (user: DemoUser) => void
  signOut: () => void
  openSignIn: () => void
  closeSignIn: () => void
  isSignInOpen: boolean
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const DemoAuthContext = createContext<DemoAuthContextType>({
  user: null,
  isSignedIn: false,
  signIn: () => {},
  signOut: () => {},
  openSignIn: () => {},
  closeSignIn: () => {},
  isSignInOpen: false,
})

// ─────────────────────────────────────────────
// Demo users for quick sign-in
// ─────────────────────────────────────────────

const DEMO_USERS: DemoUser[] = [
  { name: "Admin User", email: "hireai.teamx@gmail.com", role: "admin" },
  { name: "Amazon Salesforce", email: "dbpyja@gmail.com", role: "company" },
  { name: "John Smith", email: "john.smith@candidate.com", role: "subject" },
]

// ─────────────────────────────────────────────
// Sign-In Modal
// ─────────────────────────────────────────────

function SignInModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: (user: DemoUser) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<DemoUser["role"]>("guest")

  const handleCustomSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    onSignIn({ name: name.trim(), email: email.trim(), role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-950 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Sign In to DecisionOS</h2>
            <p className="text-slate-400 text-xs mt-0.5">Choose a demo persona or enter your details</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Demo users */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Sign-In (Demo)</p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => onSignIn(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-left group"
                >
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "company" ? "bg-blue-100 text-blue-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 group-hover:text-teal-800">{u.name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "company" ? "bg-blue-100 text-blue-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">or enter your details</div>
          </div>

          {/* Custom sign-in */}
          <form onSubmit={handleCustomSignIn} className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={role}
                onChange={e => setRole(e.target.value as DemoUser["role"])}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 appearance-none bg-white"
              >
                <option value="guest">Guest (read-only)</option>
                <option value="subject">Subject / Candidate</option>
                <option value="company">Company / Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-950 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("demo_user")
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const signIn = useCallback((u: DemoUser) => {
    setUser(u)
    localStorage.setItem("demo_user", JSON.stringify(u))
    setIsSignInOpen(false)
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem("demo_user")
  }, [])

  const openSignIn = useCallback(() => setIsSignInOpen(true), [])
  const closeSignIn = useCallback(() => setIsSignInOpen(false), [])

  return (
    <DemoAuthContext.Provider value={{ user, isSignedIn: !!user, signIn, signOut, openSignIn, closeSignIn, isSignInOpen }}>
      {children}
      <AnimatePresence>
        {isSignInOpen && (
          <SignInModal onClose={closeSignIn} onSignIn={signIn} />
        )}
      </AnimatePresence>
    </DemoAuthContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useDemo() {
  return useContext(DemoAuthContext)
}
