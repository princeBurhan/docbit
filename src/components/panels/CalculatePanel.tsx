import React from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { AggregateConfig, AggregateFn, ReportConfig } from '../../types/report';
import type { ProcessedReport } from '../../types/processed';
import { makeId } from '../../utils/id';

interface Props {
  schema: DatasetSchema;
  config: ReportConfig;
  report: ProcessedReport;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

const FN_LABELS: Record<AggregateFn, string> = { count: 'Count', sum: 'Sum', avg: 'Average', min: 'Minimum', max: 'Maximum' };

export function CalculatePanel({ schema, config, report, update }: Props) {
  const numericColumns = schema.columns.filter((c) => c.dataType === 'number');
  const hasNumeric = numericColumns.length > 0;
  const availableFns: AggregateFn[] = hasNumeric ? ['count', 'sum', 'avg', 'min', 'max'] : ['count'];

  const addAggregate = () => {
    const agg: AggregateConfig = { id: makeId('agg'), fn: 'count', columnKey: null, label: '' };
    update((prev) => ({ ...prev, calculations: [...prev.calculations, agg] }));
  };

  const updateAggregate = (id: string, patch: Partial<AggregateConfig>) => {
    update((prev) => ({ ...prev, calculations: prev.calculations.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  };

  const removeAggregate = (id: string) => {
    update((prev) => ({ ...prev, calculations: prev.calculations.filter((a) => a.id !== id) }));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-600/60">
        Calculations run on the current filtered dataset — if you filter to Payment Status = Paid, totals reflect only
        those rows.
      </p>

      {!hasNumeric && (
        <div className="rounded-lg bg-amber-100 border border-amber-500/25 px-3 py-2.5 text-xs text-amber-500">
          No numeric fields available. You can still add a <strong>Count</strong> — sum, average, minimum, and maximum
          need at least one numeric column.
        </div>
      )}

      {config.calculations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center">
          <p className="text-sm text-ink-900 font-medium">No calculations yet</p>
          <p className="text-xs text-ink-600/60 mt-1 mb-3">Add totals, averages, or counts to summarize your report.</p>
          <button onClick={addAggregate} className="focus-ring inline-flex items-center rounded-md bg-ink-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-ink-800">
            + Add calculation
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {config.calculations.map((agg) => (
              <li key={agg.id} className="rounded-lg border border-ink-200 bg-white p-2.5 flex items-center gap-2">
                <select
                  value={agg.fn}
                  onChange={(e) => updateAggregate(agg.id, { fn: e.target.value as AggregateFn })}
                  className="focus-ring rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                >
                  {(Object.keys(FN_LABELS) as AggregateFn[])
                    .filter((fn) => availableFns.includes(fn))
                    .map((fn) => (
                      <option key={fn} value={fn}>
                        {FN_LABELS[fn]}
                      </option>
                    ))}
                </select>
                {agg.fn !== 'count' && (
                  <select
                    value={agg.columnKey ?? ''}
                    onChange={(e) => updateAggregate(agg.id, { columnKey: e.target.value || null })}
                    className="focus-ring flex-1 min-w-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                  >
                    <option value="">Choose field…</option>
                    {numericColumns.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.originalName}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  value={agg.label}
                  onChange={(e) => updateAggregate(agg.id, { label: e.target.value })}
                  placeholder="Label"
                  className="focus-ring flex-1 min-w-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                />
                <button onClick={() => removeAggregate(agg.id)} className="focus-ring text-ink-600/50 hover:text-rose-500">
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button onClick={addAggregate} className="focus-ring w-full rounded-md border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-600 hover:bg-paper-100">
            + Add calculation
          </button>
        </>
      )}

      {report.summaries.length > 0 && (
        <div className="rounded-lg bg-paper-100 p-3 space-y-1">
          {report.summaries.map((s) => (
            <div key={s.id} className="flex justify-between text-sm">
              <span className="text-ink-600/70">{s.label}</span>
              <span className="font-semibold font-mono text-ink-900">{s.displayValue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
