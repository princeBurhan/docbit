import type { CellValue, DataQualityIssue } from './dataset';
import type { AggregateConfig } from './report';

export interface ReportColumn {
  key: string;
  displayName: string;
  originalName: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'mixed';
  isCurrency: boolean;
}

export interface ReportRow {
  id: string; // stable id derived from source row index, for traceability
  sourceIndex: number; // 1-based position in the original file
  values: CellValue[]; // aligned with ProcessedReport.columns
  matchedFilters: string[]; // human-readable descriptions of why this row is included
}

export interface ReportGroup {
  key: string;
  label: string;
  rows: ReportRow[];
  summaries: SummaryResult[];
}

export interface SummaryResult {
  id: string;
  label: string;
  fn: AggregateConfig['fn'];
  columnKey: string | null;
  value: number;
  displayValue: string;
}

export interface ProcessedReport {
  columns: ReportColumn[];
  rows: ReportRow[]; // filtered + sorted, flat (used when no grouping)
  groups: ReportGroup[] | null; // populated when grouping is active
  summaries: SummaryResult[];
  stats: {
    totalRowsInFile: number;
    excludedRowCount: number;
    dataRowCount: number; // rows after header + exclusions, before filtering
    filteredRowCount: number; // rows after filters
    finalRowCount: number; // rows actually in the report (== filteredRowCount)
    totalColumnCount: number;
    selectedColumnCount: number;
    activeFilterCount: number;
    isGrouped: boolean;
    isSorted: boolean;
    editedCellCount: number;
  };
  quality: DataQualityIssue[];
  warnings: string[];
}
