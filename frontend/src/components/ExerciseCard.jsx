import { Dumbbell, PersonStanding, Cog } from 'lucide-react'

const CATEGORY = {
  free_weight: { label: 'Free weight', Icon: Dumbbell },
  bodyweight:  { label: 'Bodyweight',  Icon: PersonStanding },
  machine:     { label: 'Machine',     Icon: Cog },
}

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : '')

export default function ExerciseCard({ exercise, onClick }) {
  const { label, Icon } = CATEGORY[exercise.category] ?? { label: exercise.category, Icon: Dumbbell }

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(exercise)}
      className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-surface text-left active:bg-surface-2 transition-colors"
    >
      <span className="w-10 h-10 shrink-0 rounded-full bg-surface-2 flex items-center justify-center text-accent">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-label leading-snug">{exercise.name}</span>
        <span className="block text-[13px] text-label-2 mt-0.5">
          {label} · {cap(exercise.difficulty)}
        </span>
      </span>
    </button>
  )
}