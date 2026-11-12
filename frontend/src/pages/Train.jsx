import { useEffect, useState } from 'react'
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
    <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-4xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>Train</h2>
        <button
          onClick={guard(() => start('', []))}
          className="h-16 bg-[#c0392b] text-white text-2xl tracking-widest hover:bg-[#a93226] transition-colors"
          style={{ fontFamily: 'Bebas Neue' }}
        >
          {draft ? 'Resume workout' : 'Start empty workout'}
        </button>
        <button
          onClick={onBuild}
          className="h-14 border border-white/60 text-white text-xl tracking-widest bg-black/60 hover:bg-white/5 transition-colors"
          style={{ fontFamily: 'Bebas Neue' }}
        >
          Build a workout
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-widest text-white/50 font-bold">My workouts</h3>

        {error && <p className="text-xs uppercase tracking-widest text-[#c0392b]">{error}</p>}

        {!user && (
          <button
            onClick={onSignIn}
            className="h-14 px-4 text-left text-sm text-white/60 bg-black/80 border border-white/10"
          >
            Sign in to save workouts and see them here
          </button>
        )}

        {user && loading && <p className="text-xs uppercase tracking-widest text-white/40">Loading...</p>}

        {user && !loading && saved.length === 0 && (
          <p className="text-sm text-white/40 p-4 bg-black/80 border border-white/10">
            Nothing saved yet. Build a workout and save it.
          </p>
        )}

        {saved.map(w => (
          <SwipeRow
            key={w.id}
            onDelete={() => remove(w.id)}
            confirmTitle="Delete workout?"
            confirmText={`${w.name} will be removed from My workouts.`}
            className="border border-white/10"
          >
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-lg font-bold uppercase tracking-widest text-white truncate">{w.name}</p>
                <p className="text-xs text-white/50 mt-0.5">
                  {(w.blocks || []).reduce((n, b) => n + (b?.exercises?.length || 0), 0)} exercises · {w.goal}
                </p>
              </div>
              <button
                onClick={guard(() => startSaved(w))}
                className="h-11 px-5 shrink-0 bg-[#c0392b] text-white text-lg tracking-widest"
                style={{ fontFamily: 'Bebas Neue' }}
              >
                Start
              </button>
            </div>
          </SwipeRow>
        ))}
      </div>
    </div>
  )
}