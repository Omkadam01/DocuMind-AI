import React, { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Brain, User, ExternalLink, BookOpen, Globe, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/8 text-slate-600 hover:text-slate-300">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400/60"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <span className="text-xs text-slate-600 ml-1">Thinking…</span>
    </div>
  )
}

export default function Message({ message, index, isStreaming }) {
  const isUser = message.role === 'user'
  const [showWeb, setShowWeb] = useState(false)
  const [showPageRefs, setShowPageRefs] = useState(true)
  const hasPageRefs = message.page_refs && Object.keys(message.page_refs).length > 0
  const hasSources  = message.sources && message.sources.length > 0
  const hasWeb      = message.web_results && message.web_results.length > 0
  const isEmpty     = !message.content && isStreaming

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className={clsx('group flex gap-3 py-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-purple-500/20 flex items-center justify-center">
            <User size={13} className="text-purple-300" />
          </div>
        ) : (
          <motion.div
            animate={isStreaming && isEmpty ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600/40 to-cyan-600/40 border border-blue-500/20 flex items-center justify-center"
          >
            <Brain size={13} className="text-blue-300" />
          </motion.div>
        )}
      </div>

      {/* Bubble */}
      <div className={clsx('flex-1 min-w-0', isUser && 'flex justify-end')}>
        {isUser ? (
          <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/15 text-sm text-slate-200 leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="max-w-[88%]">
            {/* Answer content */}
            <div className="relative">
              {isEmpty ? (
                <ThinkingDots />
              ) : (
                <div className={clsx('prose-doc', isStreaming && message.content && 'typing-cursor')}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
              {message.content && !isStreaming && (
                <div className="absolute top-0 right-0">
                  <CopyButton text={message.content} />
                </div>
              )}
            </div>

            {/* Sources + page refs (only on complete messages) */}
            {!isStreaming && (hasSources || hasPageRefs || hasWeb) && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3 space-y-2"
              >
                {/* Source chips */}
                {hasSources && (
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((src, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/8 border border-blue-500/18 text-blue-400 text-[10px] font-medium">
                        <BookOpen size={9} />
                        {src.length > 28 ? src.slice(0, 26) + '…' : src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Page references */}
                {hasPageRefs && (
                  <div className="border border-amber-500/15 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowPageRefs(!showPageRefs)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-amber-500/6 hover:bg-amber-500/10 transition-colors text-left"
                    >
                      <span className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider flex items-center gap-1.5">
                        📍 Page References
                      </span>
                      {showPageRefs ? <ChevronUp size={11} className="text-amber-500/50" /> : <ChevronDown size={11} className="text-amber-500/50" />}
                    </button>
                    {showPageRefs && (
                      <div className="px-3 py-2 space-y-1">
                        {Object.entries(message.page_refs).map(([fname, pages]) => (
                          <div key={fname} className="flex items-start gap-2 text-[11px]">
                            <span className="text-slate-600 truncate max-w-[140px]">{fname}</span>
                            <span className="text-slate-700">→</span>
                            <div className="flex flex-wrap gap-1">
                              {pages.map(p => (
                                <span key={p} className="px-1.5 py-0.5 rounded bg-amber-500/12 border border-amber-500/20 text-amber-400/80 font-mono">p.{p}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Web results */}
                {hasWeb && (
                  <div className="border border-green-500/15 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowWeb(!showWeb)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-green-500/6 hover:bg-green-500/10 transition-colors text-left"
                    >
                      <span className="text-[10px] font-semibold text-green-400/80 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe size={9} /> Web Sources ({message.web_results.length})
                      </span>
                      {showWeb ? <ChevronUp size={11} className="text-green-500/50" /> : <ChevronDown size={11} className="text-green-500/50" />}
                    </button>
                    {showWeb && (
                      <div className="px-3 py-2 space-y-2.5">
                        {message.web_results.slice(0, 3).map((r, i) => (
                          <div key={i}>
                            <a href={r.url} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1.5 text-[11px] text-green-400 hover:text-green-300 transition-colors">
                              <ExternalLink size={9} />
                              <span className="truncate">{r.title}</span>
                            </a>
                            <p className="text-[10px] text-slate-700 mt-0.5 line-clamp-2">{r.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 text-[10px] text-slate-800 px-0.5">
                  {message.model && <span>{message.model}</span>}
                  {message.retrieval_mode && <span>{message.retrieval_mode}</span>}
                  {message.timestamp && <span>{message.timestamp.slice(11, 19)}</span>}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
