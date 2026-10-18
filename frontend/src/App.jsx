import { useState } from 'react'
import ExerciseMap from './pages/ExerciseMap'
import WorkoutBuilder from './pages/WorkoutBuilder'
import WorkoutLog from './pages/WorkoutLog'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'

const PAGES = [
  { key: 'map',     label: 'Exercise Map' },
  { key: 'builder', label: 'Workout Builder' },
  { key: 'log',     label: 'Workout Log' },
]

export default function App() {
  const [page, setPage] = useState('map')
  const { user, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className="min-h-screen text-[#e8e0d0]">

      <header className="flex items-center justify-between px-8 h-16 border-b border-white/10 bg-black/80 backdrop-blur-md">

        {/* Logo */}
        <h1
          className="text-3xl tracking-[4px] text-white"
          style={{ fontFamily: 'Bebas Neue' }}
        >
          MYO<span className="text-[#c0392b]">D</span>EX
        </h1>

        {/* Nav */}
        <nav className="flex h-full">
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

        {/* User profile */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-white">{user.username}</p>
              <button
                onClick={logout}
                className="text-[10px] uppercase tracking-widest text-[#c0392b] hover:text-white"
              >
                Log out
              </button>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1c1a18] border border-[#c0392b]/40 flex items-center justify-center">
              <span className="text-xs font-bold text-[#c0392b]">
                {user.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="text-xs font-bold uppercase tracking-widest text-[#c0392b] border border-[#c0392b]/40 px-4 py-2 hover:bg-[#c0392b]/10"
          >
            Sign In
          </button>
        )}

      </header>

      {/* Page content */}
      <div className="flex-1">
        {page === 'map' && <ExerciseMap />}
        {page === 'builder' && <WorkoutBuilder />}
        {page === 'log' && <WorkoutLog />}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

    </div>
  )
}