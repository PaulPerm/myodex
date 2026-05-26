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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', background: '#0f0f0f', color: '#f1f1f1' }}>

      {/* Nav */}
      <header style={{ padding: '16px 32px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px' }}>Myodex</h1>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {PAGES.map(p => (
            <button
              key={p.key}
              onClick={() => setPage(p.key)}
              style={{
                padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                background: page === p.key ? '#6366f1' : 'transparent',
                color: page === p.key ? '#fff' : '#888',
                transition: 'all 0.15s'
              }}
            >
              {p.label}
            </button>
          ))}
        </nav>

        {/* Auth placeholder */}
        <button style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#888', fontSize: '13px', cursor: 'pointer' }}>
          Sign In
        </button>
      </header>

      {/* Page content */}
      <div style={{ flex: 1 }}>
        {page === 'map'     && <ExerciseMap />}
        {page === 'builder' && <WorkoutBuilder />}
        {page === 'log'     && <WorkoutLog />}
      </div>

    </div>
  )
}