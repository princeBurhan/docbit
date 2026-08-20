import React, { useMemo, useState } from 'react';
import type { ProcessedReport, ReportRow } from '../types/processed';
import type { CellEdits, DesignConfig } from '../types/report';
import { displayCell } from '../utils/format';
import { cellEditKey } from '../engine/edits';

interface Props {
  report: ProcessedReport;
  design: DesignConfig;
  hasRawDataset: boolean;
  cellEdits: CellEdits;
  onEditCell: (sourceIndex: number, columnKey: string, rawValue: string) => void;
}

const PAGE_SIZE = 100;

export function PreviewTable({ report, design, hasRawDataset, cellEdits, onEditCell }: Props) {
  const [page, setPage] = useState(0);
  const [inspectRow, setInspectRow] = useState<ReportRow | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const flatRows = report.groups ? null : report.rows;
  const pageCount = flatRows ? Math.max(1, Math.ceil(flatRows.length / PAGE_SIZE)) : 1;
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    if (!flatRows) return [];
    const start = clampedPage * PAGE_SIZE;
    return flatRows.slice(start, start + PAGE_SIZE);
  }, [flatRows, clampedPage]);

  if (!hasRawDataset) return null;

  if (report.columns.length === 0) {
    return (
      <EmptyState
        title="No columns selected"
        description="Choose at least one column in the Columns panel to build your report."
      />
    );
  }

  if (report.stats.finalRowCount === 0) {
    return (
      <EmptyState
        title="No rows match your current setup"
        description="Your filters or row selection excluded every row. Adjust them to see results."
      />
    );
  }

  const density = design.density === 'compact' ? 'py-1.5' : 'py-2.5';

  const rowProps = {
    report,
    design,
    density,
    cellEdits,
    onEditCell,
    editingKey,
    setEditingKey
  };

  return (
    <div className="flex flex-col h-full">
      {report.stats.editedCellCount > 0 && (
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 text-[11px] text-signal-600 bg-signal-100/60 border-b border-signal-500/15 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-500" />
          {report.stats.editedCellCount} cell{report.stats.editedCellCount === 1 ? '' : 's'} edited in this report ·
          original file unchanged
        </div>
      )}
      <div className="flex-1 overflow-auto thin-scroll">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink-900 text-paper-50">
            <tr>
              <th className="text-left font-mono text-[11px] font-normal px-3 py-2 w-12 text-paper-50/50 border-b border-ink-700">
                #
              </th>
              {report.columns.map((col) => (
                <th key={col.key} className="text-left font-medium px-3 py-2 whitespace-nowrap border-b border-ink-700">
                  <div className="flex items-center gap-1.5">
                    <span>{col.displayName}</span>
                    <span className="text-[10px] font-mono uppercase text-paper-50/40">{col.dataType}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.groups ? (
              report.groups.map((group) => (
                <React.Fragment key={group.key}>
                  <tr className="bg-signal-100/70">
                    <td colSpan={report.columns.length + 1} className="px-3 py-2 text-xs font-semibold text-signal-600">
                      {group.label} · {group.rows.length} record{group.rows.length === 1 ? '' : 's'}
                      {group.summaries.length > 0 && (
                        <span className="ml-3 font-normal text-ink-600/70 font-mono">
                          {group.summaries.map((s) => `${s.label}: ${s.displayValue}`).join('   ·   ')}
                        </span>
                      )}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <Row key={row.id} row={row} onInspect={() => setInspectRow(row)} {...rowProps} />
                  ))}
                </React.Fragment>
              ))
            ) : (
              pageRows.map((row) => <Row key={row.id} row={row} onInspect={() => setInspectRow(row)} {...rowProps} />)
            )}
          </tbody>
          {report.summaries.length > 0 && (
            <tfoot className="sticky bottom-0 bg-paper-100 border-t-2 border-ink-900">
              <tr>
                <td className="px-3 py-2" />
                <td colSpan={report.columns.length} className="px-3 py-2">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-ink-900">
                    {report.summaries.map((s) => (
                      <span key={s.id}>
                        <span className="text-ink-600/60">{s.label}:</span> <span className="font-semibold">{s.displayValue}</span>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!report.groups && pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-ink-200 px-4 py-2.5 text-xs text-ink-600/70 bg-white shrink-0">
          <span>
            Showing {clampedPage * PAGE_SIZE + 1}–{Math.min((clampedPage + 1) * PAGE_SIZE, flatRows!.length)} of{' '}
            {flatRows!.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={clampedPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="focus-ring h-7 px-2.5 rounded-md border border-ink-200 disabled:opacity-30 hover:bg-paper-100"
            >
              Prev
            </button>
            <span className="font-mono px-1">
              {clampedPage + 1} / {pageCount}
            </span>
            <button
              disabled={clampedPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="focus-ring h-7 px-2.5 rounded-md border border-ink-200 disabled:opacity-30 hover:bg-paper-100"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {inspectRow && <RowInspector row={inspectRow} report={report} onClose={() => setInspectRow(null)} />}
    </div>
  );
}

interface RowProps {
  row: ReportRow;
  report: ProcessedReport;
  design: DesignConfig;
  density: string;
  cellEdits: CellEdits;
  onEditCell: (sourceIndex: number, columnKey: string, rawValue: string) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  onInspect: () => void;
}

function Row({ row, report, design, density, cellEdits, onEditCell, editingKey, setEditingKey, onInspect }: RowProps) {
  return (
    <tr className="border-b border-ink-100 hover:bg-paper-100/70 group">
      <td className={`px-3 ${density} font-mono text-[11px] text-ink-600/50 align-top`}>
        <button onClick={onInspect} className="focus-ring hover:text-signal-600" title="Why is this row included?">
          {row.sourceIndex}
        </button>
      </td>
      {row.values.map((v, i) => {
        const col = report.columns[i];
        const key = cellEditKey(row.sourceIndex, col.key);
        const isEdited = key in cellEdits;
        const isEditing = editingKey === key;
        const text = displayCell(v, col.dataType, design, col.isCurrency);

        if (col.dataType === 'boolean') {
          return (
            <td key={col.key} className={`px-3 ${density} align-top`}>
              <button
                onClick={() => onEditCell(row.sourceIndex, col.key, v ? 'false' : 'true')}
                className={[
                  'focus-ring text-[11px] font-medium rounded-full px-2 py-0.5 transition-colors relative',
                  v ? 'bg-signal-100 text-signal-600' : 'bg-paper-200 text-ink-600/60'
                ].join(' ')}
                title="Click to toggle"
              >
                {v ? 'Yes' : 'No'}
                {isEdited && <EditedDot />}
              </button>
            </td>
          );
        }

        if (isEditing) {
          return (
            <td key={col.key} className={`px-2 ${density} align-top`}>
              <input
                autoFocus
                defaultValue={text}
                onBlur={(e) => {
                  onEditCell(row.sourceIndex, col.key, e.target.value);
                  setEditingKey(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditingKey(null);
                }}
                className="focus-ring w-full max-w-[220px] rounded border border-signal-500 px-1.5 py-1 text-sm bg-white"
              />
            </td>
          );
        }

        return (
          <td
            key={col.key}
            onClick={() => setEditingKey(key)}
            className={`relative px-3 ${density} align-top max-w-[280px] truncate cursor-text hover:bg-signal-100/40`}
            title={(text || '') + ' · click to edit'}
          >
            {text === '' ? <span className="text-ink-200">—</span> : text}
            {isEdited && <EditedDot />}
          </td>
        );
      })}
    </tr>
  );
}

function EditedDot() {
  return <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-signal-500" title="Edited" />;
}

function RowInspector({ row, report, onClose }: { row: ReportRow; report: ProcessedReport; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-950/40 animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-panel p-5 animate-sheet-up sm:animate-fade-in"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-ink-900">Row {row.sourceIndex}</h3>
          <button onClick={onClose} className="focus-ring h-7 w-7 rounded-full hover:bg-paper-100 flex items-center justify-center text-ink-600">
            ✕
          </button>
        </div>
        {row.matchedFilters.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs font-medium text-ink-600/70 mb-1.5">Why is this row included?</p>
            <ul className="space-y-1">
              {row.matchedFilters.map((m) => (
                <li key={m} className="text-sm text-ink-900 flex items-start gap-1.5">
                  <span className="text-signal-500 mt-0.5">✓</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-ink-600/70 mb-4">No filters are active — every row from the selected range is included.</p>
        )}
        <div className="border-t border-ink-100 pt-3 max-h-64 overflow-auto thin-scroll">
          {report.columns.map((col, i) => (
            <div key={col.key} className="flex justify-between gap-4 py-1 text-sm">
              <span className="text-ink-600/60">{col.displayName}</span>
              <span className="text-ink-900 font-medium text-right">{String(row.values[i] ?? '—')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="h-11 w-11 rounded-full bg-paper-100 flex items-center justify-center text-ink-600/40 mb-4">◻</div>
      <h3 className="text-ink-900 font-medium mb-1">{title}</h3>
      <p className="text-sm text-ink-600/60 max-w-xs">{description}</p>
    </div>
  );
}
