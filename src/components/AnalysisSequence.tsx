import React from 'react';

export const ANALYSIS_STAGES = [
  'Reading file',
  'Understanding structure',
  'Detecting headers',
  'Analyzing columns',
  'Checking data quality',
  'Preparing report workspace'
] as const;

interface Props {
  /** Index of the currently active stage (0-based). Stages before it are complete. */
  currentStage: number;
}

/**
 * Purely presentational. The caller advances `currentStage` at real
 * checkpoints in the processing pipeline — e.g. it holds at "Understanding
 * structure" for exactly as long as the actual file parse takes, so a large
 * file shows genuine progress instead of a manufactured delay.
 */
export function AnalysisSequence({ currentStage }: Props) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <ul className="space-y-2.5">
        {ANALYSIS_STAGES.map((stage, i) => {
          const done = i < currentStage;
          const active = i === currentStage;
          return (
            <li key={stage} className="flex items-center gap-2.5 text-sm">
              <span
                className={[
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
                  done ? 'bg-signal-500 text-white' : active ? 'bg-ink-900 text-white' : 'bg-paper-200 text-transparent'
                ].join(' ')}
              >
                {done ? (
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                ) : null}
              </span>
              <span className={done ? 'text-ink-400' : active ? 'text-ink-900 font-medium' : 'text-ink-400'}>{stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
