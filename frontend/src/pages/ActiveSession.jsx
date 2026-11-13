import { useEffect, useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { useSession, hintFor, REST_SECONDS } from '../context/SessionContext'
import { API_URL } from '../api'
import SwipeRow, { ConfirmDialog } from '../components/SwipeRow'

const fmt = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

const field = 'w-full min-w-0 h-11 rounded-lg px-2 font-mono text-[17px] text-center text-label outline-none transition-colors focus:ring-2 focus:ring-accent'
const colLabel = 'text-[13px] text-label-3 text-center'

export default function ActiveSession() {
  const { draft, setDraft, unit, restEnd, setRestEnd, finish, discard, setExpanded, addExercise } = useSession()
  const [now, setNow]               = useState(Date.now())
  const [picking, setPicking]       = useState(draft.exercises.length === 0)
  const [error, setError]           = useState(null)
  const [discarding, setDiscarding] = useState(false)
  const [typing, setTyping]         = useState(false) // keyboard open: hide the rest timer

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

  // Nothing ticked yet: just close. Otherwise ask first.
  function exit() {
    const anyDone = draft.exercises.some(ex => ex.sets.some(s => s.done))
    if (anyDone) setDiscarding(true)
    else discard()
  }

  const setsDone = draft.exercises.reduce((n, ex) => n + ex.sets.filter(x => x.done).length, 0)
  const elapsed  = fmt(Math.max(0, Math.floor((now - draft.startedAt) / 1000)))
  const restLeft = Math.max(0, Math.ceil((restEnd - now) / 1000))
  const restPct  = Math.min(100, (restLeft / REST_SECONDS) * 100)

  return (
        <div
          className="fixed inset-0 z-50 bg-bg text-label overflow-y-auto overscroll-contain"
          onFocus={e => { if (e.target.tagName === 'INPUT') setTyping(true) }}
          onBlur={e => { if (e.target.tagName === 'INPUT') setTyping(false) }}
        >
          <div className="min-h-full max-w-xl mx-auto flex flex-col">

        {/* Header: tap anywhere on the bar (except the buttons) to minimise */}
        <header
          onClick={() => setExpanded(false)}
          className="sticky top-0 z-10 bg-bg flex items-center gap-1 h-16 px-2 shrink-0 cursor-pointer select-none"
          aria-label="Minimise workout"
        >
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-label-3/40" aria-hidden="true" />
          <button
            onClick={e => { e.stopPropagation(); exit() }}
            className="w-11 h-11 flex items-center justify-center"
            aria-label="Exit workout"
          >
            <span className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-label-2 shadow-sm">
              <X size={16} strokeWidth={2.5} />
            </span>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[17px] font-semibold text-label truncate">{draft.name || 'Workout'}</p>
            <p className="font-mono text-[13px] text-label-2">{elapsed} · {setsDone} sets</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onFinish() }}
            className="h-11 px-5 mr-1 rounded-full bg-accent-fill text-on-accent text-[15px] font-bold active:opacity-80"
          >
            Finish
          </button>
        </header>

        {/* Exercises */}
        <main className="flex-1 px-3 py-3 pb-6 flex flex-col gap-3">
          {error && <p className="text-[13px] text-danger text-center">{error}</p>}

          <input
            value={draft.name}
            onChange={e => change(d => { d.name = e.target.value })}
            placeholder="Name this workout (optional)"
            maxLength={100}
            aria-label="Workout name"
            className="h-11 shrink-0 px-4 rounded-xl bg-transparent text-[15px] text-label outline-none focus:bg-surface"
          />

          {draft.exercises.length === 0 && !picking && (
            <p className="text-[15px] text-label-3 text-center my-6">No exercises yet. Add your first one below.</p>
          )}

          {draft.exercises.map((ex, ei) => {
            const open = draft.open === ei
            const complete = ex.sets.length > 0 && ex.sets.every(s => s.done)
            return (
              <div
                key={`${ex.exercise_id}-${ei}`}
                className={`rounded-2xl overflow-hidden transition-opacity ${
                  complete ? 'bg-done-row opacity-75' : 'bg-surface shadow-sm'
                }`}
              >

                <SwipeRow
                  onDelete={() => removeExercise(ei)}
                  confirmTitle="Remove exercise?"
                  confirmText={`${ex.name} and its sets will be removed from this workout.`}
                  bg={complete ? 'bg-done-row' : 'bg-surface'}
                >
                  <button
                    onClick={() => change(d => { d.open = open ? -1 : ei })}
                    className="w-full min-h-14 px-4 py-3 flex items-center justify-between gap-3 text-left"
                  >
                    <span className={`${open ? 'text-[18px] font-bold' : 'text-[16px] font-semibold'} text-label`}>
                      {ex.name}
                    </span>
                    {complete && (
                      <span className="w-7 h-7 shrink-0 rounded-full bg-success flex items-center justify-center text-on-success" aria-label="Exercise complete">
                        <Check size={14} strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                </SwipeRow>

                {open && (
                  <div className="pb-3">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 px-4 pb-1">
                      <span className={colLabel}>Set</span>
                      <span className={colLabel}>{unit}</span>
                      <span className={colLabel}>Reps</span>
                      <span />
                    </div>

                    {ex.sets.map((s, si) => {
                      const hint = hintFor(ex, si, unit, draft.repsHint)
                      const inputStyle = s.done
                        ? 'bg-transparent font-medium'
                        : s.invalid
                          ? 'bg-surface-2 ring-2 ring-danger'
                          : 'bg-surface-2'
                      return (
                        <SwipeRow
                          key={si}
                          onDelete={() => removeSet(ei, si)}
                          confirmTitle="Delete set?"
                          confirmText={`Set ${si + 1} of ${ex.name}.`}
                          bg={s.done ? 'bg-done-row' : 'bg-surface'}
                        >
                          <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 items-center px-4 py-1">
                            <span className="font-mono text-[15px] text-label-2 text-center">{si + 1}</span>
                            <input
                              className={`${field} ${inputStyle}`}
                              inputMode="decimal"
                              aria-label={`Weight in ${unit}`}
                              placeholder={hint.w || '–'}
                              value={s.weight}
                              onChange={e => setValue(ei, si, 'weight', e.target.value)}
                            />
                            <input
                              className={`${field} ${inputStyle}`}
                              inputMode="numeric"
                              aria-label="Reps"
                              placeholder={hint.r || '–'}
                              value={s.reps}
                              onChange={e => setValue(ei, si, 'reps', e.target.value)}
                            />
                            <button
                              onClick={() => check(ei, si)}
                              aria-label={s.done ? 'Mark set not done' : 'Mark set done'}
                              className={`h-11 rounded-lg flex items-center justify-center transition-colors ${
                                s.done ? 'bg-success text-on-success' : 'bg-surface-2 text-label-3'
                              }`}
                            >
                              <Check size={20} strokeWidth={3} />
                            </button>
                          </div>
                        </SwipeRow>
                      )
                    })}

                    <div className="px-4 pt-2">
                      <button
                        onClick={() => addSet(ei)}
                        className="w-full h-11 rounded-lg bg-surface-2 flex items-center justify-center gap-1.5 text-[15px] font-semibold text-label-2 active:bg-surface-3"
                      >
                        <Plus size={16} strokeWidth={2.5} /> Add set
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
              className="h-[52px] shrink-0 rounded-full border-2 border-dashed border-label-3/40 text-label text-[16px] font-semibold flex items-center justify-center gap-2 active:bg-surface"
            >
              <Plus size={20} strokeWidth={2.5} /> Add exercise
            </button>
          )}
        </main>

        {/* Rest timer */}
        {restLeft > 0 && !typing && (
          <div className="sticky bottom-0 z-10 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-2.5 rounded-3xl bg-timer text-timer-text px-4 py-3.5 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-timer-sub">Rest</p>
                  <p className="font-mono text-[30px] font-medium leading-tight">{fmt(restLeft)}</p>
                </div>
                <button onClick={() => setRestEnd(restEnd - 15000)} className="w-14 h-11 rounded-full bg-timer-btn text-timer-btn-text font-mono text-[15px]">−15</button>
                <button onClick={() => setRestEnd(restEnd + 15000)} className="w-14 h-11 rounded-full bg-timer-btn text-timer-btn-text font-mono text-[15px]">+15</button>
                <button onClick={() => setRestEnd(0)} className="w-16 h-11 rounded-full bg-timer-skip text-timer-skip-text text-[15px] font-bold">Skip</button>
              </div>
              <div className="h-1.5 rounded-full bg-timer-btn overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-timer-bar transition-[width] duration-1000 ease-linear" style={{ width: `${restPct}%` }} />
              </div>
            </div>
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
    <div className="rounded-2xl bg-surface p-3 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0 h-10 rounded-xl bg-surface-2 flex items-center gap-2 px-3">
          <Search size={16} className="text-label-3 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="flex-1 min-w-0 bg-transparent text-[17px] text-label outline-none"
          />
        </div>
        <button onClick={onClose} className="h-11 px-2 text-[17px] text-accent">Cancel</button>
      </div>
      {!all && <p className="text-[15px] text-label-3 p-2">Loading...</p>}
      <div className="flex flex-col max-h-72 overflow-y-auto divide-y divide-separator">
        {results.map(e => (
          <button
            key={e.id}
            onClick={() => onPick(e)}
            className="min-h-12 px-2 py-2 text-left text-[17px] text-label active:bg-surface-2"
          >
            {e.name}
          </button>
        ))}
        {all && results.length === 0 && <p className="text-[15px] text-label-3 p-2">No matches</p>}
      </div>
    </div>
  )
}