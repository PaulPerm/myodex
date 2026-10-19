import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [busy, setBusy]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(username, password)
      else await register(email, username, password)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full bg-white/5 border border-white/10 px-4 py-3 md:py-2 text-base md:text-xs tracking-widest text-white placeholder-white/20 outline-none focus:border-white/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm flex flex-col gap-4 bg-black/95 border border-white/10 p-6 md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-white/40 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-2xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {mode === 'register' && (
          <input className={input} type="email" placeholder="Email" value={email} autoComplete="email"
            onChange={e => setEmail(e.target.value)} required />
        )}
        <input className={input} placeholder={mode === 'login' ? 'Username or email' : 'Username'}
          value={username} onChange={e => setUsername(e.target.value)} required minLength={3}
          autoComplete="username" autoCapitalize="none" autoCorrect="off" />
        <input className={input} type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

        {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

        <button
          disabled={busy}
          className="bg-[#c0392b] text-white text-xs font-bold uppercase tracking-widest py-3 md:py-2 hover:bg-[#a93226] disabled:opacity-50"
        >
          {busy ? '...' : mode === 'login' ? 'Sign In' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/70 py-1"
        >
          {mode === 'login' ? 'No account? Register' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}