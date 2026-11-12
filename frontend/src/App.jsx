import { useState, useEffect, useRef } from 'react'
import { Map, Dumbbell, ClipboardList, LogOut, User } from 'lucide-react'
import ExerciseMap from './pages/ExerciseMap'
import WorkoutBuilder from './pages/WorkoutBuilder'
import Train from './pages/Train'
import History from './pages/History'
import ActiveSession from './pages/ActiveSession'
import Summary from './pages/Summary'
import { useAuth } from './context/AuthContext'
import { useSession } from './context/SessionContext'
import AuthModal from './components/AuthModal'

const PAGES = [
  { key: 'train',   label: 'Train',   Icon: Dumbbell },
  { key: 'explore', label: 'Explore', Icon: Map },
  { key: 'history', label: 'History', Icon: ClipboardList },
]

function UserMenu({ user, logout }) {
  const { unit, setUnit, draft } = useSession()
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
        className="w-11 h-11 rounded-full bg-[#1c1a18] border border-[#c0392b]/40 flex items-center justify-center hover:border-[#c0392b] transition-colors"
        aria-label="Account menu"
      >
        <span className="text-xs font-bold text-white">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 bg-black/95 border border-white/10 shadow-xl">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-white/50">Signed in as</p>
            <p className="text-xs font-bold uppercase tracking-widest text-white truncate">{user.username}</p>
          </div>
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">
              Weight unit{draft ? ' (finish your workout to change)' : ''}
            </p>
            <div className="flex">
              {['lbs', 'kg'].map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  disabled={!!draft}
                  className={`flex-1 h-11 text-xs font-bold uppercase tracking-widest border disabled:opacity-40 ${
                    unit === u ? 'bg-[#c0392b] border-[#c0392b] text-white' : 'border-white/15 text-white/60'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); logout() }}
            className="w-full h-12 flex items-center gap-2 px-4 text-xs uppercase tracking-widest text-white hover:bg-white/5"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

// Red bar shown on every tab while a workout is running in the background.
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
      className="fixed inset-x-0 z-40 h-14 px-4 flex items-center justify-between bg-[#c0392b] text-white bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0"
    >
      <span className="text-sm font-bold uppercase tracking-widest truncate">
        {draft.name || 'Workout'} · {elapsed}
      </span>
      <span className="text-xl tracking-widest shrink-0" style={{ fontFamily: 'Bebas Neue' }}>Resume</span>
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
    <div className={`min-h-screen text-[#e8e0d0] md:pb-0 ${
      showBar
        ? 'pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-14'
        : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'
    }`}>

      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-14 md:h-16 border-b border-white/10 bg-black/85 backdrop-blur-md">

        <h1 className="text-2xl md:text-3xl tracking-[4px] text-white" style={{ fontFamily: 'Bebas Neue' }}>
          MYO<span className="text-[#c0392b]">D</span>EX
        </h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex h-full">
          {PAGES.map(p => (
            <button
              key={p.key}
              onClick={() => go(p.key)}
              className={`px-6 h-full text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
                page === p.key
                  ? 'text-white border-[#c0392b]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        {user ? (
          <UserMenu user={user} logout={logout} />
        ) : (
          <button
            onClick={signIn}
            className="flex items-center gap-2 h-11 text-xs font-bold uppercase tracking-widest text-white border border-[#c0392b]/60 px-4 hover:bg-[#c0392b]/10"
          >
            <User size={14} className="md:hidden" />
            Sign In
          </button>
        )}
      </header>

      <main>
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/10 bg-black/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        {PAGES.map(({ key, label, Icon }) => {
          const active = page === key
          return (
            <button
              key={key}
              onClick={() => go(key)}
              className="relative flex-1 h-16 flex flex-col items-center justify-center gap-1"
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#c0392b]" />}
              <Icon size={20} className={active ? 'text-white' : 'text-white/40'} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>
                {label}
              </span>
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