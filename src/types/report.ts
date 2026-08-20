// Report configuration: the user's instructions for turning a RawDataset
// into a report. This is never mutated destructively into the source data —
// it is a separate, serializable description of intent.

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'ncontains'
  | 'startsWith'
  | 'endsWith'
  | 'empty'
  | 'nempty'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'between'
  | 'onDate'
  | 'before'
  | 'after'
  | 'dateBetween';

export interface FilterCondition {
  id: string;
  columnKey: string;
  operator: FilterOperator;
  value: string;
  value2: string; // used by "between" style operators
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface SortRule {
  id: string;
  columnKey: string;
  direction: 'asc' | 'desc';
}

export type AggregateFn = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface AggregateConfig {
  id: string;
  fn: AggregateFn;
  columnKey: string | null; // null only valid for "count"
  label: string;
}

export interface GroupConfig {
  columnKey: string | null;
  aggregates: AggregateConfig[];
}

export interface ColumnConfig {
  key: string;
  visible: boolean;
  displayName: string;
  order: number;
}

export interface RowRange {
  id: string;
  start: number; // 1-based, inclusive, refers to position within the raw file
  end: number; // 1-based, inclusive
}

export interface BrandingConfig {
  enabled: boolean;
  logoDataUrl: string | null;
  accentColor: string; // hex, e.g. "#0E8A82" — drives PDF header/accent color when enabled
  footerText: string;
  contactInfo: string; // optional website / phone line shown in footer
  showPageNumbers: boolean;
}

export interface DesignConfig {
  title: string;
  subtitle: string;
  organization: string;
  showGeneratedDate: boolean;
  showSummary: boolean;
  currencySymbol: string;
  currencyColumns: string[]; // column keys formatted as currency
  thousandsSeparator: boolean;
  dateFormat: 'DD MMM YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  orientation: 'portrait' | 'landscape';
  density: 'compact' | 'comfortable';
  pdfTemplateId: string; // see engine/../export/pdfTemplates.ts
  branding: BrandingConfig;
}

/**
 * Direct, in-place edits made to individual report cells from the live
 * preview. Keyed by `${sourceIndex}:${columnKey}` and stored as raw strings
 * (parsed back to the column's data type when the pipeline applies them).
 * The original RawDataset is never touched — these are pure configuration,
 * so they participate in undo/redo exactly like any other report setting,
 * and "Reset report" clears them along with everything else.
 */
export type CellEdits = Record<string, string>;

export interface ReportConfig {
  headerRowIndex: number;
  excludedRanges: RowRange[];
  columns: ColumnConfig[];
  filterGroup: FilterGroup;
  sorts: SortRule[];
  group: GroupConfig;
  calculations: AggregateConfig[];
  design: DesignConfig;
  cellEdits: CellEdits;
}

export type ReportSection =
  | 'data'
  | 'columns'
  | 'filter'
  | 'sort'
  | 'group'
  | 'calculate'
  | 'export';
