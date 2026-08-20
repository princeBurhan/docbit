import type { CellValue } from '../types/dataset';
import type { DesignConfig } from '../types/report';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatNumber(n: number, thousands: boolean): string {
  if (!Number.isFinite(n)) return '';
  if (thousands) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return String(Math.round(n * 100) / 100);
}

export function formatDate(value: CellValue, format: DesignConfig['dateFormat']): string {
  const d = toDate(value);
  if (!d) return value === null || value === undefined ? '' : String(value);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  switch (format) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`;
    case 'DD MMM YYYY':
    default:
      return `${dd} ${months[d.getMonth()]} ${yyyy}`;
  }
}

export function toDate(value: CellValue): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    if (value > 20000 && value < 80000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(epoch.getTime() + value * 86400000);
    }
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const isoLike = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
    const slashLike = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(trimmed);
    if (isoLike || slashLike) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }
  return null;
}

export function displayCell(
  value: CellValue,
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'mixed',
  design: DesignConfig,
  isCurrency: boolean
): string {
  if (value === null || value === undefined || value === '') return '';
  if (dataType === 'date') return formatDate(value, design.dateFormat);
  if (dataType === 'number' && typeof value === 'number') {
    const formatted = formatNumber(value, design.thousandsSeparator);
    return isCurrency ? `${design.currencySymbol}${formatted}` : formatted;
  }
  if (dataType === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function toNumber(value: CellValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return null;
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[,$₹€£\s]/g, '');
  if (cleaned === '' || isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}
