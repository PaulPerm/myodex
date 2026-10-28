import { Dumbbell, PersonStanding, Cog } from 'lucide-react'

const CATEGORY = {
  free_weight: { label: 'Free Weight', Icon: Dumbbell },
  bodyweight:  { label: 'Bodyweight',  Icon: PersonStanding },
  machine:     { label: 'Machine',     Icon: Cog },
}

export default function ExerciseCard({ exercise, onClick }) {
  const { label, Icon } = CATEGORY[exercise.category] ?? { label: exercise.category, Icon: Dumbbell }

  return (
    <div
      onClick={() => onClick && onClick(exercise)}
      className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 px-4 md:px-5 py-4 mb-2 border border-rule hover:border-rule-input transition-colors cursor-pointer"
    >
      <p className="text-[14px] font-medium uppercase tracking-[0.03em] text-paper leading-tight">
        {exercise.name}
      </p>

      <div className="flex gap-2 shrink-0">
        <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-[0.06em] text-text-3 border border-rule-input px-2 py-1">
          <Icon size={12} /> {label}
        </span>
        <span className="uppercase text-[11px] tracking-[0.06em] text-paper border border-rule-input px-2 py-1">
          {exercise.difficulty}
        </span>
      </div>
    </div>
  )
}