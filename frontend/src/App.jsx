import { useState } from 'react'
import ExerciseMap from './pages/ExerciseMap'
import WorkoutBuilder from './pages/WorkoutBuilder'
import WorkoutLog from './pages/WorkoutLog'

const PAGES = [
  { key: 'map',     label: 'Exercise Map' },
  { key: 'builder', label: 'Workout Builder' },
  { key: 'log',     label: 'Workout Log' },
]

export default function App() {
  const [page, setPage] = useState('map')

  return (
    <div className="min-h-screen text-[#e8e0d0]">

      <header className="flex items-center justify-between px-8 h-16 border-b border-white/10 bg-black/60 backdrop-blur-sm">

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
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-white">Username</p>
            <p className="text-[10px] uppercase tracking-widest text-[#c0392b]">Pro Member</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1c1a18] border border-[#c0392b]/40 flex items-center justify-center">
            <span className="text-xs font-bold text-[#c0392b]">W1</span>
          </div>
        </div>

      </header>

      {/* Page content */}
      <div className="flex-1">
        {page === 'map' && <ExerciseMap />}
        {page === 'builder' && <WorkoutBuilder />}
        {page === 'log' && <WorkoutLog />}
      </div>

    </div>
  )
}