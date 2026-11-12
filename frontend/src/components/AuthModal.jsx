import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// FastAPI sends validation errors as a list; turn them into one readable line.
function readable(err) {
  const msg = err?.message
  if (typeof msg === 'string' && msg !== '[object Object]') return msg
  return 'Something went wrong. Check your details and try again.'
}

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode]         = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState(null)
  const [busy, setBusy]         = useState(false)

  const isRegister = mode === 'register'
  const mismatch = isRegister && confirm.length > 0 && confirm !== password

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (isRegister) {
      if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
        return setError('Usernames can only use letters, numbers, _ . and -')
      }
      if (password !== confirm) return setError('Passwords do not match')
    }

    setBusy(true)
    try {
      if (isRegister) await register(username.trim(), password)
      else await login(username.trim(), password)
      onClose()
    } catch (err) {
      setError(readable(err))
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError(null)
    setConfirm('')
  }

  const input = 'w-full h-12 bg-white/5 border border-white/10 px-4 text-base md:text-sm tracking-wider text-white placeholder-white/30 outline-none focus:border-white/40'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm flex flex-col gap-4 bg-black/95 border border-white/10 p-6 md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-white/50 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-3xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>
          {isRegister ? 'Create Account' : 'Sign In'}
        </h2>

        <input
          className={input}
          placeholder="Username"
          aria-label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={50}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        <input
          className={input}
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={72}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />

        {isRegister && (
          <div className="flex flex-col gap-1">
            <input
              className={`${input} ${mismatch ? 'border-[#c0392b] focus:border-[#c0392b]' : ''}`}
              type="password"
              placeholder="Confirm password"
              aria-label="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              maxLength={72}
              autoComplete="new-password"
            />
            {mismatch && (
              <p className="text-xs uppercase tracking-widest text-[#c0392b]">Passwords do not match</p>
            )}
          </div>
        )}

        {isRegister && (
          <p className="text-xs text-white/40">
            No email needed. There's no password reset, so keep your password somewhere safe.
          </p>
        )}

        {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

        <button
          disabled={busy || mismatch}
          className="h-12 bg-[#c0392b] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#a93226] disabled:opacity-50"
        >
          {busy ? '...' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={switchMode}
          className="h-11 text-xs uppercase tracking-widest text-white/50 hover:text-white/80"
        >
          {isRegister ? 'Have an account? Sign in' : 'No account? Create one'}
        </button>
      </form>
    </div>
  )
}