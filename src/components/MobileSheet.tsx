import React, { useEffect, useRef, useState } from 'react';
import type { ReportSection } from '../types/report';
import { NAV_ITEMS, navItemState, type NavCounts } from './navItems';
import { ConfigureFab } from './ConfigureFab';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when the FAB's center is tapped — always opens into the full options list. */
  onOpenList: () => void;
  /** Whether this particular "open" should land on the options list (true) or straight on `active`'s detail (false). */
  startInList: boolean;
  active: ReportSection;
  onChangeSection: (section: ReportSection) => void;
  counts: NavCounts;
  /** The currently active section's panel content. */
  children: React.ReactNode;
  fabBadge?: number;
  onReset: () => void;
}

export function MobileSheet({
  open,
  onClose,
  onOpenList,
  startInList,
  active,
  onChangeSection,
  counts,
  children,
  fabBadge,
  onReset
}: Props) {
  const [dragY, setDragY] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [showList, setShowList] = useState(startInList);
  const dragStart = useRef<number | null>(null);

  // Every time the sheet opens, land on whichever view the caller asked for
  // (the full list from the FAB, or straight into a specific section's
  // controls when opened from elsewhere, e.g. the header's Export button).
  useEffect(() => {
    if (open) setShowList(startInList);
  }, [open, startInList]);

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const delta = e.touches[0].clientY - dragStart.current;
    if (delta > 0) setDragY(delta);
  };
  const onHandleTouchEnd = () => {
    if (dragY > 70) close();
    else setDragY(0);
    dragStart.current = null;
  };

  const close = () => {
    setDragY(0);
    onClose();
  };

  // The back control is a single, predictable control: it pops one level.
  // From a section's controls, that means returning to the full options
  // list (never closing the sheet outright); from the list itself, it
  // closes the sheet back to the report.
  const handleBack = () => {
    if (showList) close();
    else setShowList(true);
  };

  const selectSection = (id: ReportSection) => {
    onChangeSection(id);
    setShowList(false);
  };

  const currentItem = NAV_ITEMS.find((n) => n.id === active);
  const currentState = navItemState(active, counts);

  return (
    <div className="md:hidden">
      {/* Floating action button — plain tap on the center opens the full
          options list; dragging is only possible from the curved end handles. */}
      {!open && <ConfigureFab onOpen={onOpenList} badge={fabBadge} />}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-ink-950/40 animate-fade-in" onClick={close} aria-hidden />}

      {/* Sheet */}
      {open && (
        <div
          role="dialog"
          aria-label="Report builder"
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[20px] bg-white shadow-panel animate-sheet-up"
          style={{
            height: '75vh',
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: dragY ? 'none' : 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
            paddingBottom: 'var(--safe-bottom)'
          }}
        >
          {/* Drag handle — touch gestures are scoped to just this small strip so
              scrolling or tapping inside the panel content below never gets
              mistaken for a dismiss-drag. */}
          <div
            className="flex flex-col items-center pt-2.5 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onTouchStart={onHandleTouchStart}
            onTouchMove={onHandleTouchMove}
            onTouchEnd={onHandleTouchEnd}
          >
            <span className="h-1 w-9 rounded-full bg-ink-200" />
          </div>

          <div className="flex items-center justify-between px-3 pb-1 shrink-0">
            <button
              onClick={handleBack}
              className="focus-ring flex items-center gap-1 text-sm font-medium text-ink-700 px-2 py-1.5 rounded-md active:bg-paper-100"
              style={{ touchAction: 'manipulation' }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {showList ? 'Back' : 'Options'}
            </button>

            {confirmingReset ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onReset();
                    setConfirmingReset(false);
                  }}
                  className="focus-ring text-xs font-medium rounded-md bg-rose-500 text-white px-2.5 py-1.5"
                >
                  Confirm reset
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="focus-ring text-xs font-medium rounded-md border border-ink-200 px-2.5 py-1.5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingReset(true)}
                className="focus-ring flex items-center gap-1 text-xs font-medium text-ink-600/60 px-2 py-1.5 rounded-md active:bg-rose-100/60 active:text-rose-500"
                style={{ touchAction: 'manipulation' }}
              >
                <ResetIcon />
                Reset
              </button>
            )}
          </div>

          {showList ? (
            <div className="flex-1 overflow-y-auto thin-scroll" style={{ touchAction: 'pan-y' }}>
              <p className="px-4 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600/50">
                Configure report
              </p>
              <ul className="divide-y divide-ink-100 border-t border-ink-100">
                {NAV_ITEMS.map((item) => {
                  const state = navItemState(item.id, counts);
                  const isCurrent = active === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => selectSection(item.id)}
                        className={[
                          'relative w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors focus-ring',
                          isCurrent ? 'bg-signal-100/50' : 'active:bg-paper-100'
                        ].join(' ')}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {isCurrent && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-signal-500" />}
                        <span className={['text-[15px] font-medium', isCurrent ? 'text-signal-600' : 'text-ink-900'].join(' ')}>
                          {item.label}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          {state && <span className="text-xs font-mono text-ink-600/50">{state}</span>}
                          <ChevronRightIcon />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto thin-scroll" style={{ touchAction: 'pan-y' }}>
              <div className="px-4 pt-1 pb-3">
                <h2 className="text-base font-semibold text-ink-900">{currentItem?.label ?? 'Configure'}</h2>
                {currentState && <p className="text-xs text-ink-600/50 font-mono mt-0.5">{currentState}</p>}
              </div>
              <div className="px-4 pb-4">{children}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-ink-300 shrink-0">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
