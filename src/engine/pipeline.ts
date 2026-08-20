import type { CellValue, RawDataset } from '../types/dataset';
import type { ReportConfig } from '../types/report';
import type { ProcessedReport, ReportColumn, ReportGroup, ReportRow } from '../types/processed';
import { buildSchema } from './headerDetection';
import { rowMatchesFilterGroup, describeCondition } from './filters';
import { sortRows } from './sorting';
import { computeAggregate, aggregateLabel } from './calculations';
import { detectAdditionalIssues } from './quality';
import { applyRowEdits } from './edits';
import { makeId } from '../utils/id';

export function processReport(raw: RawDataset | null, config: ReportConfig): ProcessedReport {
  if (!raw) {
    return emptyReport();
  }

  const schema = buildSchema(raw, config.headerRowIndex);
  const columnsByKey = new Map(schema.columns.map((c) => [c.key, c]));

  const rawDataRows = raw.rows.slice(schema.dataStartIndex, schema.dataEndIndex);
  const totalRowsInFile = raw.rows.length;

  // Apply any live cell edits before anything else touches the data, so
  // filtering, sorting, calculations, quality checks, and every export
  // format all see the same edited values — never the stale original ones.
  // The RawDataset itself is untouched; edits live only in config.cellEdits.
  const editedCellCount = Object.keys(config.cellEdits).length;
  const allDataRows = rawDataRows.map((row, i) =>
    applyRowEdits(row, schema.dataStartIndex + i + 1, config.cellEdits, schema.columns)
  );

  // Apply row exclusions. Ranges are 1-based positions within the raw file.
  const excluded: { sourceIndex: number; raw: CellValue[] }[] = [];
  const included: { sourceIndex: number; raw: CellValue[] }[] = [];
  for (let i = 0; i < allDataRows.length; i++) {
    const sourceIndex = schema.dataStartIndex + i + 1; // 1-based
    const isExcluded = config.excludedRanges.some((r) => sourceIndex >= Math.min(r.start, r.end) && sourceIndex <= Math.max(r.start, r.end));
    const entry = { sourceIndex, raw: allDataRows[i] };
    if (isExcluded) excluded.push(entry);
    else included.push(entry);
  }

  // Skip rows that are entirely empty (do not count as meaningful data or exclusions).
  const meaningful = included.filter((r) => r.raw.some((c) => c !== null && c !== undefined && String(c).trim() !== ''));

  const additionalIssues = detectAdditionalIssues(
    meaningful.map((r) => r.raw),
    schema.columns,
    schema.columns.length
  );
  const quality = [...schema.quality, ...additionalIssues];

  // Filtering
  const activeConditions = config.filterGroup.conditions;
  const filtered = meaningful.filter((r) => rowMatchesFilterGroup(r.raw, config.filterGroup, columnsByKey));

  const matchDescriptions = (row: CellValue[]): string[] => {
    if (activeConditions.length === 0) return [];
    return activeConditions
      .filter((cond) => {
        const col = columnsByKey.get(cond.columnKey);
        if (!col) return false;
        // Re-evaluate single condition for traceability display.
        const singleGroup = { id: 'x', logic: 'AND' as const, conditions: [cond] };
        return rowMatchesFilterGroup(row, singleGroup, columnsByKey);
      })
      .map((cond) => {
        const col = columnsByKey.get(cond.columnKey);
        return describeCondition(cond, col?.originalName ?? cond.columnKey);
      });
  };

  // Build ordered, visible column list for the report.
  const visibleColumnConfigs = config.columns
    .filter((c) => c.visible)
    .slice()
    .sort((a, b) => a.order - b.order);

  const reportColumns: ReportColumn[] = visibleColumnConfigs
    .map((cc) => {
      const schemaCol = columnsByKey.get(cc.key);
      if (!schemaCol) return null;
      return {
        key: cc.key,
        displayName: cc.displayName || schemaCol.originalName,
        originalName: schemaCol.originalName,
        dataType: schemaCol.dataType,
        isCurrency: config.design.currencyColumns.includes(cc.key)
      } as ReportColumn;
    })
    .filter((c): c is ReportColumn => c !== null);

  const columnIndexInValues = (key: string) => reportColumns.findIndex((c) => c.key === key);

  const toValues = (entryRaw: CellValue[]): CellValue[] =>
    reportColumns.map((rc) => {
      const schemaCol = columnsByKey.get(rc.key);
      return schemaCol ? entryRaw[schemaCol.index] ?? null : null;
    });

  // Pair each filtered raw row with its mapped display values, then sort once
  // so the flat preview and the grouped view stay perfectly in sync.
  type Combined = { sourceIndex: number; raw: CellValue[]; values: CellValue[] };
  const combined: Combined[] = filtered.map((f) => ({ sourceIndex: f.sourceIndex, raw: f.raw, values: toValues(f.raw) }));
  const sortedCombined = sortRows(combined, config.sorts, columnsByKey, columnIndexInValues);

  const reportRows: ReportRow[] = sortedCombined.map((c) => ({
    id: makeId('row'),
    sourceIndex: c.sourceIndex,
    values: c.values,
    matchedFilters: matchDescriptions(c.raw)
  }));

  // Calculations (over filtered raw rows, independent of column visibility).
  const summaries = config.calculations.map((agg) => {
    const schemaCol = agg.columnKey ? columnsByKey.get(agg.columnKey) : null;
    const isCurrency = agg.columnKey ? config.design.currencyColumns.includes(agg.columnKey) : false;
    const label = agg.label || aggregateLabel(agg.fn, schemaCol?.originalName ?? null);
    return computeAggregate(
      { ...agg, label },
      filtered.map((f) => f.raw),
      schemaCol ? schemaCol.index : null,
      config.design.currencySymbol,
      isCurrency,
      config.design.thousandsSeparator
    );
  });

  // Grouping
  let groups: ReportGroup[] | null = null;
  if (config.group.columnKey) {
    const groupCol = columnsByKey.get(config.group.columnKey);
    if (groupCol) {
      const map = new Map<string, { raw: CellValue[][]; rows: ReportRow[] }>();
      for (let i = 0; i < sortedCombined.length; i++) {
        const entry = sortedCombined[i];
        const rawVal = entry.raw[groupCol.index];
        const label = rawVal === null || rawVal === undefined || String(rawVal).trim() === '' ? '(Empty)' : String(rawVal);
        if (!map.has(label)) map.set(label, { raw: [], rows: [] });
        map.get(label)!.raw.push(entry.raw);
        map.get(label)!.rows.push(reportRows[i]);
      }
      groups = Array.from(map.entries()).map(([label, bucket]) => {
        const groupSummaries = config.group.aggregates.map((agg) => {
          const schemaCol = agg.columnKey ? columnsByKey.get(agg.columnKey) : null;
          const isCurrency = agg.columnKey ? config.design.currencyColumns.includes(agg.columnKey) : false;
          const aggLabel = agg.label || aggregateLabel(agg.fn, schemaCol?.originalName ?? null);
          return computeAggregate(
            { ...agg, label: aggLabel },
            bucket.raw,
            schemaCol ? schemaCol.index : null,
            config.design.currencySymbol,
            isCurrency,
            config.design.thousandsSeparator
          );
        });
        return { key: label, label, rows: bucket.rows, summaries: groupSummaries };
      });
    }
  }

  const warnings: string[] = [];
  if (raw.rows.length > 50000) {
    warnings.push('This is a large file. Some operations may take a moment to complete.');
  }

  return {
    columns: reportColumns,
    rows: reportRows,
    groups,
    summaries,
    stats: {
      totalRowsInFile,
      excludedRowCount: excluded.length,
      dataRowCount: meaningful.length,
      filteredRowCount: filtered.length,
      finalRowCount: filtered.length,
      totalColumnCount: schema.columns.length,
      selectedColumnCount: reportColumns.length,
      activeFilterCount: activeConditions.length,
      isGrouped: !!groups,
      isSorted: config.sorts.length > 0,
      editedCellCount
    },
    quality,
    warnings
  };
}

function emptyReport(): ProcessedReport {
  return {
    columns: [],
    rows: [],
    groups: null,
    summaries: [],
    stats: {
      totalRowsInFile: 0,
      excludedRowCount: 0,
      dataRowCount: 0,
      filteredRowCount: 0,
      finalRowCount: 0,
      totalColumnCount: 0,
      selectedColumnCount: 0,
      activeFilterCount: 0,
      isGrouped: false,
      isSorted: false,
      editedCellCount: 0
    },
    quality: [],
    warnings: []
  };
}
