import { useState, useEffect, useRef } from 'react'
import { Map, Dumbbell, ClipboardList, LogOut, ChevronUp, Sun, Moon } from 'lucide-react'
import ExerciseMap from './pages/ExerciseMap'
import WorkoutBuilder from './pages/WorkoutBuilder'
import Train from './pages/Train'
import History from './pages/History'
import ActiveSession from './pages/ActiveSession'
import Summary from './pages/Summary'
import { useAuth } from './context/AuthContext'
import { useSession } from './context/SessionContext'
import { useTheme } from './context/ThemeContext'
import AuthModal from './components/AuthModal'

const PAGES = [
  { key: 'train',   label: 'Train',   Icon: Dumbbell },
  { key: 'explore', label: 'Explore', Icon: Map },
  { key: 'history', label: 'History', Icon: ClipboardList },
]

function UserMenu({ user, logout }) {
  const { unit, setUnit, draft } = useSession()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-11 h-11 flex items-center justify-center"
        aria-label="Account menu"
      >
        <span className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center text-[13px] font-semibold text-label">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-surface-2 shadow-2xl ring-1 ring-separator overflow-hidden">
          <div className="px-4 py-3">
            <p className="text-[13px] text-label-3">Signed in as</p>
            <p className="text-[17px] font-semibold text-label truncate">{user.username}</p>
          </div>
          <div className="px-4 py-3 border-t border-separator">
            <p className="text-[13px] text-label-3 mb-2">
              Weight unit{draft ? ' (finish your workout to change)' : ''}
            </p>
            <div className="flex p-0.5 rounded-[9px] bg-surface">
              {['lbs', 'kg'].map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  disabled={!!draft}
                  className={`flex-1 h-9 rounded-[7px] text-[13px] font-semibold disabled:opacity-40 ${
                    unit === u ? 'bg-surface-3 text-label shadow-sm' : 'text-label-2'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 border-t border-separator">
            <p className="text-[13px] text-label-3 mb-2">Appearance</p>
            <div className="flex p-0.5 rounded-[9px] bg-surface">
              {[['light', 'Light', Sun], ['dark', 'Dark', Moon]].map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  aria-pressed={theme === key}
                  className={`flex-1 h-9 rounded-[7px] flex items-center justify-center gap-1.5 text-[13px] font-semibold ${
                    theme === key ? 'bg-surface-3 text-label shadow-sm' : 'text-label-2'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); logout() }}
            className="w-full h-12 flex items-center gap-2 px-4 border-t border-separator text-[17px] text-danger"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

// Floating "now playing" style bar while a workout runs in the background.
function ResumeBar() {
  const { draft, setExpanded } = useSession()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const sec = Math.max(0, Math.floor((now - draft.startedAt) / 1000))
  const elapsed = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

  return (
    <button
      onClick={() => setExpanded(true)}
      className="fixed inset-x-2 z-40 h-14 px-4 rounded-2xl bg-surface-2 shadow-2xl ring-1 ring-separator flex items-center gap-3 text-left bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 md:max-w-md md:mx-auto"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-label truncate">{draft.name || 'Workout'}</span>
        <span className="block text-[13px] text-label-2"><span className="font-mono">{elapsed}</span> · Tap to resume</span>
      </span>
      <ChevronUp size={20} className="text-label-2 shrink-0" />
    </button>
  )
}

export default function App() {
  const [page, setPage]         = useState('train')
  const [building, setBuilding] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { user, logout } = useAuth()
  const { draft, expanded, summary, clearSummary } = useSession()

  const go = key => { setPage(key); setBuilding(false) }
  const signIn = () => setShowAuth(true)
  const showBar = draft && !expanded && !summary

  return (
    <div className={`min-h-screen bg-bg text-label ${
      showBar
        ? 'pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-24'
        : 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8'
    }`}>

      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-xl border-b border-separator/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <span className="text-[17px] font-semibold tracking-tight text-label">Myodex</span>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 p-0.5 rounded-[9px] bg-surface">
            {PAGES.map(p => (
              <button
                key={p.key}
                onClick={() => go(p.key)}
                className={`h-9 px-4 rounded-[7px] text-[13px] font-semibold transition-colors ${
                  page === p.key ? 'bg-surface-3 text-label' : 'text-label-2 hover:text-label'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>

          {user ? (
            <UserMenu user={user} logout={logout} />
          ) : (
            <button onClick={signIn} className="h-11 px-2 text-[17px] text-accent">
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {page === 'train' && !building && <Train onBuild={() => setBuilding(true)} onSignIn={signIn} />}
        {page === 'train' && building && (
          <WorkoutBuilder
            onBack={() => setBuilding(false)}
            onStarted={() => setBuilding(false)}
            onSignIn={signIn}
          />
        )}
        {page === 'explore' && <ExerciseMap />}
        {page === 'history' && <History onSignIn={signIn} />}
      </main>

      {showBar && <ResumeBar />}

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-surface/85 backdrop-blur-xl border-t border-separator/60 pb-[env(safe-area-inset-bottom)]">
        {PAGES.map(({ key, label, Icon }) => {
          const active = page === key
          return (
            <button
              key={key}
              onClick={() => go(key)}
              className={`flex-1 h-14 flex flex-col items-center justify-center gap-0.5 ${active ? 'text-accent' : 'text-label-3'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Full-screen layers */}
      {draft && expanded && !summary && <ActiveSession />}
      {summary && <Summary onSignIn={signIn} onDone={() => { clearSummary(); go('history') }} />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}