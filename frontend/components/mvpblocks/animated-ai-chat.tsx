"use client"

import { useEffect, useRef, useCallback, useTransition } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ImageIcon,
  Figma,
  MonitorIcon,
  Paperclip,
  SendIcon,
  XIcon,
  Sparkles,
  Bot,
  User,
  Edit,
  Trash2,
  Check,
  Brush,
  FileText,
  Mic,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"
import { useAuth, useUser } from '@clerk/nextjs'
import { AuthButtons } from '@/components/auth/auth-buttons'
import { AuthPopup } from '@/components/auth/auth-popup'
import ChartRenderer from '@/components/ui/chart-renderer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY))

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

interface CommandSuggestion {
  icon: React.ReactNode
  label: string
  description: string
  prefix: string
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string
  showRing?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none" : "",
            className,
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showRing && isFocused && (
          <motion.span
            className="ring-primary/30 pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div
            className="bg-primary absolute right-2 bottom-2 h-2 w-2 rounded-full opacity-0"
            style={{
              animation: "none",
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  },
)
Textarea.displayName = "Textarea"

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  chartData?: {
    type: "bar" | "line" | "area" | "pie"
    title?: string
    data: Array<{ name: string; value: number; [key: string]: any }>
    colors?: string[]
    xAxisLabel?: string
    yAxisLabel?: string
  }
}

interface ChatSession {
  id: string
  name: string
  timestamp: string
  messages: Array<ChatMessage>
}

export default function AnimatedAIChat() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [value, setValue] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [hasFirstMessage, setHasFirstMessage] = useState(false)
  const [postMessageValue, setPostMessageValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState("")
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const postTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })
  const [inputFocused, setInputFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Helper function to check if user can chat
  const canUserChat = isSignedIn || isGuestMode

  const handleContinueAsGuest = () => {
    setIsGuestMode(true)
    setShowAuthPopup(false)
  }
  
  // No need for manual text formatting since ReactMarkdown handles it
  
  // Thinking animation component with moving dots
  const ThinkingAnimation = () => (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full items-end gap-2 justify-start"
    >
      <div className="flex-shrink-0 mb-1">
        <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-sm border border-primary/20 dark:border-primary/30 rounded-full p-1.5">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      </div>
      
      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm shadow-sm bg-card border border-gray-200 dark:border-gray-800 text-card-foreground break-words overflow-wrap-anywhere">
        <div className="flex items-center">
          <span className="text-foreground/70">thinking</span>
          <div className="flex items-center ml-1">
            <motion.span
              className="text-foreground/70 text-lg font-bold"
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0,
                ease: "easeInOut"
              }}
            >
              .
            </motion.span>
            <motion.span
              className="text-foreground/70 text-lg font-bold"
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.5,
                ease: "easeInOut"
              }}
            >
              .
            </motion.span>
            <motion.span
              className="text-foreground/70 text-lg font-bold"
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 1,
                ease: "easeInOut"
              }}
            >
              .
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  )
  
  // Helper function to generate fallback chart data when the API mentions a chart but doesn't provide proper data
  const generateFallbackChart = (text: string) => {
    // Check if text mentions charts or visualizations
    const mentionsChart = 
      /pie\s*chart|bar\s*chart|chart|graph|visualization|distribution|illustrat(es|ing)|showing/i.test(text)
    
    if (!mentionsChart) return null
    
    // Try to determine chart type (default to pie if unclear)
    let chartType: "pie" | "bar" = "pie"
    if (/bar\s*chart|column/i.test(text)) {
      chartType = "bar"
    }
    
    // Try to extract potential data points from text
    const dataPoints = []
    
    // Common chart subjects to look for
    const commonTypes = [
      { search: /pending\s*orders/i, name: "Pending Orders", value: 71 },
      { search: /draft\s*orders/i, name: "Draft Orders", value: 43 },
      { search: /completed|finished\s*orders/i, name: "Completed Orders", value: 120 },
      { search: /cancelled\s*orders/i, name: "Cancelled Orders", value: 18 },
      // Add default data points if none found
      { search: /orders/, name: "Orders", value: 114 },
      { search: /package|distribution/, name: "Default", value: 100 }
    ]
    
    // Try to find matches in text
    let foundMatches = false
    for (const type of commonTypes) {
      if (type.search.test(text)) {
        if (!foundMatches && type.name !== "Default") {
          foundMatches = true
          dataPoints.push({ name: type.name, value: type.value })
          
          // For order types, add a complementary data point
          if (type.name === "Pending Orders") {
            dataPoints.push({ name: "Draft Orders", value: 43 })
          } else if (type.name === "Draft Orders") {
            dataPoints.push({ name: "Pending Orders", value: 71 })
          }
        }
      }
    }
    
    // If no specific matches, add default data
    if (!foundMatches) {
      if (/package|distribution/i.test(text)) {
        dataPoints.push(
          { name: "Basic Package", value: 42 },
          { name: "Standard Package", value: 58 },
          { name: "Premium Package", value: 35 }
        )
      } else {
        dataPoints.push(
          { name: "Pending", value: 71 },
          { name: "Draft", value: 43 }
        )
      }
    }
    
    // Create chart data
    let title = "Data Distribution"
    if (/order/i.test(text)) {
      title = "Order Distribution"
    } else if (/package/i.test(text)) {
      title = "Package Distribution"
    }
    
    return {
      type: chartType,
      title: title,
      data: dataPoints
    }
  }

  const suggestedQuestions = [
    "Show me a sales chart by region",
    "Display revenue growth trends",
    "Create a market share visualization",
    "Generate customer satisfaction data",
    "What are the latest trends in AI?",
    "How does machine learning work?",
  ]

  const commandSuggestions: CommandSuggestion[] = [
    {
      icon: <ImageIcon className="h-4 w-4" />,
      label: "Clone UI",
      description: "Generate a UI from a screenshot",
      prefix: "/clone",
    },
    {
      icon: <Figma className="h-4 w-4" />,
      label: "Import Figma",
      description: "Import a design from Figma",
      prefix: "/figma",
    },
    {
      icon: <MonitorIcon className="h-4 w-4" />,
      label: "Create Page",
      description: "Generate a new web page",
      prefix: "/page",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: "Improve",
      description: "Improve existing UI design",
      prefix: "/improve",
    },
  ]

  const removeAttachment = (index: number) => {
    setAttachments((prevAttachments) => prevAttachments.filter((_, i) => i !== index))
  }

  const handleAttachFile = () => {
    // Placeholder for file attachment logic
    setAttachments((prevAttachments) => [...prevAttachments, "file.txt"])
  }

  const handleSuggestionClick = (question: string) => {
    // Check authentication before setting the question
    if (!canUserChat) {
      setShowAuthPopup(true)
      return
    }
    
    setValue(question)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleNewChat = () => {
    if (messages.length > 0 && currentChatId) {
      setChatSessions((prev) =>
        prev.map((session) => (session.id === currentChatId ? { ...session, messages: [...messages] } : session)),
      )
    }

    const newChatId = Date.now().toString()
    const newChat: ChatSession = {
      id: newChatId,
      name: `Chat ${chatSessions.length + 1}`,
      timestamp: "Just now",
      messages: [],
    }
    setChatSessions((prev) => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages([])
    setHasFirstMessage(false)
    setValue("")
    setPostMessageValue("")
    setSidebarOpen(false)
  }

  const handleChatSelect = (chatId: string) => {
    if (messages.length > 0) {
      setChatSessions((prev) =>
        prev.map((session) => (session.id === currentChatId ? { ...session, messages: [...messages] } : session)),
      )
    }

    const selectedSession = chatSessions.find((session) => session.id === chatId)
    if (selectedSession) {
      setCurrentChatId(chatId)
      setMessages(selectedSession.messages)
      setHasFirstMessage(selectedSession.messages.length > 0)
      setValue("")
      setPostMessageValue("")
      setSidebarOpen(false)
    }
  }

  const handleClearAllChats = () => {
    setChatSessions([])
    setMessages([])
    setHasFirstMessage(false)
    setValue("")
    setPostMessageValue("")
    setCurrentChatId("")
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatSessions((prev) => prev.filter((session) => session.id !== chatId))

    // If deleting current chat, switch to first available chat or reset
    if (chatId === currentChatId) {
      const remainingChats = chatSessions.filter((session) => session.id !== chatId)
      if (remainingChats.length > 0) {
        const firstChat = remainingChats[0]
        setCurrentChatId(firstChat.id)
        setMessages(firstChat.messages)
        setHasFirstMessage(firstChat.messages.length > 0)
      } else {
        setCurrentChatId("")
        setMessages([])
        setHasFirstMessage(false)
      }
    }
  }

  const handleEditChat = (chatId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditingName(currentName)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editingName.trim()) {
      setChatSessions((prev) =>
        prev.map((session) => (session.id === chatId ? { ...session, name: editingName.trim() } : session)),
      )
    }
    setEditingChatId(null)
    setEditingName("")
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditingName("")
  }

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value))

      if (matchingSuggestionIndex >= 0) {
        setValue(commandSuggestions[matchingSuggestionIndex].prefix + " ")
      }
    }
  }, [value])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // No changes needed here
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element

      if (!target.closest("[data-command-button]") && !target.closest("[data-textarea]")) {
        setValue("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        handleSendMessage()
      }
    }
  }

  const handleSendMessage = () => {
    if (value.trim()) {
      // Check authentication before sending message
      if (!canUserChat) {
        setShowAuthPopup(true)
        return
      }

      let chatId = currentChatId
      if (!chatId) {
        chatId = Date.now().toString()
        const newChat: ChatSession = {
          id: chatId,
          name: `Chat ${chatSessions.length + 1}`,
          timestamp: "Just now",
          messages: [],
        }
        setChatSessions((prev) => [newChat, ...prev])
        setCurrentChatId(chatId)
      }

      const userMessage = { id: Date.now().toString(), text: value.trim(), isUser: true }
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setValue("")
      adjustHeight(true)
      setHasFirstMessage(true)

      setChatSessions((prev) =>
        prev.map((session) => (session.id === chatId ? { ...session, messages: newMessages } : session)),
      )

      startTransition(() => {
        // Show thinking animation
        setIsThinking(true)
        
        // Call API through our local proxy endpoint to avoid CORS
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: value.trim(),
            sessionid: isSignedIn ? currentChatId : "session123",
            userid: isSignedIn && user?.emailAddresses?.[0]?.emailAddress ? user.emailAddresses[0].emailAddress : "8899"  // Use email when signed in, hardcoded for guest
          })
        })
          .then(response => response.json())
          .then(data => {
            // Process response which might contain chart data in markdown
            const responseText = data.response || "Sorry, I couldn't process that request."
            
            // Check if response contains chart data - handle both escaped and unescaped backticks
            // The API might return either ```chart or \\`\\`\\`chart format
            const chartRegex = /(?:\\`\\`\\`|```)\s*chart\s*([\s\S]*?)(?:\\`\\`\\`|```)/
            const chartMatch = responseText.match(chartRegex)
            
            let chartData = undefined
            let displayText = responseText
            
            if (chartMatch && chartMatch[1]) {
              try {
                // Extract and parse the chart JSON from markdown
                const chartJson = JSON.parse(chartMatch[1].trim())
                chartData = chartJson
                
                // Remove the chart code block from display text
                displayText = responseText.replace(chartMatch[0], '').trim()
              } catch (error) {
                console.error('Error parsing chart data:', error)
              }
            }
            
            // Clean up any remaining escaped backticks or markdown artifacts
            displayText = displayText
              .replace(/\\`\\`\\`/g, '```')
              .replace(/\\`/g, '`')
              .trim()
            
            // If no chart data was found but response mentions charts, generate a fallback chart
            if (!chartData && displayText.length > 0) {
              chartData = generateFallbackChart(displayText)
            }
            
            // Hide thinking animation
            setIsThinking(false)
          
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
              text: displayText.trim(),
            isUser: false,
              chartData: chartData
          }
            
          const updatedMessages = [...newMessages, aiMessage]
          setMessages(updatedMessages)

          setChatSessions((prev) =>
            prev.map((session) => (session.id === chatId ? { ...session, messages: updatedMessages } : session)),
          )
          })
          .catch(error => {
            console.error('Error fetching chat response:', error)
            
            // Hide thinking animation on error
            setIsThinking(false)
            
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              text: "Sorry, there was an error connecting to the chat service. Please try again later.",
              isUser: false
            }
            
            const updatedMessages = [...newMessages, aiMessage]
            setMessages(updatedMessages)

            setChatSessions((prev) =>
              prev.map((session) => (session.id === chatId ? { ...session, messages: updatedMessages } : session)),
            )
          })
      })
    }
  }

  const handlePostMessageSend = () => {
    if (postMessageValue.trim()) {
      // Check authentication before sending message
      if (!canUserChat) {
        setShowAuthPopup(true)
        return
      }

      const userMessage = { id: Date.now().toString(), text: postMessageValue.trim(), isUser: true }
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setPostMessageValue("")
      if (postTextareaRef.current) {
        postTextareaRef.current.style.height = "auto"
        postTextareaRef.current.style.height = "20px"
      }

      setChatSessions((prev) =>
        prev.map((session) => (session.id === currentChatId ? { ...session, messages: newMessages } : session)),
      )

      startTransition(() => {
        // Show thinking animation
        setIsThinking(true)
        
        // Call API through our local proxy endpoint to avoid CORS
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: postMessageValue.trim(),
            sessionid: isSignedIn ? currentChatId : "session123",
            userid: isSignedIn && user?.emailAddresses?.[0]?.emailAddress ? user.emailAddresses[0].emailAddress : "8899"  // Use email when signed in, hardcoded for guest
          })
        })
          .then(response => response.json())
          .then(data => {
            // Process response which might contain chart data in markdown
            const responseText = data.response || "Sorry, I couldn't process that request."
            
            // Check if response contains chart data - handle both escaped and unescaped backticks
            // The API might return either ```chart or \\`\\`\\`chart format
            const chartRegex = /(?:\\`\\`\\`|```)\s*chart\s*([\s\S]*?)(?:\\`\\`\\`|```)/
            const chartMatch = responseText.match(chartRegex)
            
            let chartData = undefined
            let displayText = responseText
            
            if (chartMatch && chartMatch[1]) {
              try {
                // Extract and parse the chart JSON from markdown
                const chartJson = JSON.parse(chartMatch[1].trim())
                chartData = chartJson
                
                // Remove the chart code block from display text
                displayText = responseText.replace(chartMatch[0], '').trim()
              } catch (error) {
                console.error('Error parsing chart data:', error)
              }
            }
            
            // Clean up any remaining escaped backticks or markdown artifacts
            displayText = displayText
              .replace(/\\`\\`\\`/g, '```')
              .replace(/\\`/g, '`')
              .trim()
            
            // If no chart data was found but response mentions charts, generate a fallback chart
            if (!chartData && displayText.length > 0) {
              chartData = generateFallbackChart(displayText)
            }
            
            // Hide thinking animation
            setIsThinking(false)
          
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
              text: displayText.trim(),
            isUser: false,
              chartData: chartData
          }
            
          const updatedMessages = [...newMessages, aiMessage]
          setMessages(updatedMessages)

          setChatSessions((prev) =>
            prev.map((session) => (session.id === currentChatId ? { ...session, messages: updatedMessages } : session)),
          )
          })
          .catch(error => {
            console.error('Error fetching chat response:', error)
            
            // Hide thinking animation on error
            setIsThinking(false)
            
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              text: "Sorry, there was an error connecting to the chat service. Please try again later.",
              isUser: false
            }
            
            const updatedMessages = [...newMessages, aiMessage]
            setMessages(updatedMessages)

            setChatSessions((prev) =>
              prev.map((session) => (session.id === currentChatId ? { ...session, messages: updatedMessages } : session)),
            )
          })
      })
    }
  }

  const handlePostMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (postMessageValue.trim()) {
        handlePostMessageSend()
      }
    }
  }

  const adjustPostTextareaHeight = () => {
    const textarea = postTextareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const lineHeight = 20 // approximate line height
    const maxLines = 5
    const maxHeight = lineHeight * maxLines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)

    textarea.style.height = `${newHeight}px`
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex w-screen overflow-x-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className="fixed left-0 top-0 h-full w-80 bg-card/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 z-50"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-foreground">Accurate</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg transition-colors">
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* New Chat and Search buttons */}
                <div className="p-4 space-y-2 border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:bg-card/50 hover:border-white/20 dark:hover:border-white/10 text-foreground transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="text-sm font-medium">New chat</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Chat History</h3>
                    <button
                      onClick={handleClearAllChats}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-card/30"
                      title="Clear all chats"
                    >
                      <Brush className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {chatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={cn(
                          "group relative w-full p-3 rounded-lg bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:bg-card/50 hover:border-white/20 dark:hover:border-white/10 cursor-pointer transition-all duration-200",
                          currentChatId === chat.id && "bg-card/50 border-white/20 dark:border-white/10",
                        )}
                        onClick={() => !editingChatId && handleChatSelect(chat.id)}
                      >
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(chat.id)
                                } else if (e.key === "Escape") {
                                  handleCancelEdit()
                                }
                              }}
                              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(chat.id)}
                              className="p-1 rounded hover:bg-card/30 text-green-500 hover:text-green-400 transition-colors"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 rounded hover:bg-card/30 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{chat.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{chat.timestamp}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => handleEditChat(chat.id, chat.name, e)}
                                  className="p-1.5 rounded transition-colors"
                                  title="Edit chat name"
                                >
                                  <Edit className="h-3 w-3 text-muted-foreground hover:text-blue-400 transition-colors" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                  className="p-1.5 rounded transition-colors"
                                  title="Delete chat"
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400 transition-colors" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="text-foreground dark:text-white relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-transparent">
        {/* Added custom SidebarIcon component to replace Menu icon */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-card/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:bg-card transition-colors shadow-lg"
        >
          <SidebarIcon className="h-5 w-5 text-foreground" />
        </button>

        {/* Auth Buttons - Top Right */}
        <div className="fixed top-4 right-4 z-30">
          <AuthButtons />
        </div>

        <motion.div
          className="fixed top-4 left-20 right-4 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="overflow-x-auto scrollbar-hide"></div>
        </motion.div>

        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div className="bg-primary/10 absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full mix-blend-normal blur-[128px] filter" />
          <div className="bg-secondary/10 absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full mix-blend-normal blur-[128px] filter delay-700" />
          <div className="bg-primary/10 absolute top-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full mix-blend-normal blur-[96px] filter delay-1000" />
        </div>

        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div
              className="fixed top-20 left-0 right-0 z-10 w-full"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="w-full h-full">
                <div className="max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto w-full">
                  <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-3 pb-1">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className={cn("flex w-full items-end gap-2", message.isUser ? "justify-end" : "justify-start")}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                      >
                        {!message.isUser && (
                          <div className="flex-shrink-0 mb-1">
                            <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-sm border border-primary/20 dark:border-primary/30 rounded-full p-1.5">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        )}

                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm shadow-sm",
                            "bg-card border border-gray-200 dark:border-gray-800 text-card-foreground",
                            "break-words overflow-wrap-anywhere",
                            message.chartData 
                              ? "max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:min-w-[500px]" 
                              : "max-w-[85%] sm:max-w-[80%]"
                          )}
                           style={{ 
                             whiteSpace: "pre-wrap" 
                           }}
                         >
                           <ReactMarkdown 
                             remarkPlugins={[remarkGfm]}
                             className="prose prose-sm max-w-none dark:prose-invert"
                               components={{
                                 table: ({ children }) => (
                                   <div className="overflow-x-auto my-6 rounded-xl bg-card/40 backdrop-blur-xl border-2 border-white/40 dark:border-white/20 shadow-lg">
                                     <table className="min-w-full border-collapse text-xs border border-white/30">
                                       {children}
                                     </table>
                                   </div>
                                 ),
                                 thead: ({ children }) => (
                                   <thead className="bg-purple-600/80 dark:bg-purple-700/90 backdrop-blur-xl border-b-2 border-white/50">
                                     {children}
                                   </thead>
                                 ),
                                 tbody: ({ children }) => (
                                   <tbody className="bg-card/20 backdrop-blur-xl">
                                     {children}
                                   </tbody>
                                 ),
                                 tr: ({ children }) => (
                                   <tr className="border-b-2 border-white/40 dark:border-white/30 hover:bg-card/40 transition-colors duration-200">
                                     {children}
                                   </tr>
                                 ),
                                 th: ({ children }) => (
                                   <th className="px-4 py-4 text-left font-bold text-white border-r-2 border-white/50 first:rounded-tl-xl last:rounded-tr-xl last:border-r-0">
                                     {children}
                                   </th>
                                 ),
                                 td: ({ children }) => (
                                   <td className="px-4 py-3 text-foreground/90 border-r-2 border-white/40 dark:border-white/30 last:border-r-0">
                                     {children}
                                   </td>
                                 ),
                               p: ({ children }) => (
                                 <p className="mb-2 last:mb-0 text-foreground">
                                   {children}
                                 </p>
                               ),
                               strong: ({ children }) => (
                                 <strong className="font-semibold text-foreground">
                                   {children}
                                 </strong>
                               ),
                               em: ({ children }) => (
                                 <em className="italic text-foreground/90">
                                   {children}
                                 </em>
                               )
                             }}
                        >
                          {message.text}
                           </ReactMarkdown>
                          {message.chartData && (
                            <div className="mt-6 w-full min-w-[300px]">
                              <ChartRenderer chartData={message.chartData} />
                            </div>
                          )}
                        </div>

                        {message.isUser && (
                          <div className="flex-shrink-0 mb-1">
                            <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-sm border border-primary/20 dark:border-primary/30 rounded-full p-1.5">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isThinking && (
                      <ThinkingAnimation />
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!hasFirstMessage && (
            <div
              className={cn(
                "z-20 p-4 sm:p-6 w-full",
                "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              )}
            >
              <div className="mx-auto w-full max-w-4xl">
                <motion.div
                  className="space-y-3 text-center mb-6 sm:mb-8"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-block"
                  >
                    <h1 className="pb-1 text-2xl sm:text-3xl font-medium tracking-tight">How can I help today?</h1>
                    <motion.div
                      className="via-primary/50 h-px bg-gradient-to-r from-transparent to-transparent"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
                    {suggestedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSuggestionClick(question)}
                        className="px-4 py-2 rounded-full bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:bg-card/50 hover:border-white/20 dark:hover:border-white/10 text-sm text-foreground transition-all duration-200 cursor-pointer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-card/95 border-gray-200 dark:border-gray-800 relative rounded-2xl border shadow-2xl backdrop-blur-xl"
                  initial={{ scale: 0.98 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-3 sm:p-4">
                    <Textarea
                      ref={textareaRef}
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value)
                        adjustHeight()
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Ask mvp.ai a question..."
                      containerClassName="w-full"
                      className={cn(
                        "w-full px-3 py-2.5 sm:px-4 sm:py-3",
                        "resize-none",
                        "bg-transparent",
                        "border-none",
                        "text-foreground dark:text-white text-sm",
                        "focus:outline-none",
                        "placeholder:text-muted-foreground dark:placeholder:text-gray-400",
                        "min-h-[60px]",
                      )}
                      style={{
                        overflow: "hidden",
                      }}
                      showRing={false}
                    />
                  </div>

                  <AnimatePresence>
                    {attachments.length > 0 && (
                      <motion.div
                        className="flex flex-wrap gap-2 px-3 pb-3 sm:px-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {attachments.map((file, index) => (
                          <motion.div
                            key={index}
                            className="bg-primary/5 text-muted-foreground dark:text-gray-300 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                          >
                            <span className="truncate max-w-[120px] sm:max-w-none">{file}</span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 sm:gap-4 border-t p-3 sm:p-4 relative">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <motion.button
                        type="button"
                        onClick={handleAttachFile}
                        whileTap={{ scale: 0.94 }}
                        className="group text-muted-foreground dark:text-gray-300 hover:text-primary relative rounded-lg p-2 transition-all duration-200 hover:bg-primary/10"
                      >
                        <Paperclip className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={handleAttachFile}
                        whileTap={{ scale: 0.94 }}
                        className="group text-muted-foreground dark:text-gray-300 hover:text-primary relative rounded-lg p-2 transition-all duration-200 hover:bg-primary/10"
                      >
                        <FileText className="h-4 w-4" />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={() => {}} // Placeholder for voice functionality
                        whileTap={{ scale: 0.94 }}
                        className="group text-muted-foreground dark:text-gray-300 hover:text-primary relative rounded-lg p-2 transition-all duration-200 hover:bg-primary/10"
                      >
                        <Mic className="h-4 w-4" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleSendMessage}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!value.trim()}
                        className={cn(
                          "rounded-xl px-4 py-2.5 sm:px-6 text-sm font-medium transition-all duration-200",
                          "flex items-center gap-2",
                          value.trim()
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/30"
                            : "bg-muted/50 text-muted-foreground dark:text-gray-500 cursor-not-allowed",
                        )}
                      >
                        <SendIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Send</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasFirstMessage && (
            <motion.div
              className="fixed bottom-2 left-4 right-4 z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="mx-auto w-full max-w-4xl">
                <motion.div
                  className="mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="overflow-x-auto scrollbar-hide">
                    {/* Reduced gap from gap-2 to gap-1.5 and padding from pb-2 to pb-1 */}
                    <div className="flex gap-1.5 pb-1 min-w-max">
                      {suggestedQuestions.map((question, index) => (
                        <motion.button
                          key={index}
                          onClick={() => {
                            // Check authentication before setting the question
                            if (!canUserChat) {
                              setShowAuthPopup(true)
                              return
                            }
                            
                            setPostMessageValue(question)
                            if (postTextareaRef.current) {
                              postTextareaRef.current.focus()
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:bg-card/50 hover:border-white/20 dark:hover:border-white/10 text-xs text-foreground transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {question}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-card/95 border-gray-200 dark:border-gray-800 relative border shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out"
                  initial={{ scale: 0.95 }}
                  animate={{
                    scale: 1,
                    borderRadius: postMessageValue.includes("\n") || postMessageValue.length > 50 ? "16px" : "9999px",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      "flex gap-3 px-4 transition-all duration-300 ease-out",
                      postMessageValue.includes("\n") || postMessageValue.length > 50
                        ? "items-end py-3"
                        : "items-center py-2",
                    )}
                  >
                    <motion.button
                      type="button"
                      onClick={handleAttachFile}
                      whileTap={{ scale: 0.94 }}
                      className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-all duration-200 hover:bg-primary/10 rounded-lg p-1.5 flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleAttachFile}
                      whileTap={{ scale: 0.94 }}
                      className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-all duration-200 hover:bg-primary/10 rounded-lg p-1.5 flex-shrink-0"
                    >
                      <FileText className="h-4 w-4" />
                    </motion.button>

                    <textarea
                      ref={postTextareaRef}
                      value={postMessageValue}
                      onChange={(e) => {
                        setPostMessageValue(e.target.value)
                        adjustPostTextareaHeight()
                      }}
                      onKeyDown={handlePostMessageKeyDown}
                      placeholder="Message..."
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400 resize-none overflow-y-auto scrollbar-hide min-h-[20px] max-h-[100px]"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        lineHeight: "20px",
                        paddingTop: postMessageValue.includes("\n") || postMessageValue.length > 50 ? "4px" : "0px",
                        paddingBottom: postMessageValue.includes("\n") || postMessageValue.length > 50 ? "4px" : "0px",
                      }}
                    />

                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={() => {}} // Placeholder for voice functionality
                        whileTap={{ scale: 0.94 }}
                        className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-all duration-200 hover:bg-primary/10 rounded-lg p-1.5 flex-shrink-0"
                      >
                        <Mic className="h-4 w-4" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handlePostMessageSend}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!postMessageValue.trim()}
                        className={cn(
                          "rounded-full p-2 transition-all duration-200 flex-shrink-0",
                          postMessageValue.trim()
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                            : "bg-muted/50 text-muted-foreground dark:text-gray-500 cursor-not-allowed",
                        )}
                      >
                        <SendIcon className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Popup */}
        <AuthPopup 
          isOpen={showAuthPopup} 
          onClose={() => setShowAuthPopup(false)}
          onContinueAsGuest={handleContinueAsGuest}
          title="Authentication Required"
          description="Please sign in or sign up to start chatting with our AI assistant."
        />
      </div>
    </div>
  )
}

const SidebarIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
  </svg>
)

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`

/* Added custom scrollbar styles with light gradient thumb and invisible track */
const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%);
}

/* Firefox scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
`

if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.innerHTML = rippleKeyframes + customScrollbarStyles
  document.head.appendChild(style)
}
