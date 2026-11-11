import { useState, useRef } from 'react'
import ExerciseCard from '../components/ExerciseCard'
import MusclePanel from '../components/MusclePanel'
import { normalizeMuscle, formatMuscle, toMapMuscles } from '../utils/muscles'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const GOALS = [
  { key: 'strength',    label: 'Strength' },
  { key: 'hypertrophy', label: 'Hypertrophy' },
  { key: 'endurance',   label: 'Endurance' },
]

const EQUIPMENT = [
  { key: 'bodyweight',  label: 'Bodyweight' },
  { key: 'free_weight', label: 'Free Weight' },
  { key: 'machine',     label: 'Machine' },
]

const chip = active =>
  `uppercase tracking-widest text-xs font-bold px-3 md:px-4 py-2 border transition-colors ${
    active
      ? 'bg-[#c0392b] text-white border-[#c0392b]'
      : 'bg-transparent text-white/30 border-white/10 hover:text-white/60'
  }`

const label = 'text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2'

const sideBtn = 'flex items-center justify-center px-2 mb-2 text-white/40 border border-white/10 hover:text-white hover:border-[#c0392b]/50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed'

export default function WorkoutBuilder() {
  const { user } = useAuth()
  const [view, setView]               = useState('anterior')
  const [selected, setSelected]       = useState([])
  const [goal, setGoal]               = useState('hypertrophy')
  const [categories, setCategories]   = useState([])
  const [perMuscle, setPerMuscle]     = useState(2)
  const [workout, setWorkout]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [pools, setPools]             = useState({})     // muscle -> primary exercises
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

  function toggleCategory(key) {
    setCategories(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key])
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
        body: JSON.stringify({ muscles: selected, goal, categories, exercises_per_muscle: perMuscle }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWorkout(data)
      loadPools(data.blocks.map(b => b.muscle))
      if (window.innerWidth < 768) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    } catch {
      setError('Could not generate workout. Is the backend running?')
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

  // Exercises this slot can cycle through: the muscle's pool, matching equipment,
  // minus anything already used in another slot.
  function optionsFor(blockIdx, exIdx) {
    const block = workout.blocks[blockIdx]
    const current = block.exercises[exIdx]
    const usedElsewhere = new Set(
      workout.blocks.flatMap((b, i) =>
        b.exercises.filter((_, j) => !(i === blockIdx && j === exIdx)).map(e => e.id)
      )
    )
    const pool = (pools[block.muscle] || []).filter(e =>
      (!categories.length || categories.includes(e.category)) && !usedElsewhere.has(e.id)
    )
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

  function searchResults(blockIdx, exIdx) {
    const used = new Set(workout.blocks.flatMap(b => b.exercises.map(e => e.id)))
    const muscle = workout.blocks[blockIdx].muscle
    const q = query.trim().toLowerCase()
    return (allExercises || [])
      .filter(e => !used.has(e.id) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => (b.target === muscle) - (a.target === muscle)) // this muscle first
      .slice(0, 8)
  }

  async function saveWorkout() {
    setSaving(true)
    setSaveMsg(null)
    try {
      await apiFetch('/saved-workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName.trim(),
          goal: workout.goal,
          preset: workout.preset,
          blocks: workout.blocks,
        }),
      })
      setSaveMsg({ ok: true, text: 'Saved' })
      setWorkoutName('')
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const mapData = selected.length ? [{ name: 'Selected', muscles: toMapMuscles(selected) }] : []

  return (
    <div className="flex flex-col md:min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-3 md:p-6 flex-1">

        {/* Left card — muscle selection */}
        <div className="flex flex-col gap-4 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6 flex-1 min-w-0">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>
              Select Targets
            </h2>
            <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
              Tap muscles to add or remove them
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
            <MusclePanel
              view={view}
              setView={setView}
              data={mapData}
              handleMuscleClick={toggleMuscle}
              hint="Tap to select muscles"
            />

            <div className="flex flex-col gap-2 flex-1 sm:pt-2">
              <p className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-1">
                Selected ({selected.length})
              </p>
              {selected.length === 0 && (
                <p className="text-xs uppercase tracking-widest text-white/20">None yet</p>
              )}
              <div className="flex flex-wrap sm:flex-col gap-2">
                {selected.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMuscle({ muscle: m })}
                    className="flex justify-between gap-3 text-xs uppercase tracking-widest text-white/60 border border-white/10 px-3 py-2 hover:border-[#c0392b]/50 hover:text-white transition-colors"
                  >
                    {formatMuscle(m)} <span className="text-white/30">✕</span>
                  </button>
                ))}
              </div>
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 mt-2 self-start"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right card — options + results */}
        <div className="flex flex-col flex-1 min-w-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-4" style={{ fontFamily: 'Bebas Neue' }}>
            Workout Builder
          </h2>

          <p className={label}>Goal</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {GOALS.map(g => (
              <button key={g.key} onClick={() => setGoal(g.key)} className={chip(goal === g.key)}>
                {g.label}
              </button>
            ))}
          </div>

          <p className={label}>Equipment</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setCategories([])} className={chip(categories.length === 0)}>Any</button>
            {EQUIPMENT.map(c => (
              <button key={c.key} onClick={() => toggleCategory(c.key)} className={chip(categories.includes(c.key))}>
                {c.label}
              </button>
            ))}
          </div>

          <p className={label}>Exercises per muscle</p>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setPerMuscle(n => Math.max(1, n - 1))} className={chip(false)}>−</button>
            <span className="text-white text-lg w-6 text-center" style={{ fontFamily: 'Bebas Neue' }}>{perMuscle}</span>
            <button onClick={() => setPerMuscle(n => Math.min(5, n + 1))} className={chip(false)}>+</button>
          </div>

          <button
            onClick={generate}
            disabled={selected.length === 0 || loading}
            className="uppercase tracking-widest text-sm font-bold py-3 mb-6 bg-[#c0392b] text-white hover:bg-[#a93226] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Bebas Neue' }}
          >
            {loading ? 'Generating...' : workout ? 'Regenerate' : 'Generate Workout'}
          </button>

          {/* Results */}
          <div ref={resultsRef} className="scroll-mt-16 flex flex-col md:overflow-y-auto flex-1">
            {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

            {!workout && !error && (
              <p className="text-sm uppercase tracking-widest text-white/20 text-center my-6 md:mt-10">
                {selected.length ? 'Ready when you are' : 'Select at least one muscle'}
              </p>
            )}

            {workout && (
              <>
                {user ? (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        value={workoutName}
                        onChange={e => setWorkoutName(e.target.value)}
                        placeholder="Name this workout..."
                        maxLength={100}
                        className="flex-1 min-w-0 bg-white/5 border border-white/10 px-4 py-2 text-base md:text-xs uppercase tracking-widest text-white placeholder-white/20 outline-none focus:border-white/20"
                      />
                      <button
                        onClick={saveWorkout}
                        disabled={!workoutName.trim() || saving}
                        className="uppercase tracking-widest text-xs font-bold px-4 py-2 border border-[#c0392b]/40 text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {saveMsg && (
                      <p className={`text-[10px] uppercase tracking-widest mt-2 ${saveMsg.ok ? 'text-white/50' : 'text-[#c0392b]'}`}>
                        {saveMsg.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4">
                    Sign in to save workouts
                  </p>
                )}

                <div className="flex justify-between sm:justify-start sm:gap-6 border border-white/10 px-4 py-3 mb-6 text-xs uppercase tracking-widest text-white/60">
                  <span><span className="text-[#c0392b] font-bold">{workout.preset.sets}</span> sets</span>
                  <span><span className="text-[#c0392b] font-bold">{workout.preset.reps}</span> reps</span>
                  <span><span className="text-[#c0392b] font-bold">{workout.preset.rest}</span> rest</span>
                </div>

                {workout.blocks.map((block, i) => (
                  <div key={block.muscle} className="mb-6">
                    <h3 className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-3">
                      {formatMuscle(block.muscle)}
                    </h3>
                    {block.exercises.length === 0 ? (
                      <p className="text-xs uppercase tracking-widest text-white/20">No exercises match these filters</p>
                    ) : (
                      <>
                        {block.exercises.map((ex, j) => {
                          const key = `${i}-${j}`
                          const opts = pools[block.muscle] ? optionsFor(i, j) : [ex]
                          const pos = opts.findIndex(e => e.id === ex.id) + 1
                          const canStep = opts.length > 1
                          return (
                            <div key={key}>
                              <div className="flex items-stretch gap-2">
                                <button onClick={() => step(i, j, -1)} disabled={!canStep} className={sideBtn} aria-label="Previous exercise">
                                  <ChevronLeft size={16} />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <ExerciseCard exercise={ex} onClick={() => {}} />
                                </div>
                                <button onClick={() => step(i, j, 1)} disabled={!canStep} className={sideBtn} aria-label="Next exercise">
                                  <ChevronRight size={16} />
                                </button>
                                <button
                                  onClick={() => openSearch(key)}
                                  className={`${sideBtn} ${searchKey === key ? 'text-white border-[#c0392b]/50' : ''}`}
                                  aria-label="Search exercises"
                                >
                                  <Search size={16} />
                                </button>
                              </div>

                              <p className="text-[10px] uppercase tracking-widest text-white/30 -mt-1 mb-2 pl-10">
                                {canStep ? `${pos} / ${opts.length}` : 'No other options with these filters'}
                              </p>

                              {searchKey === key && (
                                <div className="border border-white/10 p-3 mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      autoFocus
                                      value={query}
                                      onChange={e => setQuery(e.target.value)}
                                      placeholder="Search any exercise..."
                                      className="flex-1 min-w-0 bg-white/5 border border-white/10 px-3 py-2 text-base md:text-xs uppercase tracking-widest text-white placeholder-white/20 outline-none focus:border-white/20"
                                    />
                                    <button onClick={() => setSearchKey(null)} className="text-white/40 hover:text-white p-1" aria-label="Close search">
                                      <X size={16} />
                                    </button>
                                  </div>
                                  {!allExercises ? (
                                    <p className="text-[10px] uppercase tracking-widest text-white/20 p-2">Loading...</p>
                                  ) : (
                                    <div className="flex flex-col max-h-60 overflow-y-auto">
                                      {searchResults(i, j).map(r => (
                                        <button
                                          key={r.id}
                                          onClick={() => { replaceExercise(i, j, r); setSearchKey(null) }}
                                          className="text-left px-2 py-2 text-xs uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white border-b border-white/5"
                                        >
                                          {r.name}
                                          <span className="text-white/30"> · {formatMuscle(r.target)}</span>
                                        </button>
                                      ))}
                                      {searchResults(i, j).length === 0 && (
                                        <p className="text-[10px] uppercase tracking-widest text-white/20 p-2">No matches</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {block.exercises.length < perMuscle && (
                          <p className="text-[10px] uppercase tracking-widest text-white/30 mt-2">
                            Only {block.exercises.length} available with these filters
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}