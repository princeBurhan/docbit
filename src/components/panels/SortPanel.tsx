import React from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { ReportConfig, SortRule } from '../../types/report';
import { makeId } from '../../utils/id';

interface Props {
  schema: DatasetSchema;
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

export function SortPanel({ schema, config, update }: Props) {
  const columns = schema.columns;

  const addSort = () => {
    const used = new Set(config.sorts.map((s) => s.columnKey));
    const next = columns.find((c) => !used.has(c.key)) ?? columns[0];
    if (!next) return;
    const rule: SortRule = { id: makeId('sort'), columnKey: next.key, direction: 'asc' };
    update((prev) => ({ ...prev, sorts: [...prev.sorts, rule] }));
  };

  const updateSort = (id: string, patch: Partial<SortRule>) => {
    update((prev) => ({ ...prev, sorts: prev.sorts.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };

  const removeSort = (id: string) => {
    update((prev) => ({ ...prev, sorts: prev.sorts.filter((s) => s.id !== id) }));
  };

  const move = (id: string, dir: -1 | 1) => {
    update((prev) => {
      const list = [...prev.sorts];
      const idx = list.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...prev, sorts: list };
    });
  };

  if (columns.length === 0) return <p className="text-sm text-ink-600/60">No columns available to sort by.</p>;

  return (
    <div className="space-y-3">
      {config.sorts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center">
          <p className="text-sm text-ink-900 font-medium">No sort rules yet</p>
          <p className="text-xs text-ink-600/60 mt-1 mb-3">Rows are shown in their original order.</p>
          <button onClick={addSort} className="focus-ring inline-flex items-center rounded-md bg-ink-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-ink-800">
            + Add sort rule
          </button>
        </div>
      ) : (
        <>
          <ol className="space-y-2">
            {config.sorts.map((s, i) => {
              const col = columns.find((c) => c.key === s.columnKey);
              return (
                <li key={s.id} className="rounded-lg border border-ink-200 bg-white p-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-ink-600/40 w-4">{i + 1}</span>
                  <select
                    value={s.columnKey}
                    onChange={(e) => updateSort(s.id, { columnKey: e.target.value })}
                    className="focus-ring flex-1 min-w-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs"
                  >
                    {columns.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.originalName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateSort(s.id, { direction: s.direction === 'asc' ? 'desc' : 'asc' })}
                    className="focus-ring rounded-md border border-ink-200 px-2 py-1.5 text-xs font-mono hover:bg-paper-100"
                    title={col?.dataType === 'string' ? 'A–Z / Z–A' : 'Ascending / Descending'}
                  >
                    {s.direction === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                  <div className="flex flex-col">
                    <button disabled={i === 0} onClick={() => move(s.id, -1)} className="focus-ring disabled:opacity-20 text-ink-600/60 hover:text-ink-900 leading-none">
                      ▲
                    </button>
                    <button disabled={i === config.sorts.length - 1} onClick={() => move(s.id, 1)} className="focus-ring disabled:opacity-20 text-ink-600/60 hover:text-ink-900 leading-none">
                      ▼
                    </button>
                  </div>
                  <button onClick={() => removeSort(s.id)} className="focus-ring text-ink-600/50 hover:text-rose-500">
                    ✕
                  </button>
                </li>
              );
            })}
          </ol>
          {config.sorts.length < columns.length && (
            <button onClick={addSort} className="focus-ring w-full rounded-md border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-600 hover:bg-paper-100">
              + Add sort rule
            </button>
          )}
        </>
      )}
    </div>
  );
}
