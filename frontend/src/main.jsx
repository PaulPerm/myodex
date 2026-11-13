import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)