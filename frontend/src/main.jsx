import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0d1525',
          color: '#e2e8f0',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '12px',
          fontSize: '0.82rem',
        },
        success: { iconTheme: { primary: '#34d399', secondary: '#0d1525' } },
        error:   { iconTheme: { primary: '#f87171', secondary: '#0d1525' } },
      }}
    />
  </React.StrictMode>
)
