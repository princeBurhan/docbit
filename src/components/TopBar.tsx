import React from 'react';
import type { RawDataset } from '../types/dataset';
import { formatFileSize } from '../utils/format';

interface Props {
  dataset: RawDataset;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
}

export function TopBar({ dataset, onUndo, onRedo, canUndo, canRedo, onExport }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 sm:px-5 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate max-w-[160px] sm:max-w-xs">{dataset.meta.fileName}</p>
          <p className="text-[11px] text-ink-600/60 hidden sm:block">{formatFileSize(dataset.meta.fileSize)} · Processed locally</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo — including data edits"
          aria-label="Undo"
          className="focus-ring h-8 w-8 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo — including data edits"
          aria-label="Redo"
          className="focus-ring h-8 w-8 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 7l5 5-5 5M20 12H9a5 5 0 000 10h1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="w-px h-5 bg-ink-200 mx-1 hidden sm:block" />

        <button
          onClick={onExport}
          className="focus-ring inline-flex items-center h-8 sm:h-9 px-3.5 sm:px-4 rounded-md bg-signal-500 text-white text-xs sm:text-sm font-medium hover:bg-signal-600 transition-colors"
        >
          Export
        </button>
      </div>
    </header>
  );
}
