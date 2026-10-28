import { useState, useRef } from 'react'
import ExerciseCard from '../components/ExerciseCard'
import MusclePanel from '../components/MusclePanel'
import { normalizeMuscle, formatMuscle, toMapMuscles } from '../utils/muscles'
import { Shuffle, Loader2 } from 'lucide-react'
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

const card  = 'bg-bg border border-rule p-4 md:p-6'
const title = 'font-display font-black text-[28px] uppercase tracking-[0.04em] text-paper leading-none'
const label = 'text-[11px] font-medium uppercase tracking-[0.12em] text-text-min mb-2'

const chip = active =>
  `uppercase tracking-[0.1em] text-[12px] font-semibold px-3 md:px-4 py-2 border transition-colors ${
    active
      ? 'bg-paper text-ink border-paper'
      : 'bg-transparent text-text-2 border-rule-strong hover:text-paper'
  }`

const stepper = 'uppercase text-[12px] font-semibold w-10 h-10 border border-rule-strong text-paper'

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
  const [swapping, setSwapping]       = useState(null)
  const [swapMsg, setSwapMsg]         = useState(null)
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

  async function generate() {
    setLoading(true)
    setError(null)
    setSwapMsg(null)
    setSaveMsg(null)
    try {
      const res = await fetch(`${API_URL}/workouts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muscles: selected, goal, categories, exercises_per_muscle: perMuscle }),
      })
      if (!res.ok) throw new Error()
      setWorkout(await res.json())
      if (window.innerWidth < 768) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
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
    setSaveMsg(null)
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
  const canSave = workoutName.trim() && !saving

  return (
    <div className="flex flex-col md:min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-3 md:p-6 flex-1">

        {/* Left card — muscle selection */}
        <div className={`flex flex-col gap-4 flex-1 min-w-0 ${card}`}>
          <div>
            <h2 className={title}>Select Targets</h2>
            <p className="text-[13px] text-text-3 mt-2">
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
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-min mb-1">
                Selected ({selected.length})
              </p>
              {selected.length === 0 && (
                <p className="text-[13px] text-text-min">None yet</p>
              )}
              <div className="flex flex-wrap sm:flex-col gap-2">
                {selected.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMuscle({ muscle: m })}
                    className="flex justify-between gap-3 text-[12px] uppercase tracking-[0.06em] text-text-2 border border-rule-strong px-3 py-2 hover:text-paper hover:border-rule-input transition-colors"
                  >
                    {formatMuscle(m)} <span className="text-text-3">✕</span>
                  </button>
                ))}
              </div>
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  className="text-[11px] uppercase tracking-[0.1em] text-text-3 hover:text-paper mt-2 self-start"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right card — options + results */}
        <div className={`flex flex-col flex-1 min-w-0 ${card}`}>
          <h2 className={`${title} mb-6`}>Workout Builder</h2>

          {/* Goal */}
          <p className={label}>Goal</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {GOALS.map(g => (
              <button key={g.key} onClick={() => setGoal(g.key)} className={chip(goal === g.key)}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Equipment */}
          <p className={label}>Equipment</p>
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => setCategories([])} className={chip(categories.length === 0)}>Any</button>
            {EQUIPMENT.map(c => (
              <button key={c.key} onClick={() => toggleCategory(c.key)} className={chip(categories.includes(c.key))}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Per muscle */}
          <p className={label}>Exercises per muscle</p>
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setPerMuscle(n => Math.max(1, n - 1))} className={stepper}>−</button>
            <span className="font-display font-black text-[48px] leading-none text-paper w-8 text-center">{perMuscle}</span>
            <button onClick={() => setPerMuscle(n => Math.min(5, n + 1))} className={stepper}>+</button>
          </div>

          <button
            onClick={generate}
            disabled={selected.length === 0 || loading}
            className="uppercase tracking-[0.1em] text-[12px] font-semibold py-3 mb-6 bg-paper text-ink disabled:bg-transparent disabled:text-text-min disabled:border disabled:border-rule disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : workout ? 'Regenerate' : 'Generate Workout'}
          </button>

          {/* Results */}
          <div ref={resultsRef} className="scroll-mt-16 flex flex-col md:overflow-y-auto flex-1">
            {error && <p className="text-[13px] text-paper">{error}</p>}

            {!workout && !error && (
              <p className="text-[13px] text-text-min text-center my-6 md:mt-10">
                {selected.length ? 'Ready when you are' : 'Select at least one muscle'}
              </p>
            )}

            {workout && (
              <>
                {/* Save */}
                {user ? (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        value={workoutName}
                        onChange={e => setWorkoutName(e.target.value)}
                        placeholder="Name this workout..."
                        maxLength={100}
                        className="flex-1 min-w-0 bg-transparent border border-rule-input px-4 py-2 text-base md:text-[13px] text-paper outline-none focus:border-paper"
                      />
                      <button
                        onClick={saveWorkout}
                        disabled={!canSave}
                        className={`uppercase tracking-[0.1em] text-[12px] font-semibold px-4 py-2 border transition-colors ${
                          canSave
                            ? 'border-paper text-paper hover:bg-paper hover:text-ink'
                            : 'border-rule text-text-min cursor-not-allowed'
                        }`}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {saveMsg && (
                      <p className={`text-[11px] uppercase tracking-[0.06em] mt-2 ${saveMsg.ok ? 'text-text-3' : 'text-paper'}`}>
                        {saveMsg.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-text-3 mb-4">
                    Sign in to save workouts
                  </p>
                )}

                <div className="flex justify-between sm:justify-start sm:gap-6 border border-rule px-4 py-3 mb-6 text-[12px] uppercase tracking-[0.06em] text-text-3">
                  <span><span className="text-paper font-semibold">{workout.preset.sets}</span> sets</span>
                  <span><span className="text-paper font-semibold">{workout.preset.reps}</span> reps</span>
                  <span><span className="text-paper font-semibold">{workout.preset.rest}</span> rest</span>
                </div>

                {workout.blocks.map((block, i) => (
                  <div key={block.muscle} className="mb-6">
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-3 mb-3">
                      {formatMuscle(block.muscle)}
                    </h3>
                    {block.exercises.length === 0 ? (
                      <p className="text-[13px] text-text-min">No exercises match these filters</p>
                    ) : (
                      <>
                        {block.exercises.map((ex, j) => {
                          const key = `${i}-${j}`
                          return (
                            <div key={ex.id}>
                              <div className="flex items-stretch gap-2">
                                <div className="flex-1 min-w-0">
                                  <ExerciseCard exercise={ex} onClick={() => {}} />
                                </div>
                                <button
                                  onClick={() => swapExercise(i, j)}
                                  disabled={swapping === key}
                                  title="Shuffle exercise"
                                  aria-label="Shuffle exercise"
                                  className="flex items-center justify-center px-3 mb-2 text-paper border border-rule hover:border-rule-input transition-colors disabled:text-text-min"
                                >
                                  {swapping === key
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Shuffle size={14} />}
                                </button>
                              </div>
                              {swapMsg?.key === key && (
                                <p className="text-[11px] uppercase tracking-[0.06em] text-text-3 mt-1 mb-2">{swapMsg.text}</p>
                              )}
                            </div>
                          )
                        })}
                        {block.exercises.length < perMuscle && (
                          <p className="text-[11px] uppercase tracking-[0.06em] text-text-min mt-2">
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