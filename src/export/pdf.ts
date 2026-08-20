import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProcessedReport } from '../types/processed';
import type { DesignConfig } from '../types/report';
import { displayCell } from '../utils/format';
import { safeFileName } from './download';
import { getPdfTemplate, type PdfTemplateStyle } from './pdfTemplates';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num) || full.length !== 6) return [14, 138, 130];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function imageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' | null {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return null;
}

export function exportPdf(report: ProcessedReport, design: DesignConfig): void {
  const template = getPdfTemplate(design.pdfTemplateId);
  const style: PdfTemplateStyle = template.style;
  const branding = design.branding;
  const accent = branding.enabled ? hexToRgb(branding.accentColor) : style.accent;
  const headerFill = branding.enabled ? accent : style.headerFill;
  const headerText = branding.enabled ? bestTextColor(accent) : style.headerText;

  const doc = new jsPDF({
    orientation: design.orientation === 'landscape' ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const marginLeft = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const centered = template.style.titleFont === 'times'; // Ledger/Executive read as more formal, centered layouts
  let cursorY = 42;
  let titleX = marginLeft;

  // Logo (top-right), when custom branding is enabled and a logo was provided.
  const logoFormat = branding.enabled && branding.logoDataUrl ? imageFormatFromDataUrl(branding.logoDataUrl) : null;
  if (logoFormat && branding.logoDataUrl) {
    try {
      const logoSize = 36;
      doc.addImage(branding.logoDataUrl, logoFormat, pageWidth - marginLeft - logoSize, 30, logoSize, logoSize, undefined, 'FAST');
    } catch {
      // Corrupt or unsupported image data — skip the logo rather than fail the whole export.
    }
  }

  if (centered) {
    titleX = pageWidth / 2;
  }

  const textOpts = centered ? { align: 'center' as const } : undefined;

  if (design.title) {
    doc.setFont(style.titleFont, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(design.title, titleX, cursorY, textOpts);
    cursorY += 22;
  }
  if (design.subtitle) {
    doc.setFont(style.titleFont, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(design.subtitle, titleX, cursorY, textOpts);
    cursorY += 16;
  }
  if (design.organization) {
    doc.setFont(style.titleFont, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(design.organization, titleX, cursorY, textOpts);
    cursorY += 14;
  }
  if (design.showGeneratedDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated ${new Date().toLocaleDateString()} · ${report.stats.finalRowCount} records`, titleX, cursorY, textOpts);
    cursorY += 14;
  }

  // Thin accent rule under the header block — the one element every template shows.
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(1.4);
  doc.line(marginLeft, cursorY + 4, pageWidth - marginLeft, cursorY + 4);
  cursorY += 16;

  const head = [report.columns.map((c) => c.displayName)];
  const bodyFor = (rows: ProcessedReport['rows']) =>
    rows.map((row) => row.values.map((v, i) => displayCell(v, report.columns[i].dataType, design, report.columns[i].isCurrency)));

  const density = design.density === 'compact' ? 4 : 7;
  const tableTheme = style.tableStyle === 'plain' ? 'plain' : style.tableStyle === 'grid' ? 'grid' : 'striped';
  const headStyles = { fillColor: headerFill, textColor: headerText, lineColor: accent, lineWidth: style.tableStyle === 'grid' ? 0.6 : 0 };
  const bodyStyles = { textColor: style.bodyText };
  const alternateRowStyles = { fillColor: style.alternateRowFill };
  const gridLine = style.tableStyle === 'grid' ? { lineColor: [220, 222, 216] as [number, number, number], lineWidth: 0.5 } : {};

  if (report.groups) {
    let startY = cursorY;
    for (const group of report.groups) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${group.label} (${group.rows.length})`, marginLeft, startY);
      startY += 12;

      autoTable(doc, {
        head,
        body: bodyFor(group.rows),
        startY,
        margin: { left: marginLeft, right: marginLeft },
        styles: { fontSize: 8, cellPadding: density, overflow: 'linebreak', ...gridLine },
        headStyles,
        bodyStyles,
        alternateRowStyles,
        theme: tableTheme,
        didDrawPage: (data) => addFooter(doc, data.pageNumber, design)
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 16;

      if (group.summaries.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const summaryLine = group.summaries.map((s) => `${s.label}: ${s.displayValue}`).join('   ·   ');
        doc.text(summaryLine, marginLeft, startY);
        startY += 18;
      }
    }
  } else {
    autoTable(doc, {
      head,
      body: bodyFor(report.rows),
      startY: cursorY,
      margin: { left: marginLeft, right: marginLeft, bottom: 50 },
      styles: { fontSize: 8, cellPadding: density, overflow: 'linebreak', ...gridLine },
      headStyles,
      bodyStyles,
      alternateRowStyles,
      theme: tableTheme,
      showHead: 'everyPage',
      didDrawPage: (data) => addFooter(doc, data.pageNumber, design)
    });
  }

  if (design.showSummary && report.summaries.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = ((doc as any).lastAutoTable?.finalY ?? cursorY) + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Summary', marginLeft, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    report.summaries.forEach((s, i) => {
      doc.text(`${s.label}: ${s.displayValue}`, marginLeft, finalY + 16 + i * 14);
    });
  }

  doc.save(safeFileName(design.title, 'pdf'));
}

function bestTextColor(bg: [number, number, number]): [number, number, number] {
  const luminance = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255;
  return luminance > 0.6 ? [15, 23, 42] : [255, 255, 255];
}

function addFooter(doc: jsPDF, pageNumber: number, design: DesignConfig): void {
  const pageSize = doc.internal.pageSize;
  const pageWidth = pageSize.getWidth();
  const pageHeight = pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const footerLeft = design.branding.enabled && design.branding.footerText ? design.branding.footerText : 'Generated with DocBit';
  doc.text(footerLeft, 36, pageHeight - 20);
  doc.text(`Page ${pageNumber}`, pageWidth - 60, pageHeight - 20);
}
