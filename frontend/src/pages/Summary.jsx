import Model from 'react-body-highlighter'
import { useSession, fromKg } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { formatMuscle, toMapMuscles } from '../utils/muscles'

export default function Summary({ onSignIn, onDone }) {
  const { summary, unit, retrySave } = useSession()
  const { user } = useAuth()

  const lifted = Math.round(fromKg(summary.volumeKg, unit)).toLocaleString()
  const stats = [
    { value: `${summary.mins} min`, label: 'Duration' },
    { value: summary.setCount,      label: 'Sets done' },
    { value: `${lifted} ${unit}`,   label: 'Total lifted' },
    { value: summary.prs,           label: 'Personal records' },
  ]
  const mapData = summary.muscles.length
    ? [{ name: 'Trained', muscles: toMapMuscles(summary.muscles) }]
    : []

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d] text-[#e8e0d0]">
      <div className="flex flex-col h-full max-w-xl mx-auto">
        <main className="flex-1 overflow-y-auto px-4 pt-10 pb-4 flex flex-col gap-6">

          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Workout complete</p>
            <h1 className="text-5xl leading-none tracking-widest text-white mt-1" style={{ fontFamily: 'Bebas Neue' }}>
              {summary.name}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {stats.map(s => (
              <div key={s.label} className="p-4 bg-[#161514] border border-white/10">
                <p className="text-4xl leading-none text-white" style={{ fontFamily: 'Bebas Neue' }}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3">Muscles trained</p>
            <div className="flex justify-center gap-4">
              <div className="w-1/2 max-w-[160px]">
                <Model type="anterior" data={mapData} highlightedColors={['#c0392b']} style={{ width: '100%' }} />
              </div>
              <div className="w-1/2 max-w-[160px]">
                <Model type="posterior" data={mapData} highlightedColors={['#c0392b']} style={{ width: '100%' }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {summary.muscles.map(m => (
                <span key={m} className="px-3 py-2 bg-[#c0392b] text-white text-xs font-bold uppercase tracking-widest">
                  {formatMuscle(m)}
                </span>
              ))}
            </div>
          </div>

          {!user && (
            <div className="p-4 border border-white/40 flex flex-col gap-3">
              <p className="text-sm text-white/80">Sign in to keep this workout in your history.</p>
              <button
                onClick={onSignIn}
                className="h-12 bg-[#e8e0d0] text-black text-lg tracking-widest"
                style={{ fontFamily: 'Bebas Neue' }}
              >
                Sign in to save
              </button>
            </div>
          )}
          {user && summary.status === 'saving' && <p className="text-xs uppercase tracking-widest text-white/50">Saving...</p>}
          {user && summary.status === 'saved' && <p className="text-xs uppercase tracking-widest text-white/50">Saved to your history</p>}
          {user && summary.status === 'error' && (
            <button onClick={retrySave} className="h-12 border border-[#c0392b] text-white text-xs font-bold uppercase tracking-widest">
              Could not save. Tap to try again
            </button>
          )}
        </main>

        <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/10 shrink-0">
          <button
            onClick={onDone}
            className="w-full h-14 bg-[#c0392b] text-white text-2xl tracking-widest"
            style={{ fontFamily: 'Bebas Neue' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}