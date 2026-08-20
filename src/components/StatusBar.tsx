import React from 'react';
import type { RawDataset } from '../types/dataset';
import type { ProcessedReport } from '../types/processed';
import type { ReportConfig } from '../types/report';

interface Props {
  raw: RawDataset;
  report: ProcessedReport;
  config: ReportConfig;
}

export function StatusBar({ raw, report, config }: Props) {
  const { dataRowCount, totalColumnCount, finalRowCount, selectedColumnCount, activeFilterCount } = report.stats;
  const unchanged = finalRowCount === dataRowCount && selectedColumnCount === totalColumnCount && activeFilterCount === 0;

  const primarySort = config.sorts[0];
  const primarySortCol = primarySort ? report.columns.find((c) => c.key === primarySort.columnKey) : null;

  const configParts: string[] = [];
  if (activeFilterCount > 0) configParts.push(`${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'}`);
  if (primarySortCol) configParts.push(`Sorted by ${primarySortCol.displayName} ${primarySort!.direction === 'asc' ? '↑' : '↓'}`);
  if (report.stats.isGrouped) configParts.push(`Grouped · ${report.groups?.length ?? 0} groups`);
  if (report.stats.editedCellCount > 0) {
    configParts.push(`${report.stats.editedCellCount} cell${report.stats.editedCellCount === 1 ? '' : 's'} edited`);
  }

  return (
    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap px-4 sm:px-5 py-2 text-xs border-b border-ink-200 bg-paper-100/60 font-mono">
      <span className="inline-flex items-center gap-1.5 text-signal-600 shrink-0" title="Your original file is never modified">
        <TrustDot />
        <span className="hidden sm:inline">Original preserved</span>
      </span>
      <span className="text-ink-200">·</span>
      <span className="text-ink-600/70">
        <span className="font-semibold text-ink-900">{finalRowCount.toLocaleString()}</span> row{finalRowCount === 1 ? '' : 's'}
        {!unchanged && <span className="text-ink-400"> of {dataRowCount.toLocaleString()}</span>}
      </span>
      <span className="text-ink-200">·</span>
      <span className="text-ink-600/70">
        <span className="font-semibold text-ink-900">{selectedColumnCount}</span> column{selectedColumnCount === 1 ? '' : 's'}
        {selectedColumnCount !== totalColumnCount && <span className="text-ink-400"> of {totalColumnCount}</span>}
      </span>
      {configParts.map((p) => (
        <React.Fragment key={p}>
          <span className="text-ink-200">·</span>
          <span className="text-ink-600/70">{p}</span>
        </React.Fragment>
      ))}
      <span className="ml-auto hidden md:inline text-ink-600/40 italic truncate max-w-[220px]">{raw.meta.fileName} untouched on disk</span>
    </div>
  );
}

function TrustDot() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.2 8.2L7.1 10L10.8 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
