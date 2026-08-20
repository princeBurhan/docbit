import React, { useMemo, useState } from 'react';
import type { DatasetSchema } from '../../types/dataset';
import type { ReportConfig } from '../../types/report';

interface Props {
  schema: DatasetSchema;
  config: ReportConfig;
  update: (updater: (prev: ReportConfig) => ReportConfig) => void;
}

export function ColumnsPanel({ schema, config, update }: Props) {
  const [search, setSearch] = useState('');
  const [dragKey, setDragKey] = useState<string | null>(null);

  const ordered = useMemo(() => [...config.columns].sort((a, b) => a.order - b.order), [config.columns]);
  const nameByKey = useMemo(() => new Map(schema.columns.map((c) => [c.key, c.originalName])), [schema.columns]);

  const filtered = ordered.filter((c) => c.displayName.toLowerCase().includes(search.toLowerCase()));

  const toggleVisible = (key: string) => {
    update((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    }));
  };

  const setAllVisible = (visible: boolean) => {
    update((prev) => ({ ...prev, columns: prev.columns.map((c) => ({ ...c, visible })) }));
  };

  const rename = (key: string, name: string) => {
    update((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.key === key ? { ...c, displayName: name } : c))
    }));
  };

  const restoreName = (key: string) => {
    const original = nameByKey.get(key);
    if (original) rename(key, original);
  };

  const reorder = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    update((prev) => {
      const list = [...prev.columns].sort((a, b) => a.order - b.order);
      const fromIdx = list.findIndex((c) => c.key === fromKey);
      const toIdx = list.findIndex((c) => c.key === toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      const reindexed = list.map((c, i) => ({ ...c, order: i }));
      return { ...prev, columns: reindexed };
    });
  };

  const visibleCount = config.columns.filter((c) => c.visible).length;

  return (
    <div className="space-y-4">
      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fields…"
          className="focus-ring w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between mt-2.5 text-xs">
          <span className="text-ink-600/60">
            {visibleCount} of {config.columns.length} selected
          </span>
          <div className="flex gap-3">
            <button onClick={() => setAllVisible(true)} className="focus-ring text-signal-600 hover:underline">
              Select all
            </button>
            <button onClick={() => setAllVisible(false)} className="focus-ring text-ink-600/60 hover:underline">
              Clear all
            </button>
          </div>
        </div>
      </div>

      <ul className="space-y-1.5">
        {filtered.map((col) => (
          <li
            key={col.key}
            draggable
            onDragStart={() => setDragKey(col.key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragKey) reorder(dragKey, col.key);
              setDragKey(null);
            }}
            className={[
              'rounded-lg border bg-white px-2.5 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing',
              col.visible ? 'border-ink-200' : 'border-ink-100 opacity-60'
            ].join(' ')}
          >
            <span className="text-ink-200 select-none" aria-hidden>
              ⋮⋮
            </span>
            <input
              type="checkbox"
              checked={col.visible}
              onChange={() => toggleVisible(col.key)}
              className="focus-ring h-4 w-4 accent-signal-500 shrink-0"
              aria-label={`Show ${col.displayName}`}
            />
            <input
              value={col.displayName}
              onChange={(e) => rename(col.key, e.target.value)}
              className="focus-ring flex-1 min-w-0 bg-transparent text-sm text-ink-900 border-b border-transparent hover:border-ink-200 focus:border-signal-500 py-0.5"
            />
            {col.displayName !== nameByKey.get(col.key) && (
              <button
                onClick={() => restoreName(col.key)}
                title="Restore original name"
                className="focus-ring text-[10px] text-ink-600/50 hover:text-signal-600 shrink-0"
              >
                reset
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
