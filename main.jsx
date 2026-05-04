import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import './index.css'

const AppWithSocket = () => {
  const [user, setUser] = React.useState(() => {
    try {
      const saved = localStorage.getItem('ak_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  return (
    <SocketProvider user={user}>
      <AuthProvider onUserChange={setUser}>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#111f18',
                color: '#e2e8f0',
                border: '1px solid #1a3625',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#111f18' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#111f18' },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </SocketProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithSocket />
    </BrowserRouter>
  </React.StrictMode>,
)
