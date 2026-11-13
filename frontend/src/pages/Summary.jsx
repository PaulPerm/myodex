import Model from 'react-body-highlighter'
import { Check } from 'lucide-react'
import { useSession, fromKg } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { formatMuscle, toMapMuscles } from '../utils/muscles'

export default function Summary({ onSignIn, onDone }) {
  const { summary, unit, retrySave } = useSession()
  const { user } = useAuth()
  const { mapColors } = useTheme()

  const lifted = Math.round(fromKg(summary.volumeKg, unit)).toLocaleString()
  const stats = [
    { value: summary.mins,     unit: 'min', label: 'Duration' },
    { value: summary.setCount, unit: '',    label: 'Sets' },
    { value: lifted,           unit: unit,  label: 'Total lifted' },
    { value: summary.prs,      unit: '',    label: 'Personal records' },
  ]
  const mapData = summary.muscles.length
    ? [{ name: 'Trained', muscles: toMapMuscles(summary.muscles) }]
    : []

  return (
    <div className="fixed inset-0 z-50 bg-bg text-label">
      <div className="flex flex-col h-full max-w-xl mx-auto">
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-12 pb-4 flex flex-col gap-6">

          <div className="flex flex-col items-center text-center gap-3">
            <span className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-on-success">
              <Check size={34} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[15px] text-label-2">Workout complete</p>
              <h1 className="text-[28px] font-bold tracking-tight text-label">{summary.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {stats.map(s => (
              <div key={s.label} className="px-4 py-3 rounded-xl bg-surface">
                <p className="text-[28px] font-bold tracking-tight text-label tabular-nums leading-tight">
                  {s.value}
                  {s.unit && <span className="text-[17px] font-semibold text-label-2"> {s.unit}</span>}
                </p>
                <p className="text-[13px] text-label-2">{s.label}</p>
              </div>
            ))}
          </div>

          <section className="rounded-xl bg-surface p-4">
            <h2 className="text-[17px] font-semibold text-label mb-3">Muscles trained</h2>
            <div className="flex justify-center gap-4">
              <div className="w-1/2 max-w-[150px]">
                <Model type="anterior" data={mapData} bodyColor={mapColors.body} highlightedColors={mapColors.highlight} style={{ width: '100%' }} />
              </div>
              <div className="w-1/2 max-w-[150px]">
                <Model type="posterior" data={mapData} bodyColor={mapColors.body} highlightedColors={mapColors.highlight} style={{ width: '100%' }} />
              </div>
            </div>
            {summary.muscles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {summary.muscles.map(m => (
                  <span key={m} className="px-3 py-1.5 rounded-full bg-accent/15 text-accent text-[13px] font-semibold">
                    {formatMuscle(m)}
                  </span>
                ))}
              </div>
            )}
          </section>

          {!user && (
            <div className="rounded-xl bg-surface p-4 flex flex-col gap-3">
              <p className="text-[15px] text-label-2">Sign in to keep this workout in your history.</p>
              <button onClick={onSignIn} className="h-[50px] rounded-xl bg-surface-2 text-accent text-[17px] font-semibold">
                Sign in to save
              </button>
            </div>
          )}
          {user && summary.status === 'saving' && <p className="text-[13px] text-label-3 text-center">Saving...</p>}
          {user && summary.status === 'saved' && <p className="text-[13px] text-label-3 text-center">Saved to your history</p>}
          {user && summary.status === 'error' && (
            <button onClick={retrySave} className="h-12 rounded-xl bg-surface text-danger text-[15px] font-semibold">
              Could not save. Tap to try again
            </button>
          )}
        </main>

        <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
          <button
            onClick={onDone}
            className="w-full h-[52px] rounded-xl bg-accent-fill text-on-accent text-[17px] font-semibold active:opacity-80"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}