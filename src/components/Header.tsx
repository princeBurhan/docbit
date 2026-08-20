import React from 'react';
import { Link, useRouter } from '../router/router';

interface Props {
  /** When set, the wordmark becomes a "start over" action instead of a plain link. */
  onWordmarkClick?: () => void;
  dense?: boolean;
}

export function Header({ onWordmarkClick, dense }: Props) {
  const { path } = useRouter();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-paper-50/90 backdrop-blur px-4 sm:px-6"
      style={{ paddingTop: 'calc(var(--safe-top) + 10px)', paddingBottom: 10 }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {onWordmarkClick ? (
          <button onClick={onWordmarkClick} className="focus-ring flex items-center gap-2 shrink-0" aria-label="Start over">
            <Wordmark />
          </button>
        ) : (
          <Link to="/" className="focus-ring flex items-center gap-2 shrink-0">
            <Wordmark />
          </Link>
        )}
      </div>

      {dense ? (
        onWordmarkClick && (
          <button
            onClick={onWordmarkClick}
            className="focus-ring flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs sm:text-sm font-medium text-ink-700 hover:bg-paper-100 hover:border-ink-300 transition-colors shrink-0"
          >
            <ReplaceIcon />
            <span>Replace</span>
          </button>
        )
      ) : (
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            to="/"
            className={[
              'focus-ring rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors',
              path === '/' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-paper-200'
            ].join(' ')}
          >
            Report Generator
          </Link>
          <Link
            to="/workspace"
            className={[
              'focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors',
              path === '/workspace' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-paper-200'
            ].join(' ')}
          >
            <span>Workspace</span>
            <span
              className={[
                'text-[9px] font-semibold uppercase tracking-wide rounded-full px-1.5 py-0.5',
                path === '/workspace' ? 'bg-signal-400 text-ink-950' : 'bg-signal-100 text-signal-600'
              ].join(' ')}
            >
              Soon
            </span>
          </Link>
        </nav>
      )}
    </header>
  );
}

function ReplaceIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" />
    </svg>
  );
}

function Wordmark() {
  return (
    <>
      <div className="h-7 w-7 rounded-md bg-ink-900 flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect y="1" width="16" height="2.4" rx="1.2" fill="#F4F5F2" />
          <rect y="6.8" width="11" height="2.4" rx="1.2" fill="#14A69B" />
          <rect y="12.6" width="13" height="2.4" rx="1.2" fill="#F4F5F2" opacity="0.6" />
        </svg>
      </div>
      <span className="font-display font-semibold text-lg text-ink-900 tracking-tight">
        DocBit<span className="text-signal-500">.</span>
      </span>
    </>
  );
}
