import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
    <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col gap-3">
      <h2 className="text-4xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>History</h2>

      {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

      {!user && (
        <button
          onClick={onSignIn}
          className="h-14 px-4 text-left text-sm text-white/60 bg-black/80 border border-white/10"
        >
          Sign in to see your past workouts
        </button>
      )}

      {user && loading && <p className="text-xs uppercase tracking-widest text-white/40">Loading...</p>}

      {user && !loading && history.length === 0 && (
        <p className="text-sm text-white/40 p-4 bg-black/80 border border-white/10">
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

  return (
    <div className="border border-white/10">
      <SwipeRow
        onDelete={onDelete}
        confirmTitle="Delete workout?"
        confirmText={`${summary.name} will be removed from your history.`}
      >
        <button onClick={toggle} className="w-full min-h-16 px-4 py-3 flex items-center justify-between gap-3 text-left">
          <div className="min-w-0">
            <p className="text-lg font-bold uppercase tracking-widest text-white truncate">{summary.name}</p>
            <p className="text-xs text-white/50 mt-0.5">
              {new Date(summary.performed_at).toLocaleDateString()} · {summary.exercise_count} exercises · {summary.set_count} sets
            </p>
          </div>
          {open ? <ChevronUp size={20} className="text-white/50 shrink-0" /> : <ChevronDown size={20} className="text-white/50 shrink-0" />}
        </button>
      </SwipeRow>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 bg-[#0f0f0f]">
          {!detail && <p className="text-xs uppercase tracking-widest text-white/40">Loading...</p>}
          {groups.map(g => (
            <div key={g.exercise_id} className="mb-3">
              <p className="text-xs uppercase tracking-widest text-white font-bold mb-1">{g.name}</p>
              {g.sets.map(s => (
                <p key={s.id} className="text-sm text-white/60 pl-2 py-0.5">
                  {s.set_number}.{' '}
                  {s.weight_kg !== null ? `${round1(fromKg(parseFloat(s.weight_kg), unit))} ${unit} x ` : ''}
                  {s.reps}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}