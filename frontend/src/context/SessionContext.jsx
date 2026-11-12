import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { apiFetch } from '../api'

const DRAFT_KEY = 'myodex.activeSession.v2'
const UNIT_KEY  = 'myodex.unit'
const KG_PER_LB = 0.45359237
export const REST_SECONDS = 90

export const toKg   = (val, unit) => (unit === 'kg' ? val : val * KG_PER_LB)
export const fromKg = (kg, unit)  => (unit === 'kg' ? kg : kg / KG_PER_LB)
export const round1 = n => String(Math.round(n * 10) / 10)

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

const store = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage unavailable */ }
}

const emptySet = () => ({ weight: '', reps: '', done: false, invalid: false })

// What to show as the grey placeholder for a set: last time's numbers,
// falling back to the workout's rep target (e.g. "8-12").
export function hintFor(ex, setIndex, unit, repsHint) {
  const p = ex.prev[setIndex] ?? ex.prev[ex.prev.length - 1]
  return {
    w: p && p.kg != null ? round1(fromKg(p.kg, unit)) : '',
    r: p ? String(p.reps) : (repsHint || ''),
  }
}

function makeExercise(e, prevSets = [], setCount = 3) {
  const prev = prevSets.map(p => ({ kg: p.weight_kg == null ? null : Number(p.weight_kg), reps: p.reps }))
  return {
    exercise_id: e.id,
    name: e.name,
    target: e.target || null,
    prev,
    sets: Array.from({ length: prev.length || setCount }, emptySet),
  }
}

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const { user } = useAuth()
  const [unit, setUnit]         = useState(() => load(UNIT_KEY, 'lbs'))
  const [draft, setDraft]       = useState(() => load(DRAFT_KEY, null))
  const [expanded, setExpanded] = useState(false)
  const [restEnd, setRestEnd]   = useState(0)
  const [summary, setSummary]   = useState(null)

  useEffect(() => store(DRAFT_KEY, draft), [draft])
  useEffect(() => store(UNIT_KEY, unit), [unit])

  async function fetchPrev(ids) {
    if (!user || ids.length === 0) return {}
    try {
      return await apiFetch(`/sessions/last-sets?exercise_ids=${ids.join(',')}`)
    } catch {
      return {}
    }
  }

  // exercises: [{ id, name, target }]
  async function start(name, exercises, { savedId = null, setCount = 3, repsHint = null } = {}) {
    const prev = await fetchPrev(exercises.map(e => e.id))
    setDraft({
      name,
      saved_workout_id: savedId,
      startedAt: Date.now(),
      open: 0,
      repsHint,
      exercises: exercises.map(e => makeExercise(e, prev[e.id], setCount)),
    })
    setRestEnd(0)
    setExpanded(true)
  }

  async function addExercise(e) {
    const prev = await fetchPrev([e.id])
    setDraft(d => {
      if (!d) return d
      const c = structuredClone(d)
      c.exercises.push(makeExercise(e, prev[e.id], 3))
      c.open = c.exercises.length - 1
      return c
    })
  }

  function discard() {
    setDraft(null)
    setRestEnd(0)
    setExpanded(false)
  }

  // Returns an error string, or null on success.
  function finish() {
    const sets = []
    const muscles = []
    let volumeKg = 0
    let prs = 0

    for (const ex of draft.exercises) {
      const done = ex.sets.filter(s => s.done)
      const bestPrev = ex.prev.reduce((m, p) => Math.max(m, p.kg ?? 0), 0)
      let bestNow = 0
      done.forEach((s, i) => {
        const w = parseFloat(s.weight)
        const kg = isNaN(w) ? null : Number(toKg(w, unit).toFixed(3))
        const reps = parseInt(s.reps)
        sets.push({ exercise_id: ex.exercise_id, set_number: i + 1, weight_kg: kg, reps })
        if (kg) {
          volumeKg += kg * reps
          bestNow = Math.max(bestNow, kg)
        }
      })
      if (ex.prev.length && bestNow > bestPrev + 0.05) prs++
      if (done.length && ex.target && !muscles.includes(ex.target)) muscles.push(ex.target)
    }

    if (sets.length === 0) return 'Tick at least one set first'

    const name = draft.name.trim() || 'Workout'
    setSummary({
      name,
      mins: Math.max(1, Math.round((Date.now() - draft.startedAt) / 60000)),
      setCount: sets.length,
      volumeKg,
      prs,
      muscles,
      status: 'pending', // pending -> saving -> saved | error
      payload: {
        name,
        saved_workout_id: user ? draft.saved_workout_id : null,
        performed_at: new Date(draft.startedAt).toISOString(),
        sets,
      },
    })
    setDraft(null)
    setRestEnd(0)
    setExpanded(false)
    return null
  }

  // Save the finished workout as soon as there is a signed-in user.
  // Guests finish first, then sign in from the summary screen.
  useEffect(() => {
    if (!user || !summary || summary.status !== 'pending') return
    setSummary(s => ({ ...s, status: 'saving' }))
    apiFetch('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary.payload),
    })
      .then(() => setSummary(s => (s ? { ...s, status: 'saved' } : s)))
      .catch(() => setSummary(s => (s ? { ...s, status: 'error' } : s)))
  }, [user, summary])

  const retrySave = () => setSummary(s => (s ? { ...s, status: 'pending' } : s))

  return (
    <SessionContext.Provider value={{
      unit, setUnit,
      draft, setDraft,
      expanded, setExpanded,
      restEnd, setRestEnd,
      summary, clearSummary: () => setSummary(null), retrySave,
      start, addExercise, discard, finish,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)