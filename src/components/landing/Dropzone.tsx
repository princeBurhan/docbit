import React, { useCallback, useRef, useState } from 'react';
import { AnalysisSequence } from '../AnalysisSequence';

interface Props {
  onFile: (file: File) => void;
  isProcessing: boolean;
  analysisStage: number;
  error: string | null;
  onDismissError: () => void;
}

export function Dropzone({ onFile, isProcessing, analysisStage, error, onDismissError }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]);
    },
    [onFile]
  );

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!isProcessing) handleFiles(e.dataTransfer.files);
        }}
        className={[
          'relative rounded-2xl border-2 border-dashed transition-all duration-150 px-6 py-11 sm:py-14 text-center overflow-hidden',
          dragging
            ? 'border-signal-500 bg-signal-100/60 scale-[1.01]'
            : error
            ? 'border-rose-500/40 bg-rose-100/30'
            : 'border-ink-200 bg-white hover:border-ink-600/40'
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.json"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="animate-fade-in py-2">
            <AnalysisSequence currentStage={analysisStage} />
          </div>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 rounded-xl bg-paper-100 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E2C4A" strokeWidth="1.6">
                <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-ink-900 font-medium">
              Drag a file here, or{' '}
              <button
                onClick={() => inputRef.current?.click()}
                className="focus-ring text-signal-600 underline underline-offset-2 hover:text-signal-500"
              >
                browse your device
              </button>
            </p>
            <p className="text-xs text-ink-600/60 mt-2">Excel · CSV · JSON · up to 100 MB</p>
          </>
        )}
      </div>

      <p className="text-center text-xs text-ink-600/50 mt-3">
        Your data is processed locally in your browser whenever possible.
      </p>

      {error && !isProcessing && (
        <div className="mt-4 rounded-xl border border-rose-500/25 bg-white shadow-panel p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-rose-500 mb-1">We couldn't process this file</p>
              <p className="text-xs text-ink-600/70">{error}</p>
            </div>
            <button onClick={onDismissError} className="focus-ring text-ink-400 hover:text-ink-700 shrink-0" aria-label="Dismiss">
              ✕
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="focus-ring text-xs font-medium rounded-md bg-ink-900 text-white px-3 py-1.5 hover:bg-ink-800"
            >
              Choose another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
