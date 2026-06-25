import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { useStore } from './lib/store'
import { listSessions, createSession } from './lib/api'
import toast from 'react-hot-toast'

export default function App() {
  const { sidebarOpen, sessions, setSessions, setActiveSession, activeSession, setMessages, setDocuments, setTotalChunks } = useStore()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await listSessions()
      setSessions(data)
      if (data.length > 0 && !activeSession) {
        // auto-load most recent
      }
    } catch {
      // backend may not be running yet
    }
  }

  const handleNewSession = async () => {
    const name = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    try {
      const session = await createSession(name)
      const updated = await listSessions()
      setSessions(updated)
      setActiveSession(session)
      setMessages([])
      setDocuments([])
      setTotalChunks(0)
      toast.success('New session created')
    } catch {}
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060912]">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/4 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/3 blur-3xl" />
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-20 flex-shrink-0"
          >
            <Sidebar onNewSession={handleNewSession} onSessionsUpdate={loadSessions} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <ChatArea onNewSession={handleNewSession} />
      </div>
    </div>
  )
}
