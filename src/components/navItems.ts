import type { ReportSection } from '../types/report';

export interface NavItem {
  id: ReportSection;
  label: string;
}

export interface NavCounts {
  filters: number;
  sorts: number;
  primarySortLabel: string | null;
  columns: number;
  totalColumns: number;
  calculations: number;
  groupLabel: string | null;
  qualityIssues: number;
  hasNumericColumns: boolean;
  hasDateColumns: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'data', label: 'Data' },
  { id: 'columns', label: 'Columns' },
  { id: 'filter', label: 'Filter' },
  { id: 'sort', label: 'Sort' },
  { id: 'group', label: 'Group' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'export', label: 'Design & Export' }
];

/** Short, human state description shown under each nav item — "5 selected", "2 active", etc. */
export function navItemState(id: ReportSection, c: NavCounts): string | null {
  switch (id) {
    case 'data':
      return c.qualityIssues > 0 ? `${c.qualityIssues} issue${c.qualityIssues > 1 ? 's' : ''} found` : 'Looks clean';
    case 'columns':
      return `${c.columns} of ${c.totalColumns} selected`;
    case 'filter':
      return c.filters > 0 ? `${c.filters} active` : 'None';
    case 'sort':
      return c.sorts > 0 ? c.primarySortLabel ?? `${c.sorts} rule${c.sorts > 1 ? 's' : ''}` : 'Original order';
    case 'group':
      return c.groupLabel ?? 'None';
    case 'calculate':
      if (!c.hasNumericColumns && c.calculations === 0) return 'No numeric fields';
      return c.calculations > 0 ? `${c.calculations} summar${c.calculations > 1 ? 'ies' : 'y'}` : 'None';
    default:
      return null;
  }
}
