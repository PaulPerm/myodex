
const DIFFICULTY_COLOR = {
  beginner:     '#22c55e',
  intermediate: '#f59e0b',
  advanced:     '#ef4444',
}

export default function ExerciseCard({ exercise, onClick }){
    return (
        <div 
         onClick={() => onClick && onClick(exercise)}
         className="flex justify-between items-center px-4 py-3 border border-[#c0392b]/40 rounded-none mb-2 bg-black/20 hover:border-[#c0392b] hover:bg-[#c0392b]/5 transition-colors cursor-pointer"
        >
            <div>
                <p className="uppercase font-bold tracking-wide text-[#d4ccc0] text-sm mb-1">{exercise.name}</p>
                <p className="uppercase text-[#3a3836] text-xs tracking-widest">
                {exercise.category.replace('_', ' ')}
                </p>
            </div>
            <span style={{
                background: DIFFICULTY_COLOR[exercise.difficulty] + '22',
                color: DIFFICULTY_COLOR[exercise.difficulty],
                }} 
                className="uppercase text-[10px] font-bold px-2 py-1 rounded-sm tracking-wide">
                {exercise.difficulty}
            </span>
        </div>
    )
}
