// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--bg2)', color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
            boxShadow: 'var(--shadow)',
          },
          success: { iconTheme: { primary: '#2D5016', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#C43030', secondary: '#fff' } },
        }} />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)
