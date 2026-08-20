import React, { useCallback, useRef, useState } from 'react';

interface Props {
  onOpen: () => void;
  badge?: number;
}

const BASE_BOTTOM = 16; // px, added to the safe-area inset
const TOP_MARGIN = 120; // px reserved near the top (header + breathing room)
const FAB_HEIGHT = 48; // px

/**
 * A capsule-shaped floating button with two curved end handles. The center
 * zone is tap-only (opens the report builder). Each end handle is drag-only
 * (repositions the button vertically along the right edge) — dragging never
 * opens the sheet, and tapping never moves the button.
 */
export function ConfigureFab({ onOpen, badge }: Props) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const maxOffset = useRef(0);

  const beginDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartY.current = e.clientY;
    dragStartOffset.current = dragOffset;
    maxOffset.current = Math.max(0, window.innerHeight - TOP_MARGIN - FAB_HEIGHT - BASE_BOTTOM);
    setIsDragging(true);
  }, [dragOffset]);

  const moveDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = dragStartY.current - e.clientY; // moving up = positive
    const next = Math.min(maxOffset.current, Math.max(0, dragStartOffset.current + delta));
    setDragOffset(next);
  }, [isDragging]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  }, []);

  return (
    <div
      className="fixed z-40 flex items-stretch h-12 rounded-full bg-ink-900 shadow-panel select-none"
      style={{
        right: 'calc(var(--safe-right) + 16px)',
        bottom: `calc(var(--safe-bottom) + ${BASE_BOTTOM}px + ${dragOffset}px)`,
        transition: isDragging ? 'none' : 'bottom 0.18s cubic-bezier(0.16,1,0.3,1)'
      }}
    >
      {/* Left curved handle — drag only */}
      <Handle side="left" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />

      {/* Center — tap only, opens the report builder */}
      <button
        onClick={onOpen}
        aria-label="Open report builder"
        className="focus-ring relative flex items-center gap-2 px-3 text-white active:opacity-80 transition-opacity"
        style={{ touchAction: 'manipulation' }}
      >
        <BuilderIcon />
        <span className="text-sm font-medium whitespace-nowrap">Build report</span>
        {!!badge && badge > 0 && (
          <span
            className="pointer-events-none absolute -top-1.5 -right-1 h-5 min-w-5 px-1 rounded-full bg-signal-500 text-[11px] font-semibold flex items-center justify-center border-2 border-ink-900"
          >
            {badge}
          </span>
        )}
      </button>

      {/* Right curved handle — drag only */}
      <Handle side="right" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />
    </div>
  );
}

interface HandleProps {
  side: 'left' | 'right';
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
}

function Handle({ side, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: HandleProps) {
  return (
    <div
      role="button"
      aria-label="Drag to move"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={[
        'flex items-center justify-center w-6 shrink-0 cursor-grab active:cursor-grabbing bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.16] transition-colors',
        side === 'left' ? 'rounded-l-full' : 'rounded-r-full'
      ].join(' ')}
      style={{ touchAction: 'none' }}
    >
      <span className="flex flex-col gap-[3px]" aria-hidden>
        <span className="h-[3px] w-[3px] rounded-full bg-white/50" />
        <span className="h-[3px] w-[3px] rounded-full bg-white/50" />
        <span className="h-[3px] w-[3px] rounded-full bg-white/50" />
      </span>
    </div>
  );
}

function BuilderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" />
    </svg>
  );
}
