import type { ProcessedReport } from '../types/processed';
import type { DesignConfig } from '../types/report';
import type { PdfOrientation } from './pdfTemplates';

export { exportCsv } from './csv';
export { exportJson } from './json';
export { exportExcel } from './excel';
export { exportPdf } from './pdf';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ExportValidation {
  ok: boolean;
  problems: string[];
}

export function validateBeforeExport(report: ProcessedReport, _design: DesignConfig): ExportValidation {
  const problems: string[] = [];
  if (report.columns.length === 0) problems.push('No columns are selected. Choose at least one column before exporting.');
  if (report.stats.finalRowCount === 0) problems.push('No rows match the current filters. Adjust your filters or row selection.');
  if (report.groups) {
    const rowSum = report.groups.reduce((sum, g) => sum + g.rows.length, 0);
    if (rowSum !== report.stats.finalRowCount) problems.push('Grouped row counts do not match the filtered dataset. Please reset and try again.');
  }
  return { ok: problems.length === 0, problems };
}

export type PdfComplexityLevel = 'safe' | 'large' | 'too-large';

export interface PdfComplexityAssessment {
  level: PdfComplexityLevel;
  score: number;
  estimatedPages: number;
  rows: number;
  columns: number;
  orientation: PdfOrientation;
  checks: { label: string; ok: boolean; detail?: string }[];
  recommendation: string | null;
  alternatives: string[];
}

export function assessPdfComplexity(report: ProcessedReport, design: DesignConfig): PdfComplexityAssessment {
  const rows = report.stats.finalRowCount;
  const columns = report.stats.selectedColumnCount;
  const orientation: PdfOrientation = design.orientation === 'landscape' ? 'landscape' : 'portrait';

  const pageWidth = orientation === 'landscape' ? 842 : 595;
  const pageHeight = orientation === 'landscape' ? 595 : 842;
  const usableWidth = pageWidth - 80;
  const usableHeight = pageHeight - 120;

  const densityFactor = design.density === 'compact' ? 0.62 : 1.0;
  const rowHeightPt = 18 * densityFactor;
  const rowsPerPage = Math.max(1, Math.floor(usableHeight / rowHeightPt));

  const avgColWidthPt = usableWidth / Math.max(columns, 1);
  const readableColWidth = 46;
  const overflow = avgColWidthPt < readableColWidth;

  const basePages = Math.max(1, Math.ceil(rows / rowsPerPage));
  const groupPenalty = report.stats.isGrouped ? 1.15 : 1.0;
  const summaryPenalty = design.showSummary && report.summaries.length > 0 ? 1.05 : 1.0;
  const estimatedPages = Math.max(1, Math.ceil(basePages * groupPenalty * summaryPenalty));

  const score = Math.round(rows * columns * densityFactor * (overflow ? 1.4 : 1.0));

  const checks: PdfComplexityAssessment['checks'] = [
    { label: 'Readable column widths', ok: !overflow, detail: overflow ? `${columns} columns in ${orientation} \u2014 average width ~${Math.round(avgColWidthPt)}pt. Try Landscape or hide some columns.` : `Average column width ~${Math.round(avgColWidthPt)}pt \u2014 comfortable.` },
    { label: 'Row count within practical range', ok: rows <= 8000, detail: rows > 8000 ? `${rows.toLocaleString()} rows \u2014 PDF generation may be slow.` : `${rows.toLocaleString()} rows \u2014 fine for PDF.` },
    { label: 'No excessive text overflow', ok: !overflow, detail: overflow ? 'Some columns may wrap or truncate. Reduce columns or switch to Landscape.' : 'Columns fit the page width.' }
  ];

  let level: PdfComplexityLevel = 'safe';
  if (score > 250_000 || rows > 15000 || (overflow && columns > 14)) level = 'too-large';
  else if (score > 60_000 || rows > 8000 || overflow) level = 'large';

  const alternatives: string[] = [];
  if (overflow && orientation === 'portrait') alternatives.push('Switch to Landscape to fit more columns comfortably.');
  if (columns > 10) alternatives.push("Hide columns you don't need to widen the remaining ones.");
  if (rows > 8000) alternatives.push('Add filters to reduce the row count before exporting.');
  if (level !== 'safe') alternatives.push('Export the complete dataset as Excel or CSV instead.');

  let recommendation: string | null = null;
  if (level === 'too-large') {
    recommendation = `PDF isn't recommended for this dataset (${rows.toLocaleString()} rows \u00d7 ${columns} columns). The resulting document would be extremely large and difficult to read. Use Excel or CSV for the complete dataset, or reduce rows/columns for a PDF report.`;
  } else if (level === 'large') {
    recommendation = `PDF generation is possible but may be slow and hard to read (~${estimatedPages} pages). Consider the alternatives below, or proceed if you're sure.`;
  }

  return { level, score, estimatedPages, rows, columns, orientation, checks, recommendation, alternatives };
}

export interface PdfEligibility {
  eligible: boolean;
  reason: string | null;
}

export function checkPdfEligibility(report: ProcessedReport, design: DesignConfig): PdfEligibility {
  const a = assessPdfComplexity(report, design);
  if (a.level === 'too-large') return { eligible: false, reason: a.recommendation };
  return { eligible: true, reason: a.level === 'large' ? a.recommendation : null };
}
