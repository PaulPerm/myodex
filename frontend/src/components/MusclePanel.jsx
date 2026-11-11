import Model from "react-body-highlighter";

const toggle = active =>
    `uppercase tracking-[0.1em] text-[12px] px-5 py-2 border ${
        active
            ? 'bg-paper text-ink font-semibold border-paper'
            : 'bg-transparent text-text-2 font-semibold border-rule-strong'
    }`

// Nudge the ASCII art to line up with the clickable SVG underneath.
// Tweak these if a view looks off (percent of the figure box).
const ALIGN = {
    anterior:  { x: 0, y: 0, scale: 1 },
    posterior: { x: 0, y: 0, scale: 1 },
}

export default function MusclePanel({ view, setView, data, handleMuscleClick, hint = "Click a muscle to see exercises" }) {
    const a = ALIGN[view]

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

            {/* body map: ASCII art underneath, invisible clickable SVG on top */}
            <div className="relative w-full max-w-[220px] md:max-w-[300px]">
                <img
                    src={view === 'anterior' ? '/body-front.png' : '/body-back.png'}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    style={{ transform: `translate(${a.x}%, ${a.y}%) scale(${a.scale})` }}
                />
                <Model
                    type={view}
                    data={data}
                    onClick={handleMuscleClick}
                    bodyColor="transparent"
                    highlightedColors={['#c6f13599', '#c6f135cc']}
                    style={{ width: '100%', position: 'relative' }}
                />
            </div>
        </div>
    )
}