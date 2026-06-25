import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Menu, Plus, Zap, Globe, FileSearch,
  BookOpen, BarChart3, Sparkles, Brain, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../lib/store'
import { askQuestion } from '../lib/api'
import Message from './Message'
import WelcomeScreen from './WelcomeScreen'

const SUGGESTIONS = [
  { icon: BookOpen,   label: 'Summarize all documents',          color: 'text-blue-400' },
  { icon: BarChart3,  label: 'What are the key findings?',       color: 'text-purple-400' },
  { icon: FileSearch, label: 'Compare documents side by side',   color: 'text-cyan-400' },
  { icon: Sparkles,   label: 'List main recommendations',        color: 'text-green-400' },
]

export default function ChatArea({ onNewSession }) {
  const {
    activeSession, messages, addMessage, setMessages,
    isLoading, setLoading, setSidebarOpen, sidebarOpen,
    searchMode, selectedPdf, useWebSearch, documents
  } = useStore()

  const [input, setInput] = useState('')
  const [streamingMsg, setStreamingMsg] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const hasMessages = messages.length > 0
  const hasDocs = documents.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMsg])

  const handleSend = async (question = input.trim()) => {
    if (!question || isLoading || !activeSession) return

    setInput('')
    setLoading(true)

    // Add user message immediately
    const userMsg = { role: 'user', content: question, timestamp: new Date().toISOString() }
    addMessage(userMsg)

    // Streaming simulation — show thinking state
    setStreamingMsg({ role: 'assistant', content: '', isStreaming: true })

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const result = await askQuestion({
        session_id: activeSession.session_id || activeSession.id,
        question,
        search_mode: searchMode,
        selected_pdf: selectedPdf,
        use_web_search: useWebSearch,
        chat_history: history,
      })

      // Simulate typewriter streaming
      const fullText = result.answer
      let i = 0
      const chunkSize = 8
      const stream = () => {
        if (i < fullText.length) {
          i = Math.min(i + chunkSize, fullText.length)
          setStreamingMsg({
            role: 'assistant',
            content: fullText.slice(0, i),
            isStreaming: i < fullText.length,
            sources: result.sources,
            page_refs: result.page_refs,
            web_results: result.web_results,
            retrieval_mode: result.retrieval_mode,
            model: result.model,
            timestamp: result.timestamp,
          })
          if (i < fullText.length) requestAnimationFrame(stream)
          else {
            // Finalize
            setTimeout(() => {
              addMessage({
                role: 'assistant',
                content: fullText,
                sources: result.sources,
                page_refs: result.page_refs,
                web_results: result.web_results,
                retrieval_mode: result.retrieval_mode,
                model: result.model,
                timestamp: result.timestamp,
              })
              setStreamingMsg(null)
              setLoading(false)
            }, 100)
          }
        }
      }
      requestAnimationFrame(stream)

    } catch {
      setStreamingMsg(null)
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#060912]/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/5">
              <Menu size={16} />
            </button>
          )}
          <div className="flex items-center gap-2">
            {activeSession ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
                <span className="text-sm text-slate-300 font-medium truncate max-w-xs">{activeSession.name}</span>
              </>
            ) : (
              <span className="text-sm text-slate-600">No session selected</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {useWebSearch && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              <Globe size={11} />
              Web
            </div>
          )}
          {hasDocs && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
              <FileSearch size={11} />
              {documents.length} doc{documents.length > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/3 border border-white/8 text-slate-400 text-xs hover:text-white hover:border-white/15 transition-all"
          >
            <Plus size={12} />
            New
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!activeSession ? (
          <WelcomeScreen onNewSession={onNewSession} />
        ) : !hasMessages && !streamingMsg ? (
          <div className="h-full flex flex-col items-center justify-center px-6 py-12">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/20 flex items-center justify-center mb-5 shadow-xl shadow-blue-500/10"
            >
              <Brain size={28} className="text-blue-400" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-white mb-2 text-center"
            >
              What do you want to know?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-slate-600 text-center mb-8 max-w-md"
            >
              {hasDocs
                ? `${documents.length} document(s) indexed. Ask anything.`
                : 'Upload PDFs from the sidebar to get started, or ask a general question.'}
            </motion.p>

            {/* Suggestion cards */}
            {hasDocs && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3 w-full max-w-xl"
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(s.label)}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/2 border border-white/6 hover:bg-white/4 hover:border-white/12 text-left transition-all group"
                  >
                    <s.icon size={15} className={clsx(s.color, 'mt-0.5 flex-shrink-0')} />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">{s.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <Message key={i} message={msg} index={i} />
              ))}
            </AnimatePresence>
            {streamingMsg && <Message message={streamingMsg} index={messages.length} isStreaming />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3 bg-gradient-to-t from-[#060912] to-transparent">
        <div className="max-w-3xl mx-auto">
          {/* Status chips above input */}
          {activeSession && (hasDocs || useWebSearch) && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[10px] text-slate-700">Sources:</span>
              {hasDocs && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/15 text-blue-500">
                  {searchMode === 'all' ? `${documents.length} docs` : selectedPdf?.slice(0, 20) || 'single doc'}
                </span>
              )}
              {useWebSearch && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/15 text-green-500 flex items-center gap-1">
                  <Globe size={8} /> web
                </span>
              )}
            </div>
          )}

          {/* Input box */}
          <div className={clsx(
            'relative flex items-end gap-3 p-3 rounded-2xl border transition-all duration-300',
            'bg-[#080d1a]',
            input || isLoading
              ? 'border-blue-500/35 shadow-lg shadow-blue-500/8'
              : 'border-white/8 hover:border-white/14'
          )}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
              onKeyDown={handleKeyDown}
              placeholder={!activeSession ? 'Create a session to start chatting…' : hasDocs ? 'Ask anything about your documents…' : 'Ask a question or upload PDFs to get started…'}
              disabled={!activeSession || isLoading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-700 resize-none outline-none leading-relaxed max-h-40 disabled:opacity-40"
              style={{ minHeight: '24px' }}
            />
            <motion.button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || !activeSession}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                input.trim() && !isLoading && activeSession
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/4 text-slate-700 cursor-not-allowed'
              )}
            >
              {isLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} />
              }
            </motion.button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] text-slate-800">Enter to send · Shift+Enter for new line</span>
            <span className="text-[10px] text-slate-800">Groq LLaMA 3.3 70B</span>
          </div>
        </div>
      </div>
    </div>
  )
}
