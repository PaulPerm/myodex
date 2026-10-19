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
      <p className="hidden md:block text-xs font-bold uppercase tracking-widest text-white">{user.username}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#1c1a18] border border-[#c0392b]/40 flex items-center justify-center hover:border-[#c0392b] transition-colors"
        aria-label="Account menu"
      >
        <span className="text-xs font-bold text-[#c0392b]">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 bg-black/95 border border-white/10 shadow-xl">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Signed in as</p>
            <p className="text-xs font-bold uppercase tracking-widest text-white truncate">{user.username}</p>
          </div>
          <button
            onClick={() => { setOpen(false); logout() }}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-widest text-[#c0392b] hover:bg-white/5"
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
    <div className="min-h-screen text-[#e8e0d0] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">

      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-14 md:h-16 border-b border-white/10 bg-black/85 backdrop-blur-md">

        {/* Logo */}
        <h1
          className="text-2xl md:text-3xl tracking-[4px] text-white"
          style={{ fontFamily: 'Bebas Neue' }}
        >
          MYO<span className="text-[#c0392b]">D</span>EX
        </h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex h-full">
          {PAGES.map(p => (
            <button
              key={p.key}
              onClick={() => setPage(p.key)}
              className={`px-6 h-full text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
                page === p.key
                  ? 'text-white border-[#c0392b]'
                  : 'text-white/30 border-transparent hover:text-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        {/* Account */}
        {user ? (
          <UserMenu user={user} logout={logout} />
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c0392b] border border-[#c0392b]/40 px-3 md:px-4 py-2 hover:bg-[#c0392b]/10"
          >
            <User size={14} className="md:hidden" />
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/10 bg-black/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        {PAGES.map(({ key, short, Icon }) => {
          const active = page === key
          return (
            <button
              key={key}
              onClick={() => setPage(key)}
              className="relative flex-1 h-16 flex flex-col items-center justify-center gap-1"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#c0392b] shadow-[0_0_8px_#c0392b]" />
              )}
              <Icon size={20} className={active ? 'text-[#c0392b]' : 'text-white/30'} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-white/30'}`}>
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