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

const segment = active =>
  `flex-1 h-9 rounded-[7px] text-[13px] font-semibold transition-colors ${
    active ? 'bg-surface-3 text-label shadow-sm' : 'text-label-2'
  }`

const sectionLabel = 'text-[13px] uppercase tracking-wide text-label-3 px-1 mb-2'

const roundBtn = 'w-11 h-11 shrink-0 rounded-full bg-surface flex items-center justify-center text-accent active:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed'

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
    <div className="px-4 pt-2 md:pt-6 max-w-xl mx-auto flex flex-col gap-6">

      <div>
        <button onClick={onBack} className="h-11 -ml-2 pr-2 flex items-center text-[17px] text-accent">
          <ChevronLeft size={26} /> Train
        </button>
        <h1 className="text-[34px] font-bold tracking-tight text-label">Build a workout</h1>
      </div>

      {/* Step 1 */}
      <section>
        <p className={sectionLabel}>What are you training?</p>
        <div className="rounded-2xl bg-surface p-4">
          <MusclePanel
            view={view}
            setView={setView}
            data={mapData}
            handleMuscleClick={toggleMuscle}
            hint="Tap muscles to select them"
          />
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selected.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMuscle({ muscle: m })}
                  className="flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full bg-accent/15 text-accent text-[15px] font-semibold"
                >
                  {formatMuscle(m)} <X size={14} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Step 2 */}
      <section>
        <p className={sectionLabel}>What's your goal?</p>
        <div className="flex p-0.5 rounded-[9px] bg-surface-2">
          {GOALS.map(g => (
            <button key={g.key} onClick={() => setGoal(g.key)} className={segment(goal === g.key)}>
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <button
          onClick={generate}
          disabled={selected.length === 0 || loading}
          className={`h-[52px] rounded-xl text-[17px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
            workout ? 'bg-surface text-accent' : 'bg-accent-fill text-on-accent active:opacity-80'
          }`}
        >
          {loading ? 'Building...' : workout ? 'Rebuild' : selected.length ? 'Build workout' : 'Pick a muscle first'}
        </button>
        {error && <p className="text-[13px] text-danger text-center">{error}</p>}
      </div>

      {/* Result */}
      {workout && (
        <section ref={resultsRef} className="scroll-mt-16 flex flex-col">
          <h2 className="text-[22px] font-bold tracking-tight text-label px-1">Your workout</h2>
          <p className="text-[15px] text-label-2 px-1 mb-4">
            {workout.preset.sets} sets · {workout.preset.reps} reps · {workout.preset.rest} rest
          </p>

          {workout.blocks.map((block, i) => (
            <div key={block.muscle} className="mb-4">
              <p className={sectionLabel}>{formatMuscle(block.muscle)}</p>
              {block.exercises.length === 0 && (
                <p className="text-[15px] text-label-3 px-1">No exercises found for this muscle</p>
              )}
              {block.exercises.map((ex, j) => {
                const key = `${i}-${j}`
                const opts = pools[block.muscle] ? optionsFor(i, j) : [ex]
                const pos = opts.findIndex(e => e.id === ex.id) + 1
                const canStep = opts.length > 1
                return (
                  <div key={key} className="mb-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => step(i, j, -1)} disabled={!canStep} className={roundBtn} aria-label="Previous exercise">
                        <ChevronLeft size={20} />
                      </button>
                      <div className="flex-1 min-w-0 [&>button]:mb-0">
                        <ExerciseCard exercise={ex} onClick={() => openSearch(key)} />
                      </div>
                      <button onClick={() => step(i, j, 1)} disabled={!canStep} className={roundBtn} aria-label="Next exercise">
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-3 h-8">
                      {canStep && <span className="text-[13px] text-label-3 tabular-nums">{pos} of {opts.length}</span>}
                      <button onClick={() => openSearch(key)} className="h-8 flex items-center gap-1 text-[13px] text-accent">
                        <Search size={13} /> Search
                      </button>
                    </div>

                    {searchKey === key && (
                      <div className="rounded-2xl bg-surface p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0 h-10 rounded-xl bg-surface-2 flex items-center gap-2 px-3">
                            <Search size={16} className="text-label-3 shrink-0" />
                            <input
                              autoFocus
                              value={query}
                              onChange={e => setQuery(e.target.value)}
                              placeholder="Search any exercise"
                              className="flex-1 min-w-0 bg-transparent text-[17px] text-label outline-none"
                            />
                          </div>
                          <button onClick={() => setSearchKey(null)} className="h-11 px-2 text-[17px] text-accent">Cancel</button>
                        </div>
                        {!allExercises ? (
                          <p className="text-[15px] text-label-3 p-2">Loading...</p>
                        ) : (
                          <div className="flex flex-col max-h-60 overflow-y-auto divide-y divide-separator">
                            {searchResults(i).map(r => (
                              <button
                                key={r.id}
                                onClick={() => { replaceExercise(i, j, r); setSearchKey(null) }}
                                className="min-h-12 px-2 py-2 text-left active:bg-surface-2"
                              >
                                <span className="block text-[17px] text-label">{r.name}</span>
                                <span className="block text-[13px] text-label-3">{formatMuscle(r.target)}</span>
                              </button>
                            ))}
                            {searchResults(i).length === 0 && (
                              <p className="text-[15px] text-label-3 p-2">No matches</p>
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
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={startWorkout}
                className="h-[52px] rounded-xl bg-accent-fill text-on-accent text-[17px] font-semibold active:opacity-80"
              >
                {draft ? 'Resume current workout' : 'Start workout'}
              </button>

              {user ? (
                <div className="rounded-xl bg-surface flex items-center gap-2 pl-4 pr-1.5 h-[52px]">
                  <input
                    value={workoutName}
                    onChange={e => { setWorkoutName(e.target.value); setSaveMsg(null) }}
                    placeholder={defaultName()}
                    maxLength={100}
                    aria-label="Workout name"
                    className="flex-1 min-w-0 bg-transparent text-[17px] text-label outline-none"
                  />
                  <button
                    onClick={saveWorkout}
                    disabled={saving || saveMsg?.ok}
                    className="h-10 px-4 rounded-lg bg-surface-2 text-accent text-[15px] font-semibold disabled:opacity-40"
                  >
                    {saving ? 'Saving...' : saveMsg?.ok ? 'Saved' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={onSignIn} className="h-11 text-[15px] text-accent">
                  Sign in to save this workout for later
                </button>
              )}
              {saveMsg && !saveMsg.ok && <p className="text-[13px] text-danger px-1">{saveMsg.text}</p>}
            </div>
          )}
        </section>
      )}
    </div>
  )
}