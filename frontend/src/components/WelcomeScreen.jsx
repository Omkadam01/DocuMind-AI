import React from 'react'
import { motion } from 'framer-motion'
import { Brain, MessageSquare, Upload, Search, Zap, Globe, Shield, Database } from 'lucide-react'

const features = [
  { icon: Brain,        color: 'from-blue-600/30 to-cyan-600/30 border-blue-500/20',   label: 'Groq LLaMA 3.3',    desc: '100% free, ultra-fast LLM' },
  { icon: Database,     color: 'from-purple-600/30 to-blue-600/30 border-purple-500/20', label: 'FAISS RAG',         desc: 'Vector search over your PDFs' },
  { icon: Globe,        color: 'from-green-600/30 to-teal-600/30 border-green-500/20',  label: 'Web Search',        desc: 'DuckDuckGo augmentation' },
  { icon: Search,       color: 'from-amber-600/30 to-orange-600/30 border-amber-500/20',label: 'Page Citations',    desc: 'Exact page number references' },
  { icon: MessageSquare,color: 'from-pink-600/30 to-rose-600/30 border-pink-500/20',    label: 'Persistent Chats',  desc: 'Sessions saved to SQLite' },
  { icon: Shield,       color: 'from-slate-600/30 to-zinc-600/30 border-slate-500/20',  label: 'FastAPI Backend',   desc: 'REST API + Swagger docs' },
]

export default function WelcomeScreen({ onNewSession }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-10 text-center">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/40 to-purple-600/40 border border-blue-500/25 flex items-center justify-center shadow-2xl shadow-blue-500/15">
          <Brain size={36} className="text-blue-300" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-xl"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-3xl font-bold text-white mb-2 tracking-tight"
      >
        DocuMind AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-slate-500 text-sm mb-8 max-w-sm"
      >
        Production RAG assistant. Upload documents, ask questions, get cited answers — powered by Groq LLaMA 3.3.
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNewSession}
        className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow mb-10"
      >
        <Zap size={15} />
        Start New Session
      </motion.button>

      {/* Feature grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3 w-full max-w-xl"
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5 cursor-default"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center border`}>
              <f.icon size={15} className="text-white/70" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">{f.label}</div>
              <div className="text-[10px] text-slate-700 mt-0.5">{f.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
