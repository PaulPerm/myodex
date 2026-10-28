import { useState, useEffect, useRef } from 'react'
import { Map, Dumbbell, ClipboardList, Bookmark, LogOut, User } from 'lucide-react'
import ExerciseMap from './pages/ExerciseMap'
import WorkoutBuilder from './pages/WorkoutBuilder'
import WorkoutLog from './pages/WorkoutLog'
import MyWorkouts from './pages/MyWorkouts'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'

const PAGES = [
  { key: 'map',     label: 'Exercise Map',    short: 'Map',   Icon: Map },
  { key: 'builder', label: 'Workout Builder', short: 'Build', Icon: Dumbbell },
  { key: 'log',     label: 'Workout Log',     short: 'Log',   Icon: ClipboardList },
  { key: 'saved',   label: 'My Workouts',     short: 'Saved', Icon: Bookmark },
]

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <p className="hidden md:block text-[12px] font-medium uppercase tracking-[0.1em] text-paper">{user.username}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 md:w-10 md:h-10 border border-paper flex items-center justify-center"
        aria-label="Account menu"
      >
        <span className="text-[12px] font-semibold text-paper">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 bg-bg border border-rule-input">
          <div className="px-4 py-3 border-b border-rule">
            <p className="text-[11px] uppercase tracking-[0.12em] text-text-min">Signed in as</p>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-paper truncate">{user.username}</p>
          </div>
          <button
            onClick={() => { setOpen(false); logout() }}
            className="w-full flex items-center gap-2 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-paper hover:bg-rule"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('map')
  const { user, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className="min-h-screen text-paper pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">

      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 min-h-16 border-b border-rule bg-bg">

        {/* Logo */}
        <h1 className="logo-cursor font-display font-black text-[26px] md:text-[32px] tracking-[0.06em] text-paper leading-none">
          MYO<span>D</span>EX
        </h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex self-stretch">
          {PAGES.map(p => {
            const active = page === p.key
            return (
              <button
                key={p.key}
                onClick={() => setPage(p.key)}
                className={`px-5 text-[12px] uppercase tracking-[0.1em] border-b-2 transition-colors ${
                  active
                    ? 'nav-active text-paper font-semibold border-paper'
                    : 'text-text-3 font-medium border-transparent hover:text-paper'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </nav>

        {/* Account */}
        {user ? (
          <UserMenu user={user} logout={logout} />
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-2 bg-paper text-ink text-[12px] font-semibold uppercase tracking-[0.1em] px-3 md:px-4 py-2"
          >
            <User size={12} className="md:hidden" />
            Sign In
          </button>
        )}

      </header>

      {/* Page content */}
      <main>
        {page === 'map' && <ExerciseMap />}
        {page === 'builder' && <WorkoutBuilder />}
        {page === 'log' && <WorkoutLog />}
        {page === 'saved' && <MyWorkouts />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-rule bg-bg pb-[env(safe-area-inset-bottom)]">
        {PAGES.map(({ key, short, Icon }) => {
          const active = page === key
          return (
            <button
              key={key}
              onClick={() => setPage(key)}
              className="relative flex-1 h-16 flex flex-col items-center justify-center gap-1"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent" />
              )}
              <Icon size={16} className={active ? 'text-paper' : 'text-text-3'} />
              <span className={`text-[10px] uppercase tracking-[0.1em] ${active ? 'text-paper font-semibold' : 'text-text-3 font-medium'}`}>
                {short}
              </span>
            </button>
          )
        })}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

    </div>
  )
}