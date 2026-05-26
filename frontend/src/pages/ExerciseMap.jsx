import { useState } from 'react'
import Model from 'react-body-highlighter'

const GOALS = [
  { key: 'strength',    label: 'Strength',    desc: '5 sets · 3-5 reps' },
  { key: 'hypertrophy', label: 'Hypertrophy', desc: '4 sets · 8-12 reps' },
  { key: 'endurance',   label: 'Endurance',   desc: '3 sets · 15-20 reps' },
]

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'bodyweight',  label: 'Bodyweight' },
  { key: 'free_weight', label: 'Free Weight' },
  { key: 'machine',     label: 'Machine' },
]

const DIFFICULTY_COLOR = {
  beginner:     '#22c55e',
  intermediate: '#f59e0b',
  advanced:     '#ef4444',
}





export default function ExerciseMap() {
  const [goal, setGoal]           = useState('hypertrophy')
  const [category, setCategory]   = useState('all')
  const [activeMuscle, setActiveMuscle] = useState(null)
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [view, setView] = useState('anterior')

  async function handleMuscleClick(muscleData, currentGoal = goal, currentCategory = category) {
    const IGNORED = ['head', 'knees']
      if (IGNORED.includes(muscleData.muscle)) return

    const muscle = muscleData.muscle === 'neck' ? 'trapezius' : muscleData.muscle

    
    setActiveMuscle(muscle)
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const url = `http://localhost:8000/muscles/${muscle}/exercises?goal=${currentGoal}${currentCategory !== 'all' ? `&category=${currentCategory}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Could not load exercises. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const muscleLabel = activeMuscle
    ? activeMuscle.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', background: '#0f0f0f', color: '#f1f1f1' }}>

      
      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* Body map */}
        <div style={{ width: '340px', flexShrink: 0, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderRight: '1px solid #222' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Click a muscle to see exercises</p>

          {/* Front / Back toggle */}
          <div style={{ display: 'flex', gap: '0px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #333' }}>
            <button
              onClick={() => setView('anterior')}
              style={{
                padding: '6px 18px', border: 'none', cursor: 'pointer', fontSize: '13px',
                background: view === 'anterior' ? '#6366f1' : '#1a1a1a',
                color: view === 'anterior' ? '#fff' : '#aaa',
              }}
            >
              Front
            </button>
            <button
              onClick={() => setView('posterior')}
              style={{
                padding: '6px 18px', border: 'none', cursor: 'pointer', fontSize: '13px',
                background: view === 'posterior' ? '#6366f1' : '#1a1a1a',
                color: view === 'posterior' ? '#fff' : '#aaa',
              }}
            >
              Back
            </button>
          </div>

          <Model
            type={view}
            data={data ? [
              { name: muscleLabel, muscles: [activeMuscle] },
              ...(data.secondary || []).map(e => ({ name: e.name, muscles: e.secondary }))
            ] : []}
            onClick={handleMuscleClick}
            style={{ width: '100%' }}
          />
        </div>

        {/* Sidebar */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

          {!activeMuscle && (
            <div style={{ color: '#555', marginTop: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px' }}>Select a muscle group</p>
              <p style={{ fontSize: '13px' }}>Click any muscle on the body map to see exercises</p>
            </div>
          )}

          {activeMuscle && (
            <>
              {/* Muscle title + preset */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 600 }}>{muscleLabel}</h2>
                {data && (
                  <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                    {data.preset.sets} sets · {data.preset.reps} reps · {data.preset.rest} rest
                  </p>
                )}
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => { 
                      setCategory(c.key)
                      if (activeMuscle) handleMuscleClick({ muscle: activeMuscle }, goal, c.key) 
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px',
                      background: category === c.key ? '#f1f1f1' : '#1e1e1e',
                      color: category === c.key ? '#000' : '#aaa',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {loading && <p style={{ color: '#555' }}>Loading...</p>}

              {/* Error */}
              {error && <p style={{ color: '#ef4444' }}>{error}</p>}

              {/* Exercise lists */}
              {data && !loading && (
                <>
                  {/* Primary */}
                  {data.primary.length > 0 && (
                    <>
                      <h3 style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>Primary</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                        {data.primary.map(ex => (
                          <ExerciseCard key={ex.id} exercise={ex} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Secondary */}
                  {data.secondary.length > 0 && (
                    <>
                      <h3 style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>Also works {muscleLabel}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.secondary.map(ex => (
                          <ExerciseCard key={ex.id} exercise={ex} />
                        ))}
                      </div>
                    </>
                  )}

                  {data.primary.length === 0 && data.secondary.length === 0 && (
                    <p style={{ color: '#555' }}>No exercises found for this filter.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseCard({ exercise }) {
  return (
    <div style={{
      background: '#1a1a1a', borderRadius: '10px', padding: '14px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      border: '1px solid #222'
    }}>
      <div>
        <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: '15px' }}>{exercise.name}</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
          {exercise.category.replace('_', ' ')}
        </p>
      </div>
      <span style={{
        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px',
        background: DIFFICULTY_COLOR[exercise.difficulty] + '22',
        color: DIFFICULTY_COLOR[exercise.difficulty],
        textTransform: 'capitalize'
      }}>
        {exercise.difficulty}
      </span>
    </div>
  )
}