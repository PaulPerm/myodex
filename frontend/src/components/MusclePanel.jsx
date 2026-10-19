import Model from "react-body-highlighter";

export default function MusclePanel({ view, setView, data, handleMuscleClick, hint = "Click a muscle to see exercises" }) {
    return (
        <div className="flex flex-col items-center gap-3 w-full md:w-auto md:min-w-[260px]">
            <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#333] font-bold text-center">
                {hint}
            </p>

            {/* toggle */}
            <div className="flex overflow-hidden border border-[#1e1e1e] rounded-sm">
                <button
                    className={`uppercase tracking-widest text-xs font-bold px-5 py-2 ${view === 'anterior' ? 'bg-[#c0392b] text-[#e8e0d0]' : 'bg-[#111] text-[#444]'}`}
                    onClick={() => setView('anterior')}
                >Front</button>

                <button
                    className={`uppercase tracking-widest text-xs font-bold px-5 py-2 ${view === 'posterior' ? 'bg-[#c0392b] text-[#e8e0d0]' : 'bg-[#111] text-[#444]'}`}
                    onClick={() => setView('posterior')}
                >Back</button>
            </div>

            {/* body map */}
            <div className="w-full max-w-[220px] md:max-w-[300px]">
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