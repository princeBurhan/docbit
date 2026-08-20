import type { ProcessedReport } from '../types/processed';
import type { DesignConfig } from '../types/report';
import { downloadBlob, safeFileName } from './download';

export function buildJsonPayload(report: ProcessedReport, design: DesignConfig): unknown {
  const rowsToObjects = (rows: typeof report.rows) =>
    rows.map((row) => {
      const obj: Record<string, unknown> = {};
      report.columns.forEach((col, i) => {
        obj[col.displayName] = row.values[i];
      });
      return obj;
    });

  const payload: Record<string, unknown> = {
    report: {
      title: design.title,
      subtitle: design.subtitle || undefined,
      organization: design.organization || undefined,
      generatedAt: design.showGeneratedDate ? new Date().toISOString() : undefined
    },
    columns: report.columns.map((c) => c.displayName),
    recordCount: report.stats.finalRowCount
  };

  if (report.groups) {
    payload.groups = report.groups.map((g) => ({
      group: g.label,
      count: g.rows.length,
      summaries: Object.fromEntries(g.summaries.map((s) => [s.label, s.value])),
      records: rowsToObjects(g.rows)
    }));
  } else {
    payload.records = rowsToObjects(report.rows);
  }

  if (report.summaries.length > 0) {
    payload.summaries = Object.fromEntries(report.summaries.map((s) => [s.label, s.value]));
  }

  return payload;
}

export function exportJson(report: ProcessedReport, design: DesignConfig): void {
  const payload = buildJsonPayload(report, design);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, safeFileName(design.title, 'json'));
}
