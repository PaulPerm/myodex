import Model from "react-body-highlighter";

export default function MusclePanel({ view, setView, data, activeMuscle, muscleLabel, handleMuscleClick }) 
{
    return(
        <div className="flex flex-col items-center gap-4">
            <div>
                <p className="text-xs uppercase tracking-widest text-[#333] font-bold">
                    Click a muscle to see an exercise
                </p>

                {/* toggle */}
                <div className="flex overflow-hidden border border-[#1e1e1e] rounded-sm">
                    <button
                        className={`uppercase tracking-widest text-xs font-bold px-4 py-2 ${view === 'anterior' ? 'bg-[#c0392b] text-[#e8e0d0]' : 'bg-[#111] text-[#444]'}`}
                        onClick={() => setView('anterior')}
                    >Front</button>

                    <button
                        className={`uppercase tracking-widest text-xs font-bold px-4 py-2 ${view === 'posterior' ? 'bg-[#c0392b] text-[#e8e0d0]' : 'bg-[#111] text-[#444]'}`}
                        onClick={() => setView('posterior')}
                    >Back</button>
                </div>

                {/* body map */}
                <Model
                    type={view}
                    data={data}
                    onClick={handleMuscleClick}
                    highlightedColors={['#c0392b', '#2a0d0a']}
                    style={{ width: '100%' }}
                />
            </div>
            

        </div>
    )
}