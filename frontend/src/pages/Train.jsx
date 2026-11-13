import { useEffect, useState } from 'react'
import { ChevronRight, Sparkles, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSession } from '../context/SessionContext'
import { apiFetch } from '../api'
import SwipeRow from '../components/SwipeRow'

export default function Train({ onBuild, onSignIn }) {
  const { user } = useAuth()
  const { draft, start, setExpanded } = useSession()
  const [saved, setSaved]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!user) return setSaved([])
    setLoading(true)
    apiFetch('/saved-workouts')
      .then(setSaved)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  // Only one workout at a time: if one is running, reopen it instead.
  const guard = fn => () => (draft ? setExpanded(true) : fn())

  function startSaved(w) {
    const exercises = (w.blocks || [])
      .flatMap(b => b?.exercises || [])
      .map(e => ({ id: e.id, name: e.name, target: e.target }))
    start(w.name, exercises, {
      savedId: w.id,
      setCount: parseInt(w.preset?.sets) || 3,
      repsHint: w.preset?.reps ?? null,
    })
  }

  async function remove(id) {
    try {
      await apiFetch(`/saved-workouts/${id}`, { method: 'DELETE' })
      setSaved(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="px-4 pt-4 md:pt-8 max-w-xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-[34px] font-bold tracking-tight text-label">Train</h1>

        <button
          onClick={guard(() => start('', []))}
          className="h-[52px] rounded-xl bg-accent-fill text-on-accent text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-80"
        >
          <Plus size={20} strokeWidth={2.5} />
          {draft ? 'Resume workout' : 'Start empty workout'}
        </button>

        <button
          onClick={onBuild}
          className="h-[52px] rounded-xl bg-surface text-accent text-[17px] font-semibold flex items-center justify-center gap-2 active:bg-surface-2"
        >
          <Sparkles size={18} />
          Build a workout
        </button>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-[22px] font-bold tracking-tight text-label px-1">My workouts</h2>

        {error && <p className="text-[13px] text-danger px-1">{error}</p>}

        {!user && (
          <button
            onClick={onSignIn}
            className="w-full min-h-14 px-4 py-3 rounded-xl bg-surface flex items-center justify-between gap-3 text-left"
          >
            <span className="text-[15px] text-label-2">Sign in to save workouts and see them here</span>
            <ChevronRight size={18} className="text-label-3 shrink-0" />
          </button>
        )}

        {user && loading && <p className="text-[15px] text-label-3 px-1">Loading...</p>}

        {user && !loading && saved.length === 0 && (
          <p className="text-[15px] text-label-3 px-4 py-4 rounded-xl bg-surface">
            Nothing saved yet. Build a workout and save it.
          </p>
        )}

        {saved.length > 0 && (
          <div className="rounded-xl overflow-hidden bg-surface divide-y divide-separator">
            {saved.map(w => (
              <SwipeRow
                key={w.id}
                onDelete={() => remove(w.id)}
                confirmTitle="Delete workout?"
                confirmText={`${w.name} will be removed from My workouts.`}
              >
                <div className="flex items-center justify-between gap-3 pl-4 pr-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold text-label truncate">{w.name}</p>
                    <p className="text-[13px] text-label-2 mt-0.5">
                      {(w.blocks || []).reduce((n, b) => n + (b?.exercises?.length || 0), 0)} exercises · {w.goal}
                    </p>
                  </div>
                  <button
                    onClick={guard(() => startSaved(w))}
                    className="h-11 px-5 shrink-0 rounded-full bg-surface-2 text-accent text-[15px] font-semibold active:bg-surface-3"
                  >
                    Start
                  </button>
                </div>
              </SwipeRow>
            ))}
          </div>
        )}
        {saved.length > 0 && (
          <p className="text-[13px] text-label-3 px-4">Swipe left on a workout to delete it.</p>
        )}
      </section>
    </div>
  )
}