import React, { useMemo } from 'react';
import type { DatasetSchema, RawDataset } from '../types/dataset';
import { formatFileSize } from '../utils/format';
import { useCountUp } from '../hooks/useCountUp';

interface Props {
  raw: RawDataset;
  schema: DatasetSchema;
  dataRowCount: number;
  compact?: boolean;
}

const TYPE_META: { key: 'string' | 'number' | 'date' | 'boolean' | 'empty' | 'mixed'; label: string; color: string }[] = [
  { key: 'string', label: 'Text', color: 'bg-ink-600' },
  { key: 'number', label: 'Numbers', color: 'bg-signal-500' },
  { key: 'date', label: 'Dates', color: 'bg-amber-500' },
  { key: 'boolean', label: 'Boolean', color: 'bg-ink-400' },
  { key: 'mixed', label: 'Mixed', color: 'bg-rose-500' },
  { key: 'empty', label: 'Empty', color: 'bg-ink-200' }
];

export function DatasetSummary({ raw, schema, dataRowCount, compact }: Props) {
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { string: 0, number: 0, date: 0, boolean: 0, empty: 0, mixed: 0 };
    for (const col of schema.columns) counts[col.dataType] = (counts[col.dataType] ?? 0) + 1;
    return counts;
  }, [schema.columns]);

  const warningCount = schema.quality.filter((q) => q.severity === 'warning').length;
  const animatedRows = useCountUp(dataRowCount);
  const animatedCols = useCountUp(schema.columns.length);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{raw.meta.fileName}</p>
            <p className="text-xs text-ink-600/60">{formatFileSize(raw.meta.fileSize)} · {raw.meta.fileType.toUpperCase()}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <Stat value={animatedRows} label="records" />
        <Stat value={animatedCols} label="fields" />
        <span className="text-xs text-ink-600/60">
          Header detected: <span className="font-medium text-ink-900">Row {schema.headerRowIndex + 1}</span>
        </span>
        {warningCount > 0 ? (
          <span className="text-xs text-amber-500 font-medium">
            {warningCount} potential data-quality issue{warningCount > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-signal-600 font-medium">No data-quality issues detected</span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
        {TYPE_META.filter((t) => typeCounts[t.key] > 0).map((t) => (
          <span key={t.key} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-600/70">
            <span className={`h-1.5 w-1.5 rounded-full ${t.color}`} />
            {t.label} {typeCounts[t.key]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="text-sm">
      <span className="font-display font-semibold text-ink-900 text-base tabular-nums">{value.toLocaleString()}</span>{' '}
      <span className="text-ink-600/60">{label}</span>
    </span>
  );
}
