import { useEffect, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import { useSession, hintFor, REST_SECONDS } from '../context/SessionContext'
import { API_URL } from '../api'
import SwipeRow, { ConfirmDialog } from '../components/SwipeRow'

const fmt = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

const field = 'w-full min-w-0 h-11 bg-black border px-2 text-base text-center text-white placeholder-white/30 outline-none focus:border-white/50'
const colLabel = 'text-[10px] uppercase tracking-widest text-white/40 font-bold text-center'

export default function ActiveSession() {
  const { draft, setDraft, unit, restEnd, setRestEnd, finish, discard, setExpanded, addExercise } = useSession()
  const [now, setNow]               = useState(Date.now())
  const [picking, setPicking]       = useState(draft.exercises.length === 0)
  const [error, setError]           = useState(null)
  const [discarding, setDiscarding] = useState(false)

  // clock for the elapsed time and rest countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // keep the phone screen awake while the workout is open (where supported)
  useEffect(() => {
    let lock = null
    navigator.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [])

  const change = fn => {
    const c = structuredClone(draft)
    fn(c)
    setDraft(c)
  }

  function setValue(ei, si, key, value) {
    change(d => {
      const s = d.exercises[ei].sets[si]
      s[key] = value
      s.invalid = false
    })
  }

  // Tick a set. Empty fields take last time's numbers, so repeating a set is one tap.
  function check(ei, si) {
    const ex = draft.exercises[ei]
    const s = ex.sets[si]

    if (s.done) {
      change(d => { d.exercises[ei].sets[si].done = false })
      return
    }

    const hint = hintFor(ex, si, unit, draft.repsHint)
    const weight = String(s.weight !== '' ? s.weight : hint.w).trim()
    const reps   = String(s.reps !== '' ? s.reps : hint.r).trim()
    const valid  = /^\d+$/.test(reps) && (weight === '' || !isNaN(parseFloat(weight)))

    if (!valid) {
      change(d => { d.exercises[ei].sets[si].invalid = true })
      return
    }

    change(d => {
      const target = d.exercises[ei]
      Object.assign(target.sets[si], { weight, reps, done: true, invalid: false })
      // exercise finished -> open the next one that still has sets left
      if (target.sets.every(x => x.done)) {
        d.open = d.exercises.findIndex(x => x.sets.some(y => !y.done))
      }
    })
    setRestEnd(Date.now() + REST_SECONDS * 1000)
    setError(null)
  }

  function addSet(ei) {
    change(d => { d.exercises[ei].sets.push({ weight: '', reps: '', done: false, invalid: false }) })
  }

  function removeSet(ei, si) {
    change(d => { d.exercises[ei].sets.splice(si, 1) })
  }

  function removeExercise(ei) {
    change(d => {
      d.exercises.splice(ei, 1)
      if (d.open === ei) d.open = -1
      else if (d.open > ei) d.open -= 1
    })
  }

  function onFinish() {
    const err = finish()
    if (err) setError(err)
  }

  const elapsed  = fmt(Math.max(0, Math.floor((now - draft.startedAt) / 1000)))
  const restLeft = Math.max(0, Math.ceil((restEnd - now) / 1000))

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d] text-[#e8e0d0]">
      <div className="flex flex-col h-full max-w-xl mx-auto">

        {/* Header */}
        <header className="flex items-center gap-2 h-14 px-2 border-b border-white/10 shrink-0">
          <button
            onClick={() => setExpanded(false)}
            className="w-11 h-11 flex items-center justify-center text-white/70"
            aria-label="Minimise workout"
          >
            <ChevronDown size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <input
              value={draft.name}
              onChange={e => change(d => { d.name = e.target.value })}
              placeholder="Workout name"
              maxLength={100}
              aria-label="Workout name"
              className="w-full bg-transparent text-base font-bold uppercase tracking-widest text-white placeholder-white/30 outline-none"
            />
            <p className="text-xs text-white/50">{elapsed}</p>
          </div>
          <button
            onClick={onFinish}
            className="h-11 px-5 mr-1 bg-[#c0392b] text-white text-lg tracking-widest"
            style={{ fontFamily: 'Bebas Neue' }}
          >
            Finish
          </button>
        </header>

        {/* Exercises */}
        <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

          {draft.exercises.length === 0 && (
            <p className="text-sm text-white/40 text-center my-6">No exercises yet. Add your first one below.</p>
          )}

          {draft.exercises.map((ex, ei) => {
            const open = draft.open === ei
            const doneCount = ex.sets.filter(s => s.done).length
            return (
              <div key={`${ex.exercise_id}-${ei}`} className={`border ${open ? 'border-white/25' : 'border-white/10'}`}>

                <SwipeRow
                  onDelete={() => removeExercise(ei)}
                  confirmTitle="Remove exercise?"
                  confirmText={`${ex.name} and its sets will be removed from this workout.`}
                >
                  <button
                    onClick={() => change(d => { d.open = open ? -1 : ei })}
                    className="w-full min-h-14 px-4 py-2 flex items-center justify-between gap-3 text-left"
                  >
                    <span className="text-base font-bold uppercase tracking-widest text-white">{ex.name}</span>
                    <span className="text-xs text-white/50 shrink-0">{doneCount} / {ex.sets.length}</span>
                  </button>
                </SwipeRow>

                {open && (
                  <div className="pb-3 bg-[#0f0f0f]">
                    <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-3 pb-1">
                      <span className={colLabel}>Set</span>
                      <span className={colLabel}>{unit}</span>
                      <span className={colLabel}>Reps</span>
                      <span />
                    </div>

                    {ex.sets.map((s, si) => {
                      const hint = hintFor(ex, si, unit, draft.repsHint)
                      const border = s.invalid ? 'border-[#c0392b]' : 'border-white/15'
                      return (
                        <SwipeRow
                          key={si}
                          onDelete={() => removeSet(ei, si)}
                          confirmTitle="Delete set?"
                          confirmText={`Set ${si + 1} of ${ex.name}.`}
                          bg={s.done ? 'bg-[#15220f]' : 'bg-[#0f0f0f]'}
                        >
                          <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 items-center px-3 py-1">
                            <span className="text-sm font-bold text-white/70 text-center">{si + 1}</span>
                            <input
                              className={`${field} ${border}`}
                              inputMode="decimal"
                              aria-label={`Weight in ${unit}`}
                              placeholder={hint.w || '-'}
                              value={s.weight}
                              onChange={e => setValue(ei, si, 'weight', e.target.value)}
                            />
                            <input
                              className={`${field} ${border}`}
                              inputMode="numeric"
                              aria-label="Reps"
                              placeholder={hint.r || '-'}
                              value={s.reps}
                              onChange={e => setValue(ei, si, 'reps', e.target.value)}
                            />
                            <button
                              onClick={() => check(ei, si)}
                              aria-label={s.done ? 'Mark set not done' : 'Mark set done'}
                              className={`h-11 flex items-center justify-center border ${
                                s.done ? 'bg-[#3f8f3a] border-[#3f8f3a] text-white' : 'border-white/25 text-white/40'
                              }`}
                            >
                              <Check size={20} strokeWidth={3} />
                            </button>
                          </div>
                        </SwipeRow>
                      )
                    })}

                    <div className="px-3 pt-2">
                      <button
                        onClick={() => addSet(ei)}
                        className="w-full h-11 flex items-center justify-center gap-1 border border-dashed border-white/20 text-xs font-bold uppercase tracking-widest text-white/60"
                      >
                        <Plus size={14} /> Add set
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {picking ? (
            <ExercisePicker
              exclude={draft.exercises.map(e => e.exercise_id)}
              onPick={e => { addExercise(e); setPicking(false) }}
              onClose={() => setPicking(false)}
            />
          ) : (
            <button
              onClick={() => setPicking(true)}
              className="h-12 shrink-0 border border-white/40 text-white text-lg tracking-widest"
              style={{ fontFamily: 'Bebas Neue' }}
            >
              + Add exercise
            </button>
          )}

          <button
            onClick={() => setDiscarding(true)}
            className="h-11 shrink-0 text-xs uppercase tracking-widest text-white/40"
          >
            Discard workout
          </button>
        </main>

        {/* Rest timer */}
        {restLeft > 0 && (
          <div className="flex items-center gap-2 px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#161514] border-t-2 border-[#c0392b] shrink-0">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Rest</p>
              <p className="text-4xl leading-none text-white" style={{ fontFamily: 'Bebas Neue' }}>{fmt(restLeft)}</p>
            </div>
            <button onClick={() => setRestEnd(restEnd - 15000)} className="w-14 h-12 border border-white/25 text-white font-bold">-15</button>
            <button onClick={() => setRestEnd(restEnd + 15000)} className="w-14 h-12 border border-white/25 text-white font-bold">+15</button>
            <button onClick={() => setRestEnd(0)} className="w-16 h-12 bg-[#e8e0d0] text-black text-xs font-bold uppercase tracking-widest">Skip</button>
          </div>
        )}
      </div>

      {discarding && (
        <ConfirmDialog
          title="Discard workout?"
          text="Nothing from this workout will be saved."
          confirmLabel="Discard"
          onCancel={() => setDiscarding(false)}
          onConfirm={discard}
        />
      )}
    </div>
  )
}

function ExercisePicker({ exclude, onPick, onClose }) {
  const [all, setAll]     = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/exercises`)
      .then(r => r.json())
      .then(setAll)
      .catch(() => setAll([]))
  }, [])

  const q = query.trim().toLowerCase()
  const results = (all || [])
    .filter(e => !exclude.includes(e.id) && (!q || e.name.toLowerCase().includes(q)))
    .slice(0, 30)

  return (
    <div className="border border-white/15 p-3 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Search size={16} className="text-white/40 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="flex-1 min-w-0 h-11 bg-black border border-white/15 px-3 text-base text-white placeholder-white/30 outline-none focus:border-white/50"
        />
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center text-white/60" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {!all && <p className="text-xs text-white/40 p-2">Loading...</p>}
      <div className="flex flex-col max-h-72 overflow-y-auto">
        {results.map(e => (
          <button
            key={e.id}
            onClick={() => onPick(e)}
            className="min-h-12 px-2 py-2 text-left text-sm uppercase tracking-widest text-white/80 border-b border-white/5 hover:bg-white/5"
          >
            {e.name}
          </button>
        ))}
        {all && results.length === 0 && <p className="text-xs text-white/40 p-2">No matches</p>}
      </div>
    </div>
  )
}