import { useState, useRef } from 'react'
import ExerciseCard from '../components/ExerciseCard'
import MusclePanel from '../components/MusclePanel'
import { normalizeMuscle, formatMuscle, toMapMuscles } from '../utils/muscles'

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'bodyweight',  label: 'Bodyweight' },
  { key: 'free_weight', label: 'Free weight' },
  { key: 'machine',     label: 'Machine' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const segment = active =>
  `flex-1 h-9 px-2 rounded-[7px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
    active ? 'bg-surface-3 text-label shadow-sm' : 'text-label-2'
  }`

const sectionLabel = 'text-[13px] uppercase tracking-wide text-label-3 px-1 mb-2'

export default function ExerciseMap() {
  const [goal]                                  = useState('hypertrophy')
  const [category, setCategory]                 = useState('all')
  const [activeMuscle, setActiveMuscle]         = useState(null)
  const [data, setData]                         = useState(null)
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState(null)
  const [view, setView]                         = useState('anterior')
  const [selectedExercise, setSelectedExercise] = useState(null)
  const listRef = useRef(null)

  async function handleMuscleClick(muscleData, currentGoal = goal, currentCategory = category, scroll = true) {
    const muscle = normalizeMuscle(muscleData.muscle)
    if (!muscle) return

    setSelectedExercise(null)
    setActiveMuscle(muscle)
    setLoading(true)
    setError(null)
    setData(null)

    if (scroll && window.innerWidth < 768) {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    try {
      const url = `${API_URL}/muscles/${muscle}/exercises?goal=${currentGoal}${currentCategory !== 'all' ? `&category=${currentCategory}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
    } catch {
      setError('Could not load exercises. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function changeCategory(next) {
    setCategory(next)
    if (activeMuscle) handleMuscleClick({ muscle: activeMuscle }, goal, next, false)
  }

  const muscleLabel = activeMuscle ? formatMuscle(activeMuscle) : null

  const mapData = selectedExercise
    ? [{ name: selectedExercise.name, muscles: toMapMuscles([selectedExercise.target, ...selectedExercise.secondary]) }]
    : data ? [{ name: muscleLabel, muscles: toMapMuscles([activeMuscle]) }] : []

  // what the info panel shows: the tapped exercise, or the tapped muscle
  const primary = selectedExercise ? formatMuscle(selectedExercise.target) : muscleLabel
  const secondary = selectedExercise
    ? selectedExercise.secondary
    : data
      ? data.secondary.flatMap(ex => ex.secondary).filter((v, i, a) => a.indexOf(v) === i)
      : []

  return (
    <div className="px-4 pt-4 md:pt-8 flex flex-col gap-6">
      <h1 className="text-[34px] font-bold tracking-tight text-label">Explore</h1>

      <div className="flex flex-col md:flex-row gap-6 md:items-start">

        {/* Body map */}
        <section className="flex-1 min-w-0 rounded-2xl bg-surface p-4 flex flex-col sm:flex-row gap-5">
          <MusclePanel view={view} setView={setView} data={mapData} handleMuscleClick={handleMuscleClick} />

          <div className="flex-1 min-w-0 flex flex-col gap-4 sm:pt-12">
            {!activeMuscle && (
              <p className="hidden sm:block text-[15px] text-label-3">Tap a muscle to see what works it.</p>
            )}
            {primary && (
              <>
                <div>
                  <p className="text-[13px] text-label-3">{selectedExercise ? 'Target' : 'Primary'}</p>
                  <p className="text-[22px] font-bold tracking-tight text-label">{primary}</p>
                  {selectedExercise && <p className="text-[15px] text-accent mt-0.5">{selectedExercise.name}</p>}
                </div>
                {secondary.length > 0 && (
                  <div>
                    <p className="text-[13px] text-label-3 mb-1.5">Also works</p>
                    <div className="flex flex-wrap gap-1.5">
                      {secondary.map(m => (
                        <span key={m} className="px-2.5 py-1 rounded-full bg-surface-2 text-[13px] text-label-2">
                          {formatMuscle(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Exercises */}
        <section ref={listRef} className="scroll-mt-16 flex-1 min-w-0 flex flex-col">
          <div className="flex p-0.5 rounded-[9px] bg-surface-2 mb-4 overflow-x-auto">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => changeCategory(c.key)} className={segment(category === c.key)}>
                {c.label}
              </button>
            ))}
          </div>

          {!activeMuscle && (
            <p className="text-[15px] text-label-3 text-center my-10">Pick a muscle on the body map</p>
          )}
          {activeMuscle && loading && <p className="text-[15px] text-label-3 px-1">Loading...</p>}
          {activeMuscle && error && <p className="text-[15px] text-danger px-1">{error}</p>}

          {data && !loading && (
            <>
              {data.primary.length > 0 && (
                <div className="mb-6">
                  <p className={sectionLabel}>Best for {muscleLabel}</p>
                  {data.primary.map(ex => (
                    <ExerciseCard key={ex.id} exercise={ex} onClick={setSelectedExercise} />
                  ))}
                </div>
              )}
              {data.secondary.length > 0 && (
                <div>
                  <p className={sectionLabel}>Also works {muscleLabel}</p>
                  {data.secondary.map(ex => (
                    <ExerciseCard key={ex.id} exercise={ex} onClick={setSelectedExercise} />
                  ))}
                </div>
              )}
              {data.primary.length === 0 && data.secondary.length === 0 && (
                <p className="text-[15px] text-label-3 text-center my-6">No exercises with this filter</p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}