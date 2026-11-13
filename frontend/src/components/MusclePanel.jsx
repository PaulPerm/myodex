import Model from "react-body-highlighter";
import { useTheme } from "../context/ThemeContext";

const segment = active =>
  `flex-1 h-9 rounded-[7px] text-[13px] font-semibold transition-colors ${
    active ? 'bg-surface-3 text-label shadow-sm' : 'text-label-2'
  }`

export default function MusclePanel({ view, setView, data, handleMuscleClick, hint = "Tap a muscle to see exercises" }) {
  const { mapColors } = useTheme()
  return (
    <div className="flex flex-col items-center gap-3 w-full md:w-auto md:min-w-[260px]">
      {/* Front / Back segmented control */}
      <div className="flex w-full max-w-[220px] p-0.5 rounded-[9px] bg-surface-2">
        <button className={segment(view === 'anterior')} onClick={() => setView('anterior')}>Front</button>
        <button className={segment(view === 'posterior')} onClick={() => setView('posterior')}>Back</button>
      </div>

      <div className="w-full max-w-[220px] md:max-w-[280px]">
        <Model
          type={view}
          data={data}
          onClick={handleMuscleClick}
          bodyColor={mapColors.body}
          highlightedColors={mapColors.highlight}
          style={{ width: '100%' }}
        />
      </div>

      <p className="text-[13px] text-label-3 text-center">{hint}</p>
    </div>
  )
}