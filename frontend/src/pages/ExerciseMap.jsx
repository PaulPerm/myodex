import { useState, useRef } from 'react'
import ExerciseCard from '../components/ExerciseCard'
import MusclePanel from '../components/MusclePanel'
import { normalizeMuscle, formatMuscle, toMapMuscles } from '../utils/muscles'

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'bodyweight',  label: 'Bodyweight' },
  { key: 'free_weight', label: 'Free Weight' },
  { key: 'machine',     label: 'Machine' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const chip = active =>
  `uppercase tracking-widest text-xs font-bold px-3 md:px-4 py-2 border transition-colors ${
    active
      ? 'bg-[#c0392b] text-white border-[#c0392b]'
      : 'bg-transparent text-white/30 border-white/10 hover:text-white/60'
  }`

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
      const json = await res.json()
      setData(json)
    } catch {
      setError('Could not load exercises. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function handleExerciseClick(exercise) {
    setSelectedExercise(exercise)
  }

  function changeCategory(next) {
    setCategory(next)
    if (activeMuscle) handleMuscleClick({ muscle: activeMuscle }, goal, next, false)
  }

  const muscleLabel = activeMuscle ? formatMuscle(activeMuscle) : null

  const mapData = selectedExercise
    ? [{ name: selectedExercise.name, muscles: toMapMuscles([selectedExercise.target, ...selectedExercise.secondary]) }]
    : data ? [{ name: muscleLabel, muscles: toMapMuscles([activeMuscle]) }] : []

  return (
    <div className="flex flex-col md:min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-3 md:p-6 flex-1">

        {/* Left card — Anatomical Target Map */}
        <div className="flex flex-col gap-4 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6 flex-1 min-w-0">

          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>
              Anatomical Target Map
            </h2>
            <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
              Tap a muscle to see exercises
            </p>
          </div>

          {/* Body map + recruitment index */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
            <MusclePanel
              view={view}
              setView={setView}
              data={mapData}
              handleMuscleClick={handleMuscleClick}
            />

            {/* Recruitment index */}
            <div className="flex flex-col gap-4 flex-1 sm:pt-2">
              {!activeMuscle && (
                <p className="hidden sm:block text-xs uppercase tracking-widest text-white/20 mt-4">
                  Select a muscle to see recruitment
                </p>
              )}

              {selectedExercise ? (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-2 sm:mb-3">Target</p>
                    <p className="text-sm font-bold uppercase tracking-wide text-white">
                      {formatMuscle(selectedExercise.target)}
                    </p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2 sm:mb-3">Secondary</p>
                    <div className="flex flex-wrap sm:flex-col gap-x-4 gap-y-2">
                      {selectedExercise.secondary.map(muscle => (
                        <p key={muscle} className="text-xs uppercase tracking-widest text-white/40">
                          {formatMuscle(muscle)}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              ) : activeMuscle && data && (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-2 sm:mb-3">Primary</p>
                    <p className="text-sm font-bold uppercase tracking-wide text-white">{muscleLabel}</p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2 sm:mb-3">Secondary</p>
                    <div className="flex flex-wrap sm:flex-col gap-x-4 gap-y-2">
                      {data.secondary
                        .flatMap(ex => ex.secondary)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map(muscle => (
                          <p key={muscle} className="text-xs uppercase tracking-widest text-white/40">
                            {formatMuscle(muscle)}
                          </p>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right card — Exercises */}
        <div
          ref={listRef}
          className="scroll-mt-16 flex flex-col flex-1 min-w-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6"
        >

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>
              Exercises
            </h2>
            <button className="text-xs uppercase tracking-widest text-[#c0392b] border border-[#c0392b]/40 px-3 py-1 hover:bg-[#c0392b]/10 transition-colors">
              + Add Movement
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full sm:w-auto sm:flex-1 min-w-0 bg-white/5 border border-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white placeholder-white/20 outline-none focus:border-white/20"
            />
            <button onClick={() => changeCategory('all')} className={chip(category === 'all')}>
              All
            </button>
            {CATEGORIES.filter(c => c.key !== 'all').map(c => (
              <button
                key={c.key}
                onClick={() => changeCategory(c.key === category ? 'all' : c.key)}
                className={chip(category === c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Exercise list */}
          <div className="flex flex-col md:overflow-y-auto flex-1">
            {!activeMuscle && (
              <div className="text-center my-10 md:mt-20">
                <p className="text-sm uppercase tracking-widest text-white/20">Select a muscle group</p>
              </div>
            )}

            {activeMuscle && loading && (
              <p className="text-xs uppercase tracking-widest text-white/20">Loading...</p>
            )}

            {activeMuscle && error && (
              <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>
            )}

            {data && !loading && (
              <>
                {data.primary.length > 0 && (
                  <>
                    <h3 className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-3">Primary</h3>
                    <div className="flex flex-col mb-6">
                      {data.primary.map(ex => (
                        <ExerciseCard key={ex.id} exercise={ex} onClick={handleExerciseClick} />
                      ))}
                    </div>
                  </>
                )}
                {data.secondary.length > 0 && (
                  <>
                    <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">Also works {muscleLabel}</h3>
                    <div className="flex flex-col">
                      {data.secondary.map(ex => (
                        <ExerciseCard key={ex.id} exercise={ex} onClick={handleExerciseClick} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}