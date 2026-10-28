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

  const input = 'w-full bg-transparent border border-rule-input px-4 py-3 md:py-2 text-base md:text-[13px] text-paper outline-none focus:border-paper'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,15,14,0.85)] p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm flex flex-col gap-4 bg-bg border border-rule-input p-6 md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-text-3 hover:text-paper"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="font-display font-black text-[28px] uppercase tracking-[0.04em] text-paper leading-none">
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

        {error && <p className="text-[13px] text-paper">{error}</p>}

        <button
          disabled={busy}
          className="bg-paper text-ink text-[12px] font-semibold uppercase tracking-[0.1em] py-3 md:py-2 disabled:bg-transparent disabled:text-text-min disabled:border disabled:border-rule"
        >
          {busy ? '...' : mode === 'login' ? 'Sign In' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          className="text-[13px] text-text-3 py-1"
        >
          {mode === 'login'
            ? <>No account? <span className="text-paper">Register</span></>
            : <>Have an account? <span className="text-paper">Sign in</span></>}
        </button>
      </form>
    </div>
  )
}