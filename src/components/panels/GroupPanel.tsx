import React from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { AggregateConfig, AggregateFn, ReportConfig } from '../../types/report';
import { makeId } from '../../utils/id';

interface Props {
  schema: DatasetSchema;
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

const FN_LABELS: Record<AggregateFn, string> = { count: 'Count', sum: 'Sum', avg: 'Average', min: 'Minimum', max: 'Maximum' };

export function GroupPanel({ schema, config, update }: Props) {
  const columns = schema.columns;
  const numericColumns = columns.filter((c) => c.dataType === 'number');
  const hasNumeric = numericColumns.length > 0;
  const availableFns: AggregateFn[] = hasNumeric ? ['count', 'sum', 'avg', 'min', 'max'] : ['count'];

  const setGroupColumn = (key: string | null) => {
    update((prev) => ({ ...prev, group: { ...prev.group, columnKey: key } }));
  };

  const addAggregate = () => {
    const agg: AggregateConfig = { id: makeId('agg'), fn: 'count', columnKey: null, label: '' };
    update((prev) => ({ ...prev, group: { ...prev.group, aggregates: [...prev.group.aggregates, agg] } }));
  };

  const updateAggregate = (id: string, patch: Partial<AggregateConfig>) => {
    update((prev) => ({
      ...prev,
      group: { ...prev.group, aggregates: prev.group.aggregates.map((a) => (a.id === id ? { ...a, ...patch } : a)) }
    }));
  };

  const removeAggregate = (id: string) => {
    update((prev) => ({ ...prev, group: { ...prev.group, aggregates: prev.group.aggregates.filter((a) => a.id !== id) } }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2">Group by</h3>
        <select
          value={config.group.columnKey ?? ''}
          onChange={(e) => setGroupColumn(e.target.value || null)}
          className="focus-ring w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm"
        >
          <option value="">No grouping</option>
          {columns.map((c) => (
            <option key={c.key} value={c.key}>
              {c.originalName}
            </option>
          ))}
        </select>
      </div>

      {!config.group.columnKey && (
        <div className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center">
          <p className="text-sm text-ink-900 font-medium">Group your report</p>
          <p className="text-xs text-ink-600/60 mt-1">Choose a field to organize records into sections.</p>
        </div>
      )}

      {config.group.columnKey && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 mb-2">Group summaries</h3>
          {config.group.aggregates.length === 0 ? (
            <p className="text-xs text-ink-600/60 mb-2">Add a calculation to summarize each group.</p>
          ) : (
            <ul className="space-y-2 mb-2">
              {config.group.aggregates.map((agg) => (
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
                  <button onClick={() => removeAggregate(agg.id)} className="focus-ring ml-auto text-ink-600/50 hover:text-rose-500">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={addAggregate} className="focus-ring w-full rounded-md border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-600 hover:bg-paper-100">
            + Add summary
          </button>
        </div>
      )}
    </div>
  );
}
