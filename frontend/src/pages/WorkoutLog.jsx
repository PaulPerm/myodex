import { useEffect, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, X, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api'

const DRAFT_KEY = 'myodex.activeSession'
const UNIT_KEY  = 'myodex.unit'
const KG_PER_LB = 0.45359237

// ── helpers ─────────────────────────────────────────────────────────────

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

const toKg   = (val, unit) => (unit === 'kg' ? val : val * KG_PER_LB)
const fromKg = (kg, unit)  => (unit === 'kg' ? kg : kg / KG_PER_LB)
const round1 = n => String(Math.round(n * 10) / 10)

const emptySet = prev => ({ weight: prev?.weight ?? '', reps: '', rpe: '', note: '' })

// ── styles ──────────────────────────────────────────────────────────────

const card  = 'bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6'
const title = 'text-xl font-bold uppercase tracking-widest text-white'
const label = 'text-[10px] uppercase tracking-widest text-white/30 font-bold'
const input = 'w-full min-w-0 bg-white/5 border border-white/10 px-2 py-2 text-base md:text-xs tracking-widest text-white placeholder-white/20 outline-none focus:border-white/30'
const chip  = active =>
  `uppercase tracking-widest text-xs font-bold px-3 py-2 border transition-colors ${
    active
      ? 'bg-[#c0392b] text-white border-[#c0392b]'
      : 'bg-transparent text-white/30 border-white/10 hover:text-white/60'
  }`
const ghostBtn = 'uppercase tracking-widest text-xs font-bold px-3 py-2 border border-[#c0392b]/40 text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
const solidBtn = 'uppercase tracking-widest text-sm font-bold py-3 bg-[#c0392b] text-white hover:bg-[#a93226] transition-colors disabled:opacity-30 disabled:cursor-not-allowed'

// ── page ────────────────────────────────────────────────────────────────

export default function WorkoutLog() {
  const { user } = useAuth()
  const [unit, setUnit]       = useState(() => load(UNIT_KEY, 'lbs'))
  const [draft, setDraft]     = useState(() => load(DRAFT_KEY, null))
  const [saved, setSaved]     = useState([])
  const [history, setHistory] = useState([])
  const [error, setError]     = useState(null)

  useEffect(() => store(DRAFT_KEY, draft), [draft])
  useEffect(() => store(UNIT_KEY, unit), [unit])

  function refreshHistory() {
    apiFetch('/sessions').then(setHistory).catch(err => setError(err.message))
  }

  useEffect(() => {
    if (!user) return
    apiFetch('/saved-workouts').then(setSaved).catch(err => setError(err.message))
    refreshHistory()
  }, [user])

  function changeUnit(next) {
    if (next === unit) return
    // convert any weights already typed into the active session
    if (draft) {
      setDraft(d => ({
        ...d,
        exercises: d.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s =>
            s.weight === '' || isNaN(parseFloat(s.weight))
              ? s
              : { ...s, weight: round1(fromKg(toKg(parseFloat(s.weight), unit), next)) }
          ),
        })),
      }))
    }
    setUnit(next)
  }

  function startBlank() {
    setDraft({ name: '', saved_workout_id: null, notes: '', repsHint: null, exercises: [] })
  }

  function startFromSaved(w) {
    const setCount = parseInt(w.preset?.sets) || 3
    const exercises = (w.blocks || [])
      .flatMap(b => b?.exercises || [])
      .map(ex => ({
        exercise_id: ex.id,
        name: ex.name,
        sets: Array.from({ length: setCount }, () => emptySet()),
      }))
    setDraft({ name: w.name, saved_workout_id: w.id, notes: '', repsHint: w.preset?.reps ?? null, exercises })
  }

  if (!user) {
    return (
      <div className="p-3 md:p-6">
        <div className={`${card} max-w-3xl mx-auto`}>
          <h2 className={title} style={{ fontFamily: 'Bebas Neue' }}>Workout Log</h2>
          <p className="text-sm uppercase tracking-widest text-white/20 text-center my-10">
            Sign in to log workouts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto">
      {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

      {draft ? (
        <ActiveSession
          draft={draft}
          setDraft={setDraft}
          unit={unit}
          changeUnit={changeUnit}
          onFinished={() => { setDraft(null); refreshHistory() }}
        />
      ) : (
        <StartPanel saved={saved} onBlank={startBlank} onSaved={startFromSaved} />
      )}

      <History history={history} setHistory={setHistory} unit={unit} />
    </div>
  )
}

// ── start panel ─────────────────────────────────────────────────────────

function StartPanel({ saved, onBlank, onSaved }) {
  return (
    <div className={card}>
      <h2 className={`${title} mb-4`} style={{ fontFamily: 'Bebas Neue' }}>Start a Session</h2>

      <button onClick={onBlank} className={`${solidBtn} w-full mb-6`} style={{ fontFamily: 'Bebas Neue' }}>
        Start Blank Session
      </button>

      <p className={`${label} mb-2`}>Or start from a saved workout</p>
      {saved.length === 0 ? (
        <p className="text-xs uppercase tracking-widest text-white/20">No saved workouts yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {saved.map(w => (
            <div key={w.id} className="flex items-center justify-between gap-3 border border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-widest text-white truncate">{w.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                  {(w.blocks || []).reduce((n, b) => n + (b?.exercises?.length || 0), 0)} exercises · {w.goal}
                </p>
              </div>
              <button onClick={() => onSaved(w)} className={`${ghostBtn} shrink-0`}>Start</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── active session ──────────────────────────────────────────────────────

function ActiveSession({ draft, setDraft, unit, changeUnit, onFinished }) {
  const [picking, setPicking]   = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError]       = useState(null)

  const update = fn => setDraft(d => fn(structuredClone(d)))

  function setField(field, value) {
    update(d => { d[field] = value; return d })
  }

  function updateSet(ei, si, field, value) {
    update(d => { d.exercises[ei].sets[si][field] = value; return d })
  }

  function addSet(ei) {
    update(d => {
      const sets = d.exercises[ei].sets
      sets.push(emptySet(sets[sets.length - 1]))
      return d
    })
  }

  function removeSet(ei, si) {
    update(d => { d.exercises[ei].sets.splice(si, 1); return d })
  }

  function removeExercise(ei) {
    update(d => { d.exercises.splice(ei, 1); return d })
  }

  function addExercise(ex) {
    update(d => {
      d.exercises.push({ exercise_id: ex.id, name: ex.name, sets: [emptySet()] })
      return d
    })
    setPicking(false)
  }

  function discard() {
    if (confirm('Discard this session? Nothing will be saved.')) setDraft(null)
  }

  async function finish() {
    setError(null)

    const sets = []
    for (const ex of draft.exercises) {
      const done = ex.sets.filter(s => s.reps !== '' && !isNaN(parseInt(s.reps)))
      done.forEach((s, i) => {
        const w = parseFloat(s.weight)
        const rpe = parseFloat(s.rpe)
        sets.push({
          exercise_id: ex.exercise_id,
          set_number: i + 1,
          weight_kg: isNaN(w) ? null : Number(toKg(w, unit).toFixed(3)),
          reps: parseInt(s.reps),
          rpe: isNaN(rpe) ? null : rpe,
          note: s.note.trim() || null,
        })
      })
    }

    if (!draft.name.trim()) return setError('Give this session a name')
    if (sets.length === 0) return setError('Log reps on at least one set')
    if (sets.some(s => s.rpe !== null && (s.rpe < 1 || s.rpe > 10))) return setError('RPE must be between 1 and 10')

    setFinishing(true)
    try {
      await apiFetch('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          saved_workout_id: draft.saved_workout_id,
          notes: draft.notes.trim() || null,
          sets,
        }),
      })
      onFinished()
    } catch (err) {
      setError(typeof err.message === 'string' ? err.message : 'Could not save session')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={title} style={{ fontFamily: 'Bebas Neue' }}>Active Session</h2>
        <div className="flex">
          {['lbs', 'kg'].map(u => (
            <button key={u} onClick={() => changeUnit(u)} className={chip(unit === u)}>{u}</button>
          ))}
        </div>
      </div>

      <input
        value={draft.name}
        onChange={e => setField('name', e.target.value)}
        placeholder="Session name..."
        maxLength={100}
        className={`${input} px-4 mb-6 uppercase`}
      />

      {draft.exercises.length === 0 && (
        <p className="text-xs uppercase tracking-widest text-white/20 text-center my-6">
          No exercises yet — add one below
        </p>
      )}

      <div className="flex flex-col gap-6">
        {draft.exercises.map((ex, ei) => (
          <div key={`${ex.exercise_id}-${ei}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold uppercase tracking-widest text-white truncate">{ex.name}</p>
              <button
                onClick={() => removeExercise(ei)}
                className="text-white/30 hover:text-[#c0392b] p-1"
                aria-label="Remove exercise"
              >
                <X size={16} />
              </button>
            </div>

            {/* column headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 mb-1">
              <span className={label}>Set</span>
              <span className={label}>{unit}</span>
              <span className={label}>Reps</span>
              <span className={label}>RPE</span>
              <span />
            </div>

            {ex.sets.map((s, si) => (
              <div key={si} className="mb-2">
                <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center">
                  <span className="text-xs font-bold text-white/50 text-center">{si + 1}</span>
                  <input
                    className={input}
                    inputMode="decimal"
                    placeholder="—"
                    value={s.weight}
                    onChange={e => updateSet(ei, si, 'weight', e.target.value)}
                  />
                  <input
                    className={input}
                    inputMode="numeric"
                    placeholder={draft.repsHint || '—'}
                    value={s.reps}
                    onChange={e => updateSet(ei, si, 'reps', e.target.value)}
                  />
                  <input
                    className={input}
                    inputMode="decimal"
                    placeholder="—"
                    value={s.rpe}
                    onChange={e => updateSet(ei, si, 'rpe', e.target.value)}
                  />
                  <button
                    onClick={() => removeSet(ei, si)}
                    className="text-white/30 hover:text-[#c0392b] flex justify-center"
                    aria-label="Remove set"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  className={`${input} mt-1 ml-[2.5rem] w-[calc(100%-5rem)] text-sm md:text-[11px] py-1`}
                  placeholder="Note (optional)"
                  maxLength={200}
                  value={s.note}
                  onChange={e => updateSet(ei, si, 'note', e.target.value)}
                />
              </div>
            ))}

            <button
              onClick={() => addSet(ei)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/40 hover:text-white mt-1"
            >
              <Plus size={12} /> Add set
            </button>
          </div>
        ))}
      </div>

      {picking ? (
        <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />
      ) : (
        <button onClick={() => setPicking(true)} className={`${ghostBtn} w-full mt-6`}>
          + Add Exercise
        </button>
      )}

      <p className={`${label} mt-6 mb-2`}>Session notes</p>
      <textarea
        value={draft.notes}
        onChange={e => setField('notes', e.target.value)}
        placeholder="How did it go?"
        maxLength={2000}
        rows={3}
        className={`${input} px-4 resize-none`}
      />

      {error && <p className="text-xs uppercase tracking-widest text-[#c0392b] mt-4">{error}</p>}

      <div className="flex gap-2 mt-6">
        <button onClick={discard} className={`${chip(false)} flex-1`}>Discard</button>
        <button
          onClick={finish}
          disabled={finishing}
          className={`${solidBtn} flex-[2]`}
          style={{ fontFamily: 'Bebas Neue' }}
        >
          {finishing ? 'Saving...' : 'Finish Workout'}
        </button>
      </div>
    </div>
  )
}

// ── exercise picker ─────────────────────────────────────────────────────

function ExercisePicker({ onPick, onClose }) {
  const [all, setAll]     = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiFetch('/exercises').then(setAll).catch(() => setAll([]))
  }, [])

  const q = query.trim().toLowerCase()
  const results = (q ? all.filter(e => e.name.toLowerCase().includes(q)) : all).slice(0, 30)

  return (
    <div className="border border-white/10 mt-6 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Search size={14} className="text-white/30 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className={`${input} uppercase`}
        />
        <button onClick={onClose} className="text-white/40 hover:text-white p-1" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto flex flex-col">
        {results.map(e => (
          <button
            key={e.id}
            onClick={() => onPick(e)}
            className="text-left px-2 py-2 text-xs uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white border-b border-white/5"
          >
            {e.name}
            <span className="text-white/30"> · {e.category.replace('_', ' ')}</span>
          </button>
        ))}
        {all.length > 0 && results.length === 0 && (
          <p className="text-xs uppercase tracking-widest text-white/20 p-2">No matches</p>
        )}
      </div>
    </div>
  )
}

// ── history ─────────────────────────────────────────────────────────────

function History({ history, setHistory, unit }) {
  return (
    <div className={card}>
      <h2 className={`${title} mb-4`} style={{ fontFamily: 'Bebas Neue' }}>History</h2>
      {history.length === 0 ? (
        <p className="text-xs uppercase tracking-widest text-white/20 text-center my-6">
          No sessions logged yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map(s => (
            <HistoryItem
              key={s.id}
              summary={s}
              unit={unit}
              onDeleted={() => setHistory(h => h.filter(x => x.id !== s.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryItem({ summary, unit, onDeleted }) {
  const [open, setOpen]     = useState(false)
  const [detail, setDetail] = useState(null)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && !detail) {
      try { setDetail(await apiFetch(`/sessions/${summary.id}`)) } catch { /* ignore */ }
    }
  }

  async function remove() {
    if (!confirm('Delete this session?')) return
    try {
      await apiFetch(`/sessions/${summary.id}`, { method: 'DELETE' })
      onDeleted()
    } catch { /* ignore */ }
  }

  // group sets by exercise, preserving order
  const groups = []
  for (const set of detail?.sets || []) {
    let g = groups.find(x => x.exercise_id === set.exercise_id)
    if (!g) groups.push(g = { exercise_id: set.exercise_id, name: set.exercise_name, sets: [] })
    g.sets.push(set)
  }

  return (
    <div className="border border-white/10">
      <div className="flex items-center justify-between gap-2 pl-4 pr-1 py-3">
        <button onClick={toggle} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-white truncate">{summary.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
            {new Date(summary.performed_at).toLocaleDateString()} · {summary.exercise_count} exercises · {summary.set_count} sets
          </p>
        </button>
        <div className="flex items-center shrink-0">
          <button onClick={toggle} className="text-white/40 hover:text-white p-2" aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={remove} className="text-white/40 hover:text-[#c0392b] p-2" aria-label="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 py-4">
          {!detail && <p className="text-xs uppercase tracking-widest text-white/20">Loading...</p>}
          {groups.map(g => (
            <div key={g.exercise_id} className="mb-3">
              <p className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-1">{g.name}</p>
              {g.sets.map(s => (
                <p key={s.id} className="text-xs uppercase tracking-widest text-white/60 pl-2 py-0.5">
                  {s.set_number}.{' '}
                  {s.weight_kg !== null ? `${round1(fromKg(parseFloat(s.weight_kg), unit))} ${unit} × ` : ''}
                  {s.reps}
                  {s.rpe !== null && <span className="text-white/30"> @ RPE {parseFloat(s.rpe)}</span>}
                  {s.note && <span className="text-white/30 normal-case"> — {s.note}</span>}
                </p>
              ))}
            </div>
          ))}
          {detail?.notes && (
            <p className="text-xs text-white/40 mt-2 italic">{detail.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}