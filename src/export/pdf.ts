import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProcessedReport } from '../types/processed';
import type { DesignConfig } from '../types/report';
import { displayCell } from '../utils/format';
import { safeFileName } from './download';
import { getComposition, type PdfComposition, type PdfOrientation } from './pdfTemplates';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num) || full.length !== 6) return [14, 138, 130];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function bestTextColor(bg: [number, number, number]): [number, number, number] {
  const luminance = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255;
  return luminance > 0.6 ? [15, 23, 42] : [255, 255, 255];
}

function imageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' | null {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return null;
}

export function exportPdf(report: ProcessedReport, design: DesignConfig): void {
  const orientation: PdfOrientation = design.orientation === 'landscape' ? 'landscape' : 'portrait';
  const base = getComposition(design.pdfTemplateId, orientation);
  const branding = design.branding;

  const accent = branding.enabled ? hexToRgb(branding.accentColor) : base.accentRule.color;
  const composition: PdfComposition = branding.enabled
    ? {
        ...base,
        accentRule: { ...base.accentRule, color: accent },
        table: { ...base.table, headFill: accent, headText: bestTextColor(accent) }
      }
    : base;

  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const m = composition.margin;
  const contentWidth = pageWidth - m.left - m.right;

  let cursorY = drawHeader(doc, composition, design, report, branding, pageWidth, m);
  cursorY += composition.spacing.headerToTable;

  const head = [report.columns.map((c) => c.displayName)];
  const bodyFor = (rows: ProcessedReport['rows']) =>
    rows.map((row) => row.values.map((v, i) => displayCell(v, report.columns[i].dataType, design, report.columns[i].isCurrency)));

  const t = composition.table;
  const headStyles = { fillColor: t.headFill, textColor: t.headText, lineColor: composition.accentRule.color, lineWidth: t.style === 'grid' ? 0.6 : 0 };
  const bodyStyles = { textColor: t.bodyText };
  const alternateRowStyles = { fillColor: t.alternateRowFill };
  const gridLine = t.style === 'grid' ? { lineColor: t.gridLineColor, lineWidth: 0.5 } : {};
  const didDrawPage = (data: { pageNumber: number }) => drawFooter(doc, composition, design, branding, data.pageNumber, pageWidth, pageHeight, m);

  if (report.groups) {
    let startY = cursorY;
    for (const group of report.groups) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(t.fontSize + 1);
      doc.setTextColor(15, 23, 42);
      doc.text(`${group.label} (${group.rows.length})`, m.left, startY);
      startY += t.fontSize + 4;

      autoTable(doc, {
        head, body: bodyFor(group.rows), startY,
        margin: { left: m.left, right: m.right },
        styles: { fontSize: t.fontSize, cellPadding: t.cellPadding, overflow: 'linebreak', ...gridLine },
        headStyles, bodyStyles, alternateRowStyles, theme: t.style, didDrawPage
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 14;

      if (group.summaries.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(t.fontSize);
        doc.setTextColor(...t.bodyText);
        const line = group.summaries.map((s) => `${s.label}: ${s.displayValue}`).join('   \u00b7   ');
        doc.text(line, m.left, startY);
        startY += 14;
      }
    }
  } else {
    autoTable(doc, {
      head, body: bodyFor(report.rows), startY: cursorY,
      margin: { left: m.left, right: m.right, bottom: m.bottom + 24 },
      styles: { fontSize: t.fontSize, cellPadding: t.cellPadding, overflow: 'linebreak', ...gridLine },
      headStyles, bodyStyles, alternateRowStyles, theme: t.style, showHead: 'everyPage', didDrawPage
    });
  }

  if (design.showSummary && report.summaries.length > 0 && composition.summary.placement !== 'header-band') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = ((doc as any).lastAutoTable?.finalY ?? cursorY) + composition.spacing.tableToSummary;
    drawSummaryBlock(doc, composition, report.summaries, finalY, m.left, contentWidth);
  }

  doc.save(safeFileName(design.title, 'pdf'));
}

