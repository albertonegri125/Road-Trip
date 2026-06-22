import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--tx)',
            border: '1px solid var(--border2)',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'var(--font-b)',
          },
        }}
      />
    </AppProvider>
  </BrowserRouter>
)
