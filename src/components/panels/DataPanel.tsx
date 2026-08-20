import React, { useState } from 'react';
import type { DatasetSchema, RawDataset } from '../../types/dataset';
import type { ReportConfig, RowRange } from '../../types/report';
import type { ProcessedReport } from '../../types/processed';
import { makeId } from '../../utils/id';
import { DatasetSummary } from '../DatasetSummary';

interface Props {
  raw: RawDataset;
  schema: DatasetSchema;
  config: ReportConfig;
  report: ProcessedReport;
  onHeaderRowChange: (index: number) => void;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

export function DataPanel({ raw, schema, config, report, onHeaderRowChange, update }: Props) {
  const [newRange, setNewRange] = useState({ start: '', end: '' });

  const addRange = () => {
    const start = parseInt(newRange.start, 10);
    const end = parseInt(newRange.end, 10) || start;
    if (!start || start < 1) return;
    const range: RowRange = { id: makeId('range'), start, end: Math.max(start, end) };
    update((prev) => ({ ...prev, excludedRanges: [...prev.excludedRanges, range] }));
    setNewRange({ start: '', end: '' });
  };

  const removeRange = (id: string) => {
    update((prev) => ({ ...prev, excludedRanges: prev.excludedRanges.filter((r) => r.id !== id) }));
  };

  const previewRowOptions = Math.min(raw.rows.length, 15);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2.5">Dataset overview</h3>
        <div className="rounded-lg border border-ink-200 bg-white p-3.5">
          <DatasetSummary raw={raw} schema={schema} dataRowCount={report.stats.dataRowCount} />
        </div>
        <div className="mt-2.5 rounded-lg bg-paper-100 p-3 flex items-center justify-between text-sm">
          <div>
            <p className="text-[11px] text-ink-600/60 uppercase tracking-wide">Original</p>
            <p className="font-mono text-ink-900">
              {report.stats.dataRowCount.toLocaleString()} × {report.stats.totalColumnCount}
            </p>
          </div>
          <span className="text-ink-300">→</span>
          <div className="text-right">
            <p className="text-[11px] text-ink-600/60 uppercase tracking-wide">Current report</p>
            <p className="font-mono font-semibold text-signal-600">
              {report.stats.finalRowCount.toLocaleString()} × {report.stats.selectedColumnCount}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2.5">Header row</h3>
        <p className="text-xs text-ink-600/60 mb-2">
          Pick the row that contains your column names. Rows above it (titles, metadata) are ignored automatically.
        </p>
        <div className="rounded-lg border border-ink-200 bg-white divide-y divide-ink-100 max-h-56 overflow-auto thin-scroll">
          {Array.from({ length: previewRowOptions }).map((_, i) => {
            const rowPreview = raw.rows[i] ?? [];
            const label = rowPreview
              .filter((c) => c !== null && c !== undefined && String(c).trim() !== '')
              .slice(0, 4)
              .map((c) => String(c))
              .join(' · ');
            const active = i === schema.headerRowIndex;
            return (
              <button
                key={i}
                onClick={() => onHeaderRowChange(i)}
                className={[
                  'w-full text-left px-3 py-2 text-xs flex items-center gap-2 focus-ring',
                  active ? 'bg-signal-100 text-signal-600 font-medium' : 'hover:bg-paper-100 text-ink-700'
                ].join(' ')}
              >
                <span className="font-mono w-14 shrink-0">Row {i + 1}</span>
                <span className="truncate text-ink-600/70">{label || '(empty row)'}</span>
                {active && <span className="ml-auto text-[10px] shrink-0">HEADER</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2.5">Rows</h3>
        <p className="text-xs text-ink-600/60 mb-2">
          Exclude specific row ranges from the report (e.g. leftover title rows or a section you don't need).
        </p>
        <div className="flex items-end gap-2 mb-3">
          <label className="flex-1">
            <span className="block text-[11px] text-ink-600/60 mb-1">From row</span>
            <input
              type="number"
              min={1}
              value={newRange.start}
              onChange={(e) => setNewRange((r) => ({ ...r, start: e.target.value }))}
              className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="flex-1">
            <span className="block text-[11px] text-ink-600/60 mb-1">To row</span>
            <input
              type="number"
              min={1}
              value={newRange.end}
              onChange={(e) => setNewRange((r) => ({ ...r, end: e.target.value }))}
              className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-sm"
            />
          </label>
          <button
            onClick={addRange}
            className="focus-ring h-[34px] px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800"
          >
            Exclude
          </button>
        </div>
        {config.excludedRanges.length > 0 && (
          <ul className="space-y-1.5">
            {config.excludedRanges.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs bg-paper-100 rounded-md px-2.5 py-1.5">
                <span className="font-mono">
                  Rows {r.start}–{r.end} excluded
                </span>
                <button onClick={() => removeRange(r.id)} className="focus-ring text-ink-600/60 hover:text-rose-500">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {report.quality.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2.5">Data quality</h3>
          <ul className="space-y-2">
            {report.quality.map((q) => (
              <li
                key={q.id}
                className={[
                  'text-xs rounded-lg px-3 py-2.5 border',
                  q.severity === 'warning' ? 'bg-amber-100 border-amber-500/25 text-amber-500' : 'bg-paper-100 border-ink-200 text-ink-600/80'
                ].join(' ')}
              >
                {q.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