function drawHeader(
  doc: jsPDF, c: PdfComposition, design: DesignConfig, report: ProcessedReport,
  branding: DesignConfig['branding'], pageWidth: number, m: PdfComposition['margin']
): number {
  const align = c.title.align;
  const titleX = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - m.right : m.left;
  const textOpts = align === 'left' ? undefined : { align: align as 'center' | 'right' };
  let y = m.top;

  const logoFormat = branding.enabled && branding.logoDataUrl ? imageFormatFromDataUrl(branding.logoDataUrl) : null;
  if (logoFormat && branding.logoDataUrl && c.logo.placement !== 'none') {
    const sz = c.logo.size;
    try {
      if (c.logo.placement === 'top-right') doc.addImage(branding.logoDataUrl, logoFormat, pageWidth - m.right - sz, m.top - 4, sz, sz, undefined, 'FAST');
      else if (c.logo.placement === 'top-left') doc.addImage(branding.logoDataUrl, logoFormat, m.left, m.top - 4, sz, sz, undefined, 'FAST');
      else if (c.logo.placement === 'inline-left') doc.addImage(branding.logoDataUrl, logoFormat, m.left, y, sz, sz, undefined, 'FAST');
    } catch { /* skip corrupt logo */ }
  }

  const inlineOffset = c.logo.placement === 'inline-left' && logoFormat ? c.logo.size + 10 : 0;
  const titleXShifted = align === 'left' ? titleX + inlineOffset : titleX;

  if (design.title) {
    doc.setFont(c.title.font, 'bold'); doc.setFontSize(c.title.size); doc.setTextColor(...c.title.color);
    doc.text(design.title, titleXShifted, y, textOpts); y += c.title.size + 4;
  }
  if (design.subtitle) {
    doc.setFont(c.subtitle.font, 'normal'); doc.setFontSize(c.subtitle.size); doc.setTextColor(...c.subtitle.color);
    doc.text(design.subtitle, titleXShifted, y, textOpts); y += c.subtitle.size + 3;
  }
  if (design.organization) {
    doc.setFont(c.organization.font, 'normal'); doc.setFontSize(c.organization.size); doc.setTextColor(...c.organization.color);
    doc.text(design.organization, titleXShifted, y, textOpts); y += c.organization.size + 3;
  }
  if (design.showGeneratedDate) {
    doc.setFont(c.meta.font, 'normal'); doc.setFontSize(c.meta.size); doc.setTextColor(...c.meta.color);
    doc.text(`Generated ${new Date().toLocaleDateString()} \u00b7 ${report.stats.finalRowCount} records`, titleXShifted, y, textOpts); y += c.meta.size + 3;
  }

  if (design.showSummary && report.summaries.length > 0 && c.summary.placement === 'header-band') {
    y += 4;
    doc.setFont(c.summary.font, 'normal'); doc.setFontSize(c.summary.size);
    report.summaries.forEach((s) => {
      doc.setTextColor(...c.summary.labelColor); doc.text(`${s.label}:`, m.left, y);
      doc.setTextColor(...c.summary.valueColor); doc.text(s.displayValue, m.left + 110, y);
      y += c.summary.size + 4;
    });
    y -= 2;
  }

  doc.setDrawColor(...c.accentRule.color); doc.setLineWidth(c.accentRule.width);
  doc.line(m.left, y + 4, pageWidth - m.right, y + 4);
  y += 8;
  return y;
}

function drawSummaryBlock(
  doc: jsPDF, c: PdfComposition, summaries: ProcessedReport['summaries'],
  y: number, x: number, _w: number
): void {
  doc.setFont(c.summary.font, 'bold'); doc.setFontSize(c.summary.size + 1); doc.setTextColor(15, 23, 42);
  doc.text('Summary', x, y);
  doc.setFont(c.summary.font, 'normal'); doc.setFontSize(c.summary.size);
  summaries.forEach((s, i) => {
    doc.setTextColor(...c.summary.labelColor); doc.text(`${s.label}:`, x, y + 14 + i * (c.summary.size + 5));
    doc.setTextColor(...c.summary.valueColor); doc.text(s.displayValue, x + 110, y + 14 + i * (c.summary.size + 5));
  });
}

function drawFooter(
  doc: jsPDF, c: PdfComposition, design: DesignConfig, branding: DesignConfig['branding'],
  pageNumber: number, pageWidth: number, pageHeight: number, m: PdfComposition['margin']
): void {
  doc.setFont(c.footer.font, 'normal'); doc.setFontSize(c.footer.size); doc.setTextColor(...c.footer.color);
  const footerLeft = branding.enabled && branding.footerText ? branding.footerText : 'Generated with DocBit';
  const contact = branding.enabled && branding.contactInfo ? branding.contactInfo : '';
  doc.text(contact ? `${footerLeft} \u00b7 ${contact}` : footerLeft, m.left, pageHeight - m.bottom + 16);
  if (c.footer.pageNumbers && branding.showPageNumbers) {
    doc.text(`Page ${pageNumber}`, pageWidth - m.right - 40, pageHeight - m.bottom + 16);
  }
}
