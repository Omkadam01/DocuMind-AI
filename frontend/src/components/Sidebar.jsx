import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Plus, MessageSquare, Trash2, Upload, FileText, Globe,
  Settings, ChevronRight, Loader2, Brain, Search, X, Check, Edit3
} from 'lucide-react'
import { useStore } from '../lib/store'
import {
  deleteSession, getMessages, getDocuments, uploadDocs,
  listSessions, createSession, renameSession
} from '../lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Sidebar({ onNewSession, onSessionsUpdate }) {
  const {
    sessions, setSessions, activeSession, setActiveSession,
    setMessages, setDocuments, documents, totalChunks, setTotalChunks,
    searchMode, setSearchMode, selectedPdf, setSelectedPdf,
    useWebSearch, setUseWebSearch, setSidebarOpen
  } = useStore()

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [tab, setTab] = useState('sessions') // sessions | docs | settings

  const loadSession = async (session) => {
    setActiveSession(session)
    try {
      const [msgs, docs] = await Promise.all([
        getMessages(session.session_id || session.id),
        getDocuments(session.session_id || session.id),
      ])
      setMessages(msgs)
      setDocuments(docs)
      setTotalChunks(docs.reduce((s, d) => s + (d.chunks || 0), 0))
    } catch {}
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteSession(id)
    const updated = await listSessions()
    setSessions(updated)
    if (activeSession?.id === id || activeSession?.session_id === id) {
      setActiveSession(null)
      setMessages([])
      setDocuments([])
    }
    toast.success('Session deleted')
  }

  const handleRename = async (id) => {
    if (!editName.trim()) return
    await renameSession(id, editName.trim())
    const updated = await listSessions()
    setSessions(updated)
    setEditingId(null)
    toast.success('Renamed')
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!activeSession) {
      toast.error('Create or select a session first')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 8, 85)), 200)
    try {
      const result = await uploadDocs(activeSession.session_id || activeSession.id, acceptedFiles)
      clearInterval(interval)
      setUploadProgress(100)
      const docs = await getDocuments(activeSession.session_id || activeSession.id)
      setDocuments(docs)
      setTotalChunks(docs.reduce((s, d) => s + (d.chunks || 0), 0))
      toast.success(`${result.indexed.length} document(s) indexed — ${result.total_chunks} chunks`)
      setTimeout(() => { setUploading(false); setUploadProgress(0) }, 600)
    } catch {
      clearInterval(interval)
      setUploading(false)
      setUploadProgress(0)
    }
  }, [activeSession])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: true
  })

  const activeId = activeSession?.session_id || activeSession?.id

  return (
    <div className="w-72 h-full flex flex-col bg-[#080d1a] border-r border-white/5 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Brain size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">DocuMind AI</div>
            <div className="text-[10px] text-slate-600 mt-0.5">v2.0 · Groq LLaMA 3.3</div>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="text-slate-700 hover:text-slate-400 transition-colors p-1">
          <X size={14} />
        </button>
      </div>

      {/* New session button */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-blue-400 text-sm font-medium hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/40 transition-all duration-200 group"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          New Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-1">
        {[
          { id: 'sessions', icon: MessageSquare, label: 'Chats' },
          { id: 'docs',     icon: FileText,      label: 'Docs' },
          { id: 'settings', icon: Settings,       label: 'Config' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              tab === t.id
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                : 'text-slate-600 hover:text-slate-400 hover:bg-white/3'
            )}
          >
            <t.icon size={11} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <AnimatePresence mode="wait">

          {/* SESSIONS TAB */}
          {tab === 'sessions' && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-700 text-xs">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                  No sessions yet
                </div>
              ) : (
                sessions.map((sess, i) => {
                  const sid = sess.session_id || sess.id
                  const isActive = sid === activeId
                  const isEditing = editingId === sid
                  return (
                    <motion.div
                      key={sid}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => !isEditing && loadSession(sess)}
                      className={clsx(
                        'group flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition-all duration-200 border',
                        isActive
                          ? 'bg-blue-500/10 border-blue-500/25 shadow-sm shadow-blue-500/10'
                          : 'border-transparent hover:bg-white/3 hover:border-white/6'
                      )}
                    >
                      <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors', isActive ? 'bg-blue-400' : 'bg-slate-700 group-hover:bg-slate-500')} />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(sid); if (e.key === 'Escape') setEditingId(null) }}
                            onBlur={() => handleRename(sid)}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-transparent text-xs text-white outline-none border-b border-blue-400/50"
                          />
                        ) : (
                          <>
                            <div className={clsx('text-xs font-medium truncate', isActive ? 'text-blue-100' : 'text-slate-400')}>
                              {sess.name}
                            </div>
                            <div className="text-[10px] text-slate-700 mt-0.5">
                              {sess.message_count || 0} messages
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); setEditingId(sid); setEditName(sess.name) }} className="text-slate-600 hover:text-slate-300 p-0.5 transition-colors">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={e => handleDelete(e, sid)} className="text-slate-600 hover:text-red-400 p-0.5 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}

          {/* DOCS TAB */}
          {tab === 'docs' && (
            <motion.div key="docs" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 mb-3',
                  isDragActive
                    ? 'border-blue-400/60 bg-blue-500/8'
                    : 'border-white/8 hover:border-blue-400/30 hover:bg-white/2'
                )}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div>
                    <Loader2 size={20} className="mx-auto mb-2 text-blue-400 animate-spin" />
                    <div className="text-xs text-slate-500 mb-2">Indexing documents…</div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={18} className={clsx('mx-auto mb-2 transition-colors', isDragActive ? 'text-blue-400' : 'text-slate-600')} />
                    <div className="text-xs text-slate-500">
                      {isDragActive ? 'Drop PDFs here' : 'Drop PDFs or click to upload'}
                    </div>
                    <div className="text-[10px] text-slate-700 mt-1">Multiple files supported</div>
                  </>
                )}
              </div>

              {/* Docs list */}
              {documents.length > 0 ? (
                <>
                  <div className="text-[10px] text-slate-700 uppercase tracking-widest mb-2 px-1">
                    {documents.length} doc(s) · {totalChunks.toLocaleString()} chunks
                  </div>
                  {documents.map((doc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={clsx(
                        'flex items-start gap-2 p-2.5 rounded-xl mb-1.5 border transition-all cursor-pointer',
                        selectedPdf === doc.filename
                          ? 'bg-purple-500/10 border-purple-500/25'
                          : 'bg-white/2 border-white/5 hover:border-white/10'
                      )}
                      onClick={() => setSelectedPdf(selectedPdf === doc.filename ? null : doc.filename)}
                    >
                      <FileText size={13} className="text-blue-400/60 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-400 truncate font-medium">{doc.filename}</div>
                        <div className="text-[10px] text-slate-700 mt-0.5">{doc.pages}p · {doc.chunks} chunks</div>
                      </div>
                      {selectedPdf === doc.filename && <Check size={11} className="text-purple-400 flex-shrink-0 mt-0.5" />}
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="text-center py-6 text-slate-700 text-xs">
                  <FileText size={20} className="mx-auto mb-2 opacity-30" />
                  No documents indexed
                </div>
              )}
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <div className="text-[10px] text-slate-700 uppercase tracking-widest mb-2 px-1">Search Mode</div>
                {[
                  { id: 'all', label: 'All Documents', desc: 'Search across every uploaded PDF' },
                  { id: 'single', label: 'Single Document', desc: 'Focus on one selected PDF' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSearchMode(opt.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-xl mb-1.5 text-left border transition-all',
                      searchMode === opt.id
                        ? 'bg-blue-500/10 border-blue-500/25 text-blue-400'
                        : 'bg-white/2 border-white/5 text-slate-500 hover:border-white/10'
                    )}
                  >
                    <div className={clsx('w-2 h-2 rounded-full border-2 flex-shrink-0', searchMode === opt.id ? 'border-blue-400 bg-blue-400' : 'border-slate-600')} />
                    <div>
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[10px] text-slate-700 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <div className="text-[10px] text-slate-700 uppercase tracking-widest mb-2 px-1">Web Search</div>
                <button
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                    useWebSearch
                      ? 'bg-green-500/10 border-green-500/25 text-green-400'
                      : 'bg-white/2 border-white/5 text-slate-500 hover:border-white/10'
                  )}
                >
                  <Globe size={14} className="flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium">DuckDuckGo Web Search</div>
                    <div className="text-[10px] text-slate-700 mt-0.5">Augment answers with live web results</div>
                  </div>
                  <div className={clsx('w-8 h-4 rounded-full border transition-all relative', useWebSearch ? 'bg-green-500/30 border-green-500/40' : 'bg-white/5 border-white/10')}>
                    <motion.div
                      animate={{ x: useWebSearch ? 16 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={clsx('absolute top-0.5 w-3 h-3 rounded-full', useWebSearch ? 'bg-green-400' : 'bg-slate-600')}
                    />
                  </div>
                </button>
              </div>

              <div>
                <div className="text-[10px] text-slate-700 uppercase tracking-widest mb-2 px-1">Model</div>
                <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                  <div className="text-xs text-slate-400 font-medium">Groq · LLaMA 3.3 70B</div>
                  <div className="text-[10px] text-slate-700 mt-1">100% free · No billing · Ultra fast</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-500">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom status */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
          <span>{activeSession ? `Session: ${activeSession.name?.slice(0,20)}` : 'No active session'}</span>
        </div>
      </div>
    </div>
  )
}
