import { useState, useRef } from 'react'
import ExerciseCard from '../components/ExerciseCard'
import MusclePanel from '../components/MusclePanel'
import { normalizeMuscle, formatMuscle, toMapMuscles } from '../utils/muscles'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { apiFetch, API_URL } from '../api'

const GOALS = [
  { key: 'strength',    label: 'Strength' },
  { key: 'hypertrophy', label: 'Hypertrophy' },
  { key: 'endurance',   label: 'Endurance' },
]

const PER_MUSCLE = 2

const chip = active =>
  `flex-1 h-12 uppercase tracking-widest text-xs font-bold border transition-colors ${
    active
      ? 'bg-[#c0392b] text-white border-[#c0392b]'
      : 'bg-transparent text-white/50 border-white/15 hover:text-white/80'
  }`

const label = 'text-xs uppercase tracking-widest text-white/50 font-bold mb-2'

const sideBtn = 'flex items-center justify-center w-11 mb-2 text-white/60 border border-white/15 hover:text-white hover:border-[#c0392b]/50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed'

export default function WorkoutBuilder({ onBack, onStarted, onSignIn }) {
  const { user } = useAuth()
  const { draft, start, setExpanded } = useSession()
  const [view, setView]               = useState('anterior')
  const [selected, setSelected]       = useState([])
  const [goal, setGoal]               = useState('hypertrophy')
  const [workout, setWorkout]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [pools, setPools]             = useState({})     // muscle -> its exercises
  const [allExercises, setAll]        = useState(null)   // for search
  const [searchKey, setSearchKey]     = useState(null)   // "blockIdx-exIdx" being searched
  const [query, setQuery]             = useState('')
  const [workoutName, setWorkoutName] = useState('')
  const [saving, setSaving]           = useState(false)
  const [saveMsg, setSaveMsg]         = useState(null)
  const resultsRef = useRef(null)

  function toggleMuscle(muscleData) {
    const slug = normalizeMuscle(muscleData.muscle)
    if (!slug) return
    setSelected(prev => prev.includes(slug) ? prev.filter(m => m !== slug) : [...prev, slug])
  }

  async function loadPools(muscles) {
    const entries = await Promise.all(muscles.map(async m => {
      try {
        const res = await fetch(`${API_URL}/muscles/${m}/exercises`)
        const json = await res.json()
        return [m, json.primary || []]
      } catch {
        return [m, []]
      }
    }))
    setPools(Object.fromEntries(entries))
  }

  async function generate() {
    setLoading(true)
    setError(null)
    setSaveMsg(null)
    setSearchKey(null)
    try {
      const res = await fetch(`${API_URL}/workouts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muscles: selected, goal, categories: [], exercises_per_muscle: PER_MUSCLE }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWorkout(data)
      loadPools(data.blocks.map(b => b.muscle))
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch {
      setError('Could not build the workout. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function replaceExercise(blockIdx, exIdx, replacement) {
    setSaveMsg(null)
    setWorkout(prev => ({
      ...prev,
      blocks: prev.blocks.map((b, i) =>
        i !== blockIdx ? b : { ...b, exercises: b.exercises.map((e, j) => (j === exIdx ? replacement : e)) }
      ),
    }))
  }

  // Exercises this slot can cycle through: the muscle's list minus anything used in another slot.
  function optionsFor(blockIdx, exIdx) {
    const block = workout.blocks[blockIdx]
    const current = block.exercises[exIdx]
    const usedElsewhere = new Set(
      workout.blocks.flatMap((b, i) =>
        b.exercises.filter((_, j) => !(i === blockIdx && j === exIdx)).map(e => e.id)
      )
    )
    const pool = (pools[block.muscle] || []).filter(e => !usedElsewhere.has(e.id))
    if (!pool.some(e => e.id === current.id)) pool.unshift(current)
    return pool
  }

  function step(blockIdx, exIdx, dir) {
    const opts = optionsFor(blockIdx, exIdx)
    if (opts.length < 2) return
    const cur = opts.findIndex(e => e.id === workout.blocks[blockIdx].exercises[exIdx].id)
    replaceExercise(blockIdx, exIdx, opts[(cur + dir + opts.length) % opts.length])
  }

  async function openSearch(key) {
    if (searchKey === key) return setSearchKey(null)
    setSearchKey(key)
    setQuery('')
    if (!allExercises) {
      try {
        const res = await fetch(`${API_URL}/exercises`)
        setAll(await res.json())
      } catch {
        setAll([])
      }
    }
  }

  function searchResults(blockIdx) {
    const used = new Set(workout.blocks.flatMap(b => b.exercises.map(e => e.id)))
    const muscle = workout.blocks[blockIdx].muscle
    const q = query.trim().toLowerCase()
    return (allExercises || [])
      .filter(e => !used.has(e.id) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => (b.target === muscle) - (a.target === muscle)) // this muscle first
      .slice(0, 8)
  }

  const defaultName = () => workout.blocks.map(b => formatMuscle(b.muscle)).join(' + ').slice(0, 100)

  async function startWorkout() {
    if (draft) return setExpanded(true) // one workout at a time
    const exercises = workout.blocks
      .flatMap(b => b.exercises)
      .map(e => ({ id: e.id, name: e.name, target: e.target }))
    await start(workoutName.trim() || defaultName(), exercises, {
      setCount: parseInt(workout.preset.sets) || 3,
      repsHint: workout.preset.reps,
    })
    onStarted()
  }

  async function saveWorkout() {
    setSaving(true)
    setSaveMsg(null)
    try {
      await apiFetch('/saved-workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName.trim() || defaultName(),
          goal: workout.goal,
          preset: workout.preset,
          blocks: workout.blocks,
        }),
      })
      setSaveMsg({ ok: true, text: 'Saved to My workouts' })
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const mapData = selected.length ? [{ name: 'Selected', muscles: toMapMuscles(selected) }] : []
  const hasExercises = workout?.blocks.some(b => b.exercises.length > 0)

  return (
    <div className="p-3 md:p-6 max-w-xl mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-1">
        <button onClick={onBack} className="w-11 h-11 flex items-center justify-center text-white/70" aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>Build a workout</h2>
      </div>

      {/* Step 1 + 2 */}
      <div className="flex flex-col gap-5 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4">
        <div>
          <p className={label}>1. What are you training?</p>
          <MusclePanel
            view={view}
            setView={setView}
            data={mapData}
            handleMuscleClick={toggleMuscle}
            hint="Tap muscles to select them"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {selected.map(m => (
              <button
                key={m}
                onClick={() => toggleMuscle({ muscle: m })}
                className="flex items-center gap-2 h-11 px-3 text-xs uppercase tracking-widest text-white/80 border border-white/20"
              >
                {formatMuscle(m)} <X size={14} className="text-white/40" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={label}>2. What is your goal?</p>
          <div className="flex gap-2">
            {GOALS.map(g => (
              <button key={g.key} onClick={() => setGoal(g.key)} className={chip(goal === g.key)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={selected.length === 0 || loading}
          className={`h-14 text-2xl tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            workout ? 'border border-white/60 text-white' : 'bg-[#c0392b] text-white hover:bg-[#a93226]'
          }`}
          style={{ fontFamily: 'Bebas Neue' }}
        >
          {loading ? 'Building...' : workout ? 'Rebuild' : selected.length ? 'Build workout' : 'Pick a muscle first'}
        </button>
        {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}
      </div>

      {/* Result */}
      {workout && (
        <div ref={resultsRef} className="scroll-mt-16 flex flex-col bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4">
          <h3 className="text-2xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>Your workout</h3>
          <p className="text-xs text-white/50 mb-4">
            {workout.preset.sets} sets · {workout.preset.reps} reps · {workout.preset.rest} rest. Use the arrows to swap an exercise.
          </p>

          {workout.blocks.map((block, i) => (
            <div key={block.muscle} className="mb-4">
              <h4 className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">
                {formatMuscle(block.muscle)}
              </h4>
              {block.exercises.length === 0 && (
                <p className="text-xs text-white/40">No exercises found for this muscle</p>
              )}
              {block.exercises.map((ex, j) => {
                const key = `${i}-${j}`
                const opts = pools[block.muscle] ? optionsFor(i, j) : [ex]
                const pos = opts.findIndex(e => e.id === ex.id) + 1
                const canStep = opts.length > 1
                return (
                  <div key={key}>
                    <div className="flex items-stretch gap-1.5">
                      <button onClick={() => step(i, j, -1)} disabled={!canStep} className={sideBtn} aria-label="Previous exercise">
                        <ChevronLeft size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <ExerciseCard exercise={ex} onClick={() => {}} />
                      </div>
                      <button onClick={() => step(i, j, 1)} disabled={!canStep} className={sideBtn} aria-label="Next exercise">
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => openSearch(key)}
                        className={`${sideBtn} ${searchKey === key ? 'text-white border-[#c0392b]/50' : ''}`}
                        aria-label="Search exercises"
                      >
                        <Search size={16} />
                      </button>
                    </div>

                    {canStep && (
                      <p className="text-[10px] uppercase tracking-widest text-white/40 -mt-1 mb-2 text-center">
                        {pos} of {opts.length}
                      </p>
                    )}

                    {searchKey === key && (
                      <div className="border border-white/10 p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search any exercise..."
                            className="flex-1 min-w-0 h-11 bg-white/5 border border-white/10 px-3 text-base text-white placeholder-white/30 outline-none focus:border-white/30"
                          />
                          <button onClick={() => setSearchKey(null)} className="w-11 h-11 flex items-center justify-center text-white/60" aria-label="Close search">
                            <X size={18} />
                          </button>
                        </div>
                        {!allExercises ? (
                          <p className="text-xs text-white/40 p-2">Loading...</p>
                        ) : (
                          <div className="flex flex-col max-h-60 overflow-y-auto">
                            {searchResults(i).map(r => (
                              <button
                                key={r.id}
                                onClick={() => { replaceExercise(i, j, r); setSearchKey(null) }}
                                className="min-h-12 px-2 py-2 text-left text-sm uppercase tracking-widest text-white/80 hover:bg-white/5 border-b border-white/5"
                              >
                                {r.name}
                                <span className="text-white/40"> · {formatMuscle(r.target)}</span>
                              </button>
                            ))}
                            {searchResults(i).length === 0 && (
                              <p className="text-xs text-white/40 p-2">No matches</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {hasExercises && (
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={startWorkout}
                className="h-16 bg-[#c0392b] text-white text-2xl tracking-widest hover:bg-[#a93226] transition-colors"
                style={{ fontFamily: 'Bebas Neue' }}
              >
                {draft ? 'Resume current workout' : 'Start workout'}
              </button>

              {user ? (
                <div className="flex gap-2">
                  <input
                    value={workoutName}
                    onChange={e => { setWorkoutName(e.target.value); setSaveMsg(null) }}
                    placeholder={defaultName()}
                    maxLength={100}
                    aria-label="Workout name"
                    className="flex-1 min-w-0 h-12 bg-white/5 border border-white/15 px-3 text-base text-white placeholder-white/30 outline-none focus:border-white/40"
                  />
                  <button
                    onClick={saveWorkout}
                    disabled={saving || saveMsg?.ok}
                    className="h-12 px-4 border border-white/60 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-40"
                  >
                    {saving ? 'Saving...' : 'Save for later'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  className="h-12 border border-white/60 text-white text-xs font-bold uppercase tracking-widest"
                >
                  Sign in to save for later
                </button>
              )}
              {saveMsg && (
                <p className={`text-xs uppercase tracking-widest ${saveMsg.ok ? 'text-white/60' : 'text-[#c0392b]'}`}>
                  {saveMsg.text}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}