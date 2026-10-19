import { useEffect, useState } from 'react'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch, API_URL } from '../api'
import { formatMuscle } from '../utils/muscles'

export default function MyWorkouts() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [openId, setOpenId]     = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    apiFetch('/saved-workouts')
      .then(setWorkouts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  async function remove(id) {
    if (!confirm('Delete this workout?')) return
    try {
      const res = await fetch(`${API_URL}/saved-workouts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      setWorkouts(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-3 md:p-6">
      <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-4 md:mb-6" style={{ fontFamily: 'Bebas Neue' }}>
          My Workouts
        </h2>

        {!user && (
          <p className="text-sm uppercase tracking-widest text-white/20 text-center my-10">
            Sign in to see your saved workouts
          </p>
        )}

        {user && loading && <p className="text-xs uppercase tracking-widest text-white/20">Loading...</p>}
        {error && <p className="text-xs uppercase tracking-widest text-[#c0392b] mb-4">{error}</p>}

        {user && !loading && workouts.length === 0 && (
          <p className="text-sm uppercase tracking-widest text-white/20 text-center my-10">
            No saved workouts yet — build one in Workout Builder
          </p>
        )}

        <div className="flex flex-col gap-3">
          {workouts.map(w => {
            const open = openId === w.id
            const blocks = (w.blocks || []).filter(b => b?.muscle)
            return (
              <div key={w.id} className="border border-white/10">
                <div className="flex items-center justify-between gap-2 pl-4 pr-1 md:pr-2 py-3">
                  <button onClick={() => setOpenId(open ? null : w.id)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold uppercase tracking-widest text-white truncate">{w.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1 truncate">
                      <span className="text-[#c0392b]">{w.goal}</span>
                      {' · '}{new Date(w.created_at).toLocaleDateString()}
                      {' · '}{blocks.map(b => formatMuscle(b.muscle)).join(', ')}
                    </p>
                  </button>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => setOpenId(open ? null : w.id)}
                      className="text-white/40 hover:text-white p-2"
                      aria-label={open ? 'Collapse' : 'Expand'}
                    >
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => remove(w.id)} className="text-white/40 hover:text-[#c0392b] p-2" aria-label="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-white/10 px-4 py-4">
                    {w.preset && (
                      <p className="text-xs uppercase tracking-widest text-white/60 mb-4">
                        <span className="text-[#c0392b] font-bold">{w.preset.sets}</span> sets ·{' '}
                        <span className="text-[#c0392b] font-bold">{w.preset.reps}</span> reps ·{' '}
                        <span className="text-[#c0392b] font-bold">{w.preset.rest}</span> rest
                      </p>
                    )}
                    {blocks.map(b => (
                      <div key={b.muscle} className="mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-[#c0392b] font-bold mb-1">
                          {formatMuscle(b.muscle)}
                        </p>
                        {(b.exercises || []).map(ex => (
                          <p key={ex.id ?? ex.name} className="text-xs uppercase tracking-widest text-white/60 pl-2 py-0.5">
                            {ex.name}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}