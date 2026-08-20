import * as XLSX from 'xlsx';
import type { ProcessedReport } from '../types/processed';
import type { DesignConfig } from '../types/report';
import { displayCell } from '../utils/format';
import { downloadBlob, safeFileName } from './download';

export function exportExcel(report: ProcessedReport, design: DesignConfig): void {
  const aoa: (string | number | null)[][] = [];

  if (design.title) aoa.push([design.title]);
  if (design.subtitle) aoa.push([design.subtitle]);
  if (design.organization) aoa.push([design.organization]);
  if (design.showGeneratedDate) aoa.push([`Generated ${new Date().toLocaleDateString()}`]);
  if (aoa.length > 0) aoa.push([]);

  aoa.push(report.columns.map((c) => c.displayName));

  const pushRow = (values: (string | number | boolean | null)[]) => {
    aoa.push(
      report.columns.map((col, i) => {
        const raw = values[i];
        if (col.dataType === 'number' && typeof raw === 'number') return raw;
        return displayCell(raw, col.dataType, design, col.isCurrency) || null;
      })
    );
  };

  if (report.groups) {
    for (const group of report.groups) {
      aoa.push([`${group.label} (${group.rows.length} records)`]);
      for (const row of group.rows) pushRow(row.values);
      for (const s of group.summaries) aoa.push([s.label, s.displayValue]);
      aoa.push([]);
    }
  } else {
    for (const row of report.rows) pushRow(row.values);
  }

  if (report.summaries.length > 0) {
    aoa.push([]);
    for (const s of report.summaries) aoa.push([s.label, s.displayValue]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = report.columns.map((c) => ({ wch: Math.max(12, Math.min(40, c.displayName.length + 6)) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
  downloadBlob(blob, safeFileName(design.title, 'xlsx'));
}
