import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const http = axios.create({ baseURL: BASE, timeout: 90000 })

http.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    toast.error(msg)
    return Promise.reject(err)
  }
)

export const createSession  = (name) => http.post('/sessions/create', { name }).then(r => r.data)
export const listSessions   = ()     => http.get('/sessions').then(r => r.data)
export const deleteSession  = (id)   => http.delete(`/sessions/${id}`).then(r => r.data)
export const renameSession  = (id,name) => http.patch(`/sessions/${id}/rename`, { name }).then(r => r.data)
export const getMessages    = (id)   => http.get(`/sessions/${id}/messages`).then(r => r.data)
export const getDocuments   = (id)   => http.get(`/sessions/${id}/documents`).then(r => r.data)
export const uploadDocs     = (sessionId, files) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  return http.post(`/sessions/${sessionId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
export const askQuestion  = (payload) => http.post('/ask', payload).then(r => r.data)
export const healthCheck  = ()        => http.get('/health').then(r => r.data)
