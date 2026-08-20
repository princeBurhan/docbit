import type { ProcessedReport } from '../types/processed';
import type { DesignConfig } from '../types/report';

export { exportCsv } from './csv';
export { exportJson } from './json';
export { exportExcel } from './excel';
export { exportPdf } from './pdf';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ExportValidation {
  ok: boolean;
  problems: string[];
}

/** Final consistency check before an export runs. Never silently exports. */
export function validateBeforeExport(report: ProcessedReport, _design: DesignConfig): ExportValidation {
  const problems: string[] = [];

  if (report.columns.length === 0) {
    problems.push('No columns are selected. Choose at least one column before exporting.');
  }
  if (report.stats.finalRowCount === 0) {
    problems.push('No rows match the current filters. Adjust your filters or row selection.');
  }
  if (report.groups) {
    const rowSum = report.groups.reduce((sum, g) => sum + g.rows.length, 0);
    if (rowSum !== report.stats.finalRowCount) {
      problems.push('Grouped row counts do not match the filtered dataset. Please reset and try again.');
    }
  }

  return { ok: problems.length === 0, problems };
}

// PDF-specific export limits. PDF is a fixed, printable layout — wide (many
// columns) or very large (many rows) reports don't lay out well and can be
// slow to generate client-side, so PDF is gated more conservatively than the
// data export formats (Excel/CSV/JSON), which handle both cases fine.
export const PDF_MAX_COLUMNS = 10;
export const PDF_MAX_ROWS = 5000;

export interface PdfEligibility {
  eligible: boolean;
  reason: string | null;
}

/** Whether the current report is a good fit for a PDF export, with a clear, specific reason when it isn't. */
export function checkPdfEligibility(report: ProcessedReport): PdfEligibility {
  if (report.stats.selectedColumnCount >= PDF_MAX_COLUMNS) {
    return {
      eligible: false,
      reason: `PDF export supports up to ${PDF_MAX_COLUMNS - 1} columns — this report has ${report.stats.selectedColumnCount}. Hide a few columns, or use Excel, CSV, or JSON instead.`
    };
  }
  if (report.stats.finalRowCount > PDF_MAX_ROWS) {
    return {
      eligible: false,
      reason: `PDF export works best under ${PDF_MAX_ROWS.toLocaleString()} rows — this report has ${report.stats.finalRowCount.toLocaleString()}. Narrow it with filters, or use Excel, CSV, or JSON instead.`
    };
  }
  return { eligible: true, reason: null };
}
