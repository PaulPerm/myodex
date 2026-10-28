import Model from "react-body-highlighter";

const toggle = active =>
    `uppercase tracking-[0.1em] text-[12px] px-5 py-2 border ${
        active
            ? 'bg-paper text-ink font-semibold border-paper'
            : 'bg-transparent text-text-2 font-semibold border-rule-strong'
    }`

export default function MusclePanel({ view, setView, data, handleMuscleClick, hint = "Click a muscle to see exercises" }) {
    return (
        <div className="flex flex-col items-center gap-3 w-full md:w-auto md:min-w-[260px]">
            <p className="text-[13px] text-text-3 text-center">
                {hint}
            </p>

            {/* toggle */}
            <div className="flex">
                <button className={toggle(view === 'anterior')} onClick={() => setView('anterior')}>Front</button>
                <button className={toggle(view === 'posterior')} onClick={() => setView('posterior')}>Back</button>
            </div>

            {/* body map — unchanged per style guide §6 */}
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