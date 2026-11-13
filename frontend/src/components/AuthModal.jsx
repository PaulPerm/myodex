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

  // grouped-field look: rows share one rounded box, split by hairlines
  const row = 'w-full h-12 bg-transparent px-4 text-[17px] text-label outline-none'

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-sm flex flex-col gap-4 bg-surface rounded-t-3xl sm:rounded-3xl px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-label-2"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="text-[28px] font-bold text-label tracking-tight">
          {isRegister ? 'Create account' : 'Sign in'}
        </h2>

        <div className="rounded-xl bg-surface-2 divide-y divide-separator overflow-hidden">
          <input
            className={row}
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
            className={row}
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
            <input
              className={`${row} ${mismatch ? 'text-danger' : ''}`}
              type="password"
              placeholder="Confirm password"
              aria-label="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              maxLength={72}
              autoComplete="new-password"
            />
          )}
        </div>

        {mismatch && <p className="text-[13px] text-danger -mt-2 px-1">Passwords do not match</p>}

        {isRegister && (
          <p className="text-[13px] text-label-3 px-1 -mt-1">
            No email needed. There's no password reset, so keep your password somewhere safe.
          </p>
        )}

        {error && <p className="text-[13px] text-danger px-1">{error}</p>}

        <button
          disabled={busy || mismatch}
          className="h-[50px] rounded-xl bg-accent-fill text-on-accent text-[17px] font-semibold disabled:opacity-40"
        >
          {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <button type="button" onClick={switchMode} className="h-11 text-[15px] text-accent">
          {isRegister ? 'Have an account? Sign in' : 'No account? Create one'}
        </button>
      </form>
    </div>
  )
}