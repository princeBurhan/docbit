import React, { useState } from 'react';
import type { ReportSection } from '../types/report';
import { NAV_ITEMS, navItemState, type NavCounts } from './navItems';

interface Props {
  active: ReportSection;
  onChange: (section: ReportSection) => void;
  counts: NavCounts;
  onReset: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function SideNav({ active, onChange, counts, onReset, collapsed, onToggleCollapsed }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <nav
      className={[
        'hidden md:flex md:flex-col shrink-0 border-r border-ink-200 bg-white overflow-hidden transition-[width] duration-200 ease-out',
        collapsed ? 'w-11' : 'w-48'
      ].join(' ')}
    >
      {collapsed ? (
        <div className="flex flex-col items-center pt-2">
          <button
            onClick={onToggleCollapsed}
            title="Restore configuration"
            aria-label="Restore configuration"
            className="focus-ring h-8 w-8 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-100 hover:text-signal-600 transition-colors"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full w-48">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-600/50">Configure</span>
            <button
              onClick={onToggleCollapsed}
              title="Minimize"
              aria-label="Minimize configuration"
              className="focus-ring h-6 w-6 rounded-md flex items-center justify-center text-ink-600/60 hover:bg-paper-100 hover:text-signal-600 transition-colors"
            >
              <ChevronIcon direction="left" />
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto thin-scroll">
            {NAV_ITEMS.map((item) => {
              const state = navItemState(item.id, counts);
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onChange(item.id)}
                    className={[
                      'focus-ring w-full flex flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors relative',
                      isActive ? 'bg-signal-100/70' : 'hover:bg-paper-100'
                    ].join(' ')}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-signal-500" />}
                    <span className={['text-[13px] font-medium', isActive ? 'text-signal-600' : 'text-ink-800'].join(' ')}>
                      {item.label}
                    </span>
                    {state && (
                      <span className={['text-[11px] font-mono', isActive ? 'text-signal-600/70' : 'text-ink-600/50'].join(' ')}>
                        {state}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-ink-100 p-2.5 shrink-0">
            {confirming ? (
              <div className="rounded-md bg-rose-100 p-2 space-y-1.5">
                <p className="text-[11px] text-rose-500 leading-snug">Reset all filters, sorting, and edits?</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      onReset();
                      setConfirming(false);
                    }}
                    className="focus-ring flex-1 text-[11px] font-medium rounded bg-rose-500 text-white py-1 hover:bg-rose-600"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="focus-ring flex-1 text-[11px] font-medium rounded border border-ink-200 py-1 hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="focus-ring w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-ink-600/60 hover:text-rose-500 hover:bg-rose-100/60 transition-colors"
              >
                <ResetIcon />
                Reset configuration
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d={direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
