import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSession, fromKg, round1 } from '../context/SessionContext'
import { apiFetch } from '../api'
import SwipeRow from '../components/SwipeRow'

export default function History({ onSignIn }) {
  const { user } = useAuth()
  const { unit, summary } = useSession()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // reload when the user changes or a just-finished workout has been saved
  useEffect(() => {
    if (!user) return setHistory([])
    setLoading(true)
    apiFetch('/sessions')
      .then(setHistory)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, summary?.status])

  async function remove(id) {
    try {
      await apiFetch(`/sessions/${id}`, { method: 'DELETE' })
      setHistory(h => h.filter(x => x.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="px-4 pt-4 md:pt-8 max-w-xl mx-auto flex flex-col gap-3">
      <h1 className="text-[34px] font-bold tracking-tight text-label mb-1">History</h1>

      {error && <p className="text-[13px] text-danger px-1">{error}</p>}

      {!user && (
        <button
          onClick={onSignIn}
          className="w-full min-h-14 px-4 py-3 rounded-xl bg-surface flex items-center justify-between gap-3 text-left"
        >
          <span className="text-[15px] text-label-2">Sign in to see your past workouts</span>
          <ChevronRight size={18} className="text-label-3 shrink-0" />
        </button>
      )}

      {user && loading && <p className="text-[15px] text-label-3 px-1">Loading...</p>}

      {user && !loading && history.length === 0 && (
        <p className="text-[15px] text-label-3 px-4 py-4 rounded-xl bg-surface">
          No workouts yet. Your finished workouts show up here.
        </p>
      )}

      {history.map(s => (
        <HistoryItem key={s.id} summary={s} unit={unit} onDelete={() => remove(s.id)} />
      ))}
    </div>
  )
}

function HistoryItem({ summary, unit, onDelete }) {
  const [open, setOpen]     = useState(false)
  const [detail, setDetail] = useState(null)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && !detail) {
      try { setDetail(await apiFetch(`/sessions/${summary.id}`)) } catch { /* ignore */ }
    }
  }

  // group sets by exercise, keeping their order
  const groups = []
  for (const set of detail?.sets || []) {
    let g = groups.find(x => x.exercise_id === set.exercise_id)
    if (!g) groups.push(g = { exercise_id: set.exercise_id, name: set.exercise_name, sets: [] })
    g.sets.push(set)
  }

  const date = new Date(summary.performed_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="rounded-xl overflow-hidden bg-surface">
      <SwipeRow
        onDelete={onDelete}
        confirmTitle="Delete workout?"
        confirmText={`${summary.name} will be removed from your history.`}
      >
        <button onClick={toggle} className="w-full min-h-16 px-4 py-3 flex items-center justify-between gap-3 text-left">
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-label truncate">{summary.name}</p>
            <p className="text-[13px] text-label-2 mt-0.5">
              {date} · {summary.exercise_count} exercises · {summary.set_count} sets
            </p>
          </div>
          <ChevronDown
            size={20}
            className={`text-label-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </SwipeRow>

      {open && (
        <div className="border-t border-separator px-4 py-3">
          {!detail && <p className="text-[15px] text-label-3">Loading...</p>}
          {groups.map(g => (
            <div key={g.exercise_id} className="py-2">
              <p className="text-[15px] font-semibold text-accent mb-1">{g.name}</p>
              {g.sets.map(s => (
                <div key={s.id} className="flex gap-4 text-[15px] py-0.5">
                  <span className="w-5 text-label-3 tabular-nums">{s.set_number}</span>
                  <span className="text-label tabular-nums">
                    {s.weight_kg !== null ? `${round1(fromKg(parseFloat(s.weight_kg), unit))} ${unit} × ` : ''}
                    {s.reps}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}