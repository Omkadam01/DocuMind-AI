import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Sessions
  sessions: [],
  activeSession: null,
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (session) => set({ activeSession: session }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),

  // Documents
  documents: [],
  setDocuments: (documents) => set({ documents }),

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  isLoading: false,
  setLoading: (v) => set({ isLoading: v }),
  isStreaming: false,
  setStreaming: (v) => set({ isStreaming: v }),
  streamingText: '',
  setStreamingText: (v) => set({ streamingText: v }),

  // Settings
  searchMode: 'all',
  setSearchMode: (v) => set({ searchMode: v }),
  selectedPdf: null,
  setSelectedPdf: (v) => set({ selectedPdf: v }),
  useWebSearch: false,
  setUseWebSearch: (v) => set({ useWebSearch: v }),

  // Stats
  totalChunks: 0,
  setTotalChunks: (v) => set({ totalChunks: v }),
}))
