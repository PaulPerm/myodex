import { useRef, useState } from 'react'

const WIDTH = 88 // px of the revealed Delete button

export function ConfirmDialog({ title, text, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xs bg-[#111] border border-white/10 p-5"
      >
        <h3 className="text-xl tracking-widest text-white" style={{ fontFamily: 'Bebas Neue' }}>{title}</h3>
        {text && <p className="text-sm text-white/60 mt-2">{text}</p>}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 h-12 border border-white/20 text-white/70 text-xs font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 bg-[#c0392b] text-white text-xs font-bold uppercase tracking-widest"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Swipe left to reveal Delete. Tapping Delete asks for confirmation first.
export default function SwipeRow({ children, onDelete, confirmTitle = 'Delete this?', confirmText, bg = 'bg-[#0f0f0f]', className = '' }) {
  const [dx, setDx]                 = useState(0)
  const [dragging, setDragging]     = useState(false)
  const [confirming, setConfirming] = useState(false)
  const gesture = useRef(null)
  const moved   = useRef(false)

  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesture.current = { x: e.clientX, y: e.clientY, base: dx, axis: null }
    moved.current = false
  }

  function move(e) {
    const g = gesture.current
    if (!g) return
    const ddx = e.clientX - g.x
    const ddy = e.clientY - g.y
    if (!g.axis) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return
      g.axis = Math.abs(ddx) > Math.abs(ddy) ? 'x' : 'y'
      if (g.axis === 'x') {
        moved.current = true
        setDragging(true)
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
    }
    if (g.axis === 'x') setDx(Math.max(-WIDTH - 24, Math.min(0, g.base + ddx)))
  }

  function up() {
    const g = gesture.current
    gesture.current = null
    if (g?.axis === 'x') {
      setDragging(false)
      setDx(dx < -WIDTH / 2 ? -WIDTH : 0)
    }
  }

  // A drag should not also count as a tap; a tap on an open row just closes it.
  function clickCapture(e) {
    if (moved.current || dx !== 0) {
      e.stopPropagation()
      e.preventDefault()
      moved.current = false
      if (!dragging) setDx(0)
    }
  }

  const open = dx !== 0

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <button
        onClick={() => setConfirming(true)}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        style={{ width: WIDTH }}
        className="absolute inset-y-0 right-0 bg-[#c0392b] text-white text-xs font-bold uppercase tracking-widest"
      >
        Delete
      </button>

      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={clickCapture}
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? 'none' : 'transform 160ms ease-out',
          touchAction: 'pan-y',
        }}
        className={`relative ${bg}`}
      >
        {children}
      </div>

      {confirming && (
        <ConfirmDialog
          title={confirmTitle}
          text={confirmText}
          onCancel={() => { setConfirming(false); setDx(0) }}
          onConfirm={() => { setConfirming(false); setDx(0); onDelete() }}
        />
      )}
    </div>
  )
}