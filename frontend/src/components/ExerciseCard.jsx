import { Dumbbell, PersonStanding, Cog } from 'lucide-react'

const DIFFICULTY_COLOR = {
  beginner:     '#22c55e',
  intermediate: '#f59e0b',
  advanced:     '#ef4444',
}

const CATEGORY = {
  free_weight: { label: 'Free Weight', Icon: Dumbbell },
  bodyweight:  { label: 'Bodyweight',  Icon: PersonStanding },
  machine:     { label: 'Machine',     Icon: Cog },
}

export default function ExerciseCard({ exercise, onClick }) {
  const { label, Icon } = CATEGORY[exercise.category] ?? { label: exercise.category, Icon: Dumbbell }
  const color = DIFFICULTY_COLOR[exercise.difficulty]

  return (
    <div
      onClick={() => onClick && onClick(exercise)}
      className="flex justify-between items-center gap-4 px-5 py-4 mb-2 border border-[#c0392b]/40 border-l-[3px] border-l-[#c0392b] bg-black/20 hover:border-[#c0392b] hover:bg-[#c0392b]/5 transition-colors cursor-pointer"
    >
      <p className="text-xl tracking-wider text-white leading-none" style={{ fontFamily: 'Bebas Neue' }}>
        {exercise.name}
      </p>

      <div className="flex gap-2 shrink-0">
        <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-widest text-white/75 border border-white/25 px-2.5 py-1">
          <Icon size={13} /> {label}
        </span>
        <span
          style={{ color, borderColor: color + '99', background: color + '1a' }}
          className="uppercase text-[11px] font-bold tracking-widest border px-2.5 py-1"
        >
          {exercise.difficulty}
        </span>
      </div>
    </div>
  )
}