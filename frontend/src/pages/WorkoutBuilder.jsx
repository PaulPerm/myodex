import { useState } from 'react'
import ExerciseCard from '../components/ExerciseCard'
import MusclePanel from '../components/MusclePanel'
import { normalizeMuscle, formatMuscle, toMapMuscles } from '../utils/muscles'
import { Shuffle, Loader2 } from 'lucide-react'

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
  `uppercase tracking-widest text-xs font-bold px-4 py-2 border transition-colors ${
    active
      ? 'bg-[#c0392b] text-white border-[#c0392b]'
      : 'bg-transparent text-white/30 border-white/10 hover:text-white/60'
  }`

const label = 'text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2'

export default function WorkoutBuilder() {
  const [view, setView]             = useState('anterior')
  const [selected, setSelected]     = useState([])
  const [goal, setGoal]             = useState('hypertrophy')
  const [categories, setCategories] = useState([])
  const [perMuscle, setPerMuscle]   = useState(2)
  const [workout, setWorkout]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [swapping, setSwapping]     = useState(null)
  const [swapMsg, setSwapMsg]       = useState(null)

  function toggleMuscle(muscleData) {
    const slug = normalizeMuscle(muscleData.muscle)
    if (!slug) return
    setSelected(prev => prev.includes(slug) ? prev.filter(m => m !== slug) : [...prev, slug])
  }

  function toggleCategory(key) {
    setCategories(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key])
  }

  async function generate() {
    setLoading(true)
    setError(null)
    setSwapMsg(null)
    try {
      const res = await fetch(`${API_URL}/workouts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muscles: selected, goal, categories, exercises_per_muscle: perMuscle }),
      })
      if (!res.ok) throw new Error()
      setWorkout(await res.json())
    } catch {
      setError('Could not generate workout. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function swapExercise(blockIdx, exIdx) {
    const key = `${blockIdx}-${exIdx}`
    const exclude = workout.blocks.flatMap(b => b.exercises.map(e => e.name))
    setSwapping(key)
    setSwapMsg(null)
    try {
      const res = await fetch(`${API_URL}/workouts/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muscle: workout.blocks[blockIdx].muscle, exclude, categories }),
      })
      if (res.status === 404) {
        setSwapMsg({ key, text: 'No alternatives with these filters' })
        return
      }
      if (!res.ok) throw new Error()
      const replacement = await res.json()
      setWorkout(prev => ({
        ...prev,
        blocks: prev.blocks.map((b, i) =>
          i !== blockIdx ? b : { ...b, exercises: b.exercises.map((e, j) => (j === exIdx ? replacement : e)) }
        ),
      }))
    } catch {
      setSwapMsg({ key, text: 'Swap failed' })
    } finally {
      setSwapping(null)
    }
  }

  const mapData = selected.length ? [{ name: 'Selected', muscles: toMapMuscles(selected) }] : []

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex gap-6 p-6 flex-1">

        {/* Left card — muscle selection */}
        <div className="flex flex-col gap-4 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-6 flex-1 min-w-0">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>
              Select Targets
            </h2>
            <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
              Click muscles to add or remove them
            </p>
          </div>

          <div className="flex gap-6 flex-1">
            <MusclePanel
              view={view}
              setView={setView}
              data={mapData}
              handleMuscleClick={toggleMuscle}
              hint="Click to select muscles"
            />

            <div className="flex flex-col gap-2 flex-1 pt-2">
              <p className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-1">
                Selected ({selected.length})
              </p>
              {selected.length === 0 && (
                <p className="text-xs uppercase tracking-widest text-white/20">None yet</p>
              )}
              {selected.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMuscle({ muscle: m })}
                  className="flex justify-between text-xs uppercase tracking-widest text-white/60 border border-white/10 px-3 py-2 hover:border-[#c0392b]/50 hover:text-white transition-colors"
                >
                  {formatMuscle(m)} <span className="text-white/30">✕</span>
                </button>
              ))}
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
        <div className="flex flex-col flex-1 min-w-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-4" style={{ fontFamily: 'Bebas Neue' }}>
            Workout Builder
          </h2>

          {/* Goal */}
          <p className={label}>Goal</p>
          <div className="flex gap-2 mb-4">
            {GOALS.map(g => (
              <button key={g.key} onClick={() => setGoal(g.key)} className={chip(goal === g.key)}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Equipment */}
          <p className={label}>Equipment</p>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setCategories([])} className={chip(categories.length === 0)}>Any</button>
            {EQUIPMENT.map(c => (
              <button key={c.key} onClick={() => toggleCategory(c.key)} className={chip(categories.includes(c.key))}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Per muscle */}
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
          <div className="flex flex-col overflow-y-auto flex-1">
            {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

            {!workout && !error && (
              <p className="text-sm uppercase tracking-widest text-white/20 text-center mt-10">
                {selected.length ? 'Ready when you are' : 'Select at least one muscle'}
              </p>
            )}

            {workout && (
              <>
                <div className="flex gap-6 border border-white/10 px-4 py-3 mb-6 text-xs uppercase tracking-widest text-white/60">
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
                          return (
                            <div key={ex.id}>
                              <div className="flex items-stretch gap-2">
                                <div className="flex-1">
                                  <ExerciseCard exercise={ex} onClick={() => {}} />
                                </div>
                                                                <button
                                  onClick={() => swapExercise(i, j)}
                                  disabled={swapping === key}
                                  title="Shuffle exercise"
                                  aria-label="Shuffle exercise"
                                  className="flex items-center justify-center px-3 mb-2 text-white/40 border border-white/10 hover:text-white hover:border-[#c0392b]/50 transition-colors disabled:opacity-30"
                                >
                                  {swapping === key
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Shuffle size={16} />}
                                </button>
                              </div>
                              {swapMsg?.key === key && (
                                <p className="text-[10px] uppercase tracking-widest text-[#c0392b] mt-1 mb-2">{swapMsg.text}</p>
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