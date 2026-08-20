import type { CellValue, ColumnSchema } from '../types/dataset';
import type { CellEdits } from '../types/report';
import { toNumber } from '../utils/format';

/** Stable key for a single edited cell, addressed by file position + column. */
export function cellEditKey(sourceIndex: number, columnKey: string): string {
  return `${sourceIndex}:${columnKey}`;
}

export function getCellEdit(edits: CellEdits, sourceIndex: number, columnKey: string): string | undefined {
  return edits[cellEditKey(sourceIndex, columnKey)];
}

/**
 * Returns a copy of `row` with any edited cells overlaid, coerced back to the
 * column's detected data type. The underlying RawDataset row array is never
 * mutated — this produces a new array used only for this processing pass.
 */
export function applyRowEdits(
  row: CellValue[],
  sourceIndex: number,
  edits: CellEdits,
  columns: ColumnSchema[]
): CellValue[] {
  if (Object.keys(edits).length === 0) return row;
  let changed = false;
  const next = row.slice();
  for (const col of columns) {
    const raw = getCellEdit(edits, sourceIndex, col.key);
    if (raw === undefined) continue;
    changed = true;
    next[col.index] = coerceEditedValue(raw, col.dataType);
  }
  return changed ? next : row;
}

function coerceEditedValue(raw: string, dataType: ColumnSchema['dataType']): CellValue {
  if (raw.trim() === '') return null;
  if (dataType === 'number') {
    const n = toNumber(raw);
    return n !== null ? n : raw;
  }
  if (dataType === 'boolean') {
    const lower = raw.trim().toLowerCase();
    if (lower === 'true' || lower === 'yes') return true;
    if (lower === 'false' || lower === 'no') return false;
    return raw;
  }
  return raw;
}
