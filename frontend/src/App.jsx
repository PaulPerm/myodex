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
    <div className="min-h-screen bg-[#0d0d0d] text-[#e8e0d0]">

      <header className="flex items-center justify-between px-8 h-16 border-b border-white/10 bg-black/60 backdrop-blur-sm">
  
      {/* Logo */}
      <h1 
        className="text-3xl tracking-[4px] text-white"
        style={{ fontFamily: 'Bebas Neue' }}
      >
        MYO<span className="text-[#c0392b]">D</span>EX
      </h1>

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
        {page == 'map' && <ExerciseMap />}
        {page === 'builder' && <WorkoutBuilder />}
        {page === 'log' && <WorkoutLog/>}      
      </div>

    </div>
  )
}