// PDF export templates — real report compositions, not just color themes.
//
// Each template defines its own header structure, logo placement, title
// hierarchy, metadata arrangement, table styling, summary placement,
// footer structure, spacing, margins, and typography. Selecting a template
// genuinely changes the generated PDF.
//
// Every template ships a purpose-built portrait AND landscape composition —
// landscape is never just a rotated portrait. The portrait variant favors
// fewer columns and formal reports; the landscape variant favors wide
// datasets and operational tables.

export type PdfTemplateTier = 'free' | 'premium';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfFont = 'helvetica' | 'times' | 'courier';
export type LogoPlacement = 'top-left' | 'top-right' | 'inline-left' | 'none';
export type SummaryPlacement = 'below-table' | 'header-band' | 'footer-band' | 'sidebar';
export type TitleAlign = 'left' | 'center' | 'right';

export interface PdfComposition {
  margin: { top: number; right: number; bottom: number; left: number };
  title: { font: PdfFont; size: number; align: TitleAlign; color: [number, number, number] };
  subtitle: { font: PdfFont; size: number; color: [number, number, number] };
  organization: { font: PdfFont; size: number; color: [number, number, number] };
  meta: { font: PdfFont; size: number; color: [number, number, number] };
  logo: { size: number; placement: LogoPlacement };
  accentRule: { width: number; color: [number, number, number] };
  table: {
    headFill: [number, number, number];
    headText: [number, number, number];
    bodyText: [number, number, number];
    alternateRowFill: [number, number, number];
    style: 'grid' | 'striped' | 'plain';
    fontSize: number;
    cellPadding: number;
    gridLineColor: [number, number, number];
  };
  summary: { placement: SummaryPlacement; font: PdfFont; size: number; labelColor: [number, number, number]; valueColor: [number, number, number] };
  footer: { font: PdfFont; size: number; color: [number, number, number]; pageNumbers: boolean };
  spacing: { headerToTable: number; tableToSummary: number };
}

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  tier: PdfTemplateTier;
  swatch: [string, string];
  portrait: PdfComposition;
  landscape: PdfComposition;
  comingSoon?: boolean;
}

export const DEFAULT_PDF_TEMPLATE_ID = 'classic';

const INK: [number, number, number] = [15, 23, 42];
const SLATE: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const FAINT: [number, number, number] = [148, 163, 184];
const TEAL: [number, number, number] = [14, 138, 130];
const TEAL_B: [number, number, number] = [20, 166, 155];
const AMBER: [number, number, number] = [183, 121, 31];
const WHITE: [number, number, number] = [255, 255, 255];
const PAPER: [number, number, number] = [250, 250, 248];
const NAVY: [number, number, number] = [30, 44, 74];
const GRID: [number, number, number] = [220, 222, 216];
const AMBER_TINT: [number, number, number] = [251, 241, 221];
const TEAL_TINT: [number, number, number] = [223, 243, 241];

export const PDF_TEMPLATES: PdfTemplate[] = [
  {
    id: 'classic',
    name: 'Classic Professional',
    description: 'Formal business report — left-aligned title, bordered table, summary below.',
    tier: 'free',
    swatch: ['#0F172A', '#0E8A82'],
    portrait: {
      margin: { top: 54, right: 40, bottom: 48, left: 40 },
      title: { font: 'helvetica', size: 18, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 11, color: SLATE },
      organization: { font: 'helvetica', size: 10, color: MUTED },
      meta: { font: 'helvetica', size: 9, color: FAINT },
      logo: { size: 32, placement: 'top-right' },
      accentRule: { width: 1.4, color: TEAL },
      table: { headFill: INK, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'grid', fontSize: 8, cellPadding: 6, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 9, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 8, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 16, tableToSummary: 20 }
    },
    landscape: {
      margin: { top: 48, right: 48, bottom: 44, left: 48 },
      title: { font: 'helvetica', size: 16, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 10, color: SLATE },
      organization: { font: 'helvetica', size: 9, color: MUTED },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 28, placement: 'top-right' },
      accentRule: { width: 1.2, color: TEAL },
      table: { headFill: INK, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'grid', fontSize: 7.5, cellPadding: 5, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 8.5, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7.5, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 14, tableToSummary: 16 }
    }
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    description: 'High readability — whitespace, thin rules, no fills, quietly professional.',
    tier: 'free',
    swatch: ['#FFFFFF', '#1E2C4A'],
    portrait: {
      margin: { top: 64, right: 52, bottom: 52, left: 52 },
      title: { font: 'helvetica', size: 17, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 11, color: MUTED },
      organization: { font: 'helvetica', size: 10, color: FAINT },
      meta: { font: 'helvetica', size: 9, color: FAINT },
      logo: { size: 30, placement: 'top-right' },
      accentRule: { width: 0.8, color: NAVY },
      table: { headFill: WHITE, headText: INK, bodyText: SLATE, alternateRowFill: WHITE, style: 'plain', fontSize: 8.5, cellPadding: 7, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 9, labelColor: FAINT, valueColor: INK },
      footer: { font: 'helvetica', size: 8, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 20, tableToSummary: 24 }
    },
    landscape: {
      margin: { top: 56, right: 60, bottom: 48, left: 60 },
      title: { font: 'helvetica', size: 15, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 10, color: MUTED },
      organization: { font: 'helvetica', size: 9, color: FAINT },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 26, placement: 'top-right' },
      accentRule: { width: 0.7, color: NAVY },
      table: { headFill: WHITE, headText: INK, bodyText: SLATE, alternateRowFill: WHITE, style: 'plain', fontSize: 8, cellPadding: 6, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 8.5, labelColor: FAINT, valueColor: INK },
      footer: { font: 'helvetica', size: 7.5, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 18, tableToSummary: 20 }
    }
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Centered serif title, generous margins, summary emphasized for leadership reviews.',
    tier: 'free',
    swatch: ['#FFFFFF', '#B7791F'],
    portrait: {
      margin: { top: 72, right: 56, bottom: 56, left: 56 },
      title: { font: 'times', size: 20, align: 'center', color: INK },
      subtitle: { font: 'times', size: 12, color: SLATE },
      organization: { font: 'times', size: 10, color: MUTED },
      meta: { font: 'helvetica', size: 9, color: FAINT },
      logo: { size: 34, placement: 'top-left' },
      accentRule: { width: 1.0, color: AMBER },
      table: { headFill: WHITE, headText: INK, bodyText: SLATE, alternateRowFill: AMBER_TINT, style: 'plain', fontSize: 8.5, cellPadding: 7, gridLineColor: GRID },
      summary: { placement: 'header-band', font: 'times', size: 10, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 8, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 22, tableToSummary: 22 }
    },
    landscape: {
      margin: { top: 60, right: 64, bottom: 52, left: 64 },
      title: { font: 'times', size: 18, align: 'center', color: INK },
      subtitle: { font: 'times', size: 11, color: SLATE },
      organization: { font: 'times', size: 9, color: MUTED },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 30, placement: 'top-left' },
      accentRule: { width: 0.9, color: AMBER },
      table: { headFill: WHITE, headText: INK, bodyText: SLATE, alternateRowFill: AMBER_TINT, style: 'plain', fontSize: 8, cellPadding: 6, gridLineColor: GRID },
      summary: { placement: 'header-band', font: 'times', size: 9, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7.5, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 18, tableToSummary: 18 }
    }
  },
  {
    id: 'modern',
    name: 'Modern Table',
    description: 'Contemporary data-heavy report — bold dark header, striped rows, teal accent.',
    tier: 'free',
    swatch: ['#0F172A', '#14A69B'],
    portrait: {
      margin: { top: 48, right: 36, bottom: 44, left: 36 },
      title: { font: 'helvetica', size: 18, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 11, color: SLATE },
      organization: { font: 'helvetica', size: 10, color: MUTED },
      meta: { font: 'helvetica', size: 9, color: FAINT },
      logo: { size: 32, placement: 'top-right' },
      accentRule: { width: 1.6, color: TEAL_B },
      table: { headFill: INK, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'striped', fontSize: 8, cellPadding: 6, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 9, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 8, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 14, tableToSummary: 18 }
    },
    landscape: {
      margin: { top: 44, right: 44, bottom: 40, left: 44 },
      title: { font: 'helvetica', size: 16, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 10, color: SLATE },
      organization: { font: 'helvetica', size: 9, color: MUTED },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 28, placement: 'top-right' },
      accentRule: { width: 1.4, color: TEAL_B },
      table: { headFill: INK, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'striped', fontSize: 7.5, cellPadding: 5, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 8.5, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7.5, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 12, tableToSummary: 16 }
    }
  },
  {
    id: 'compact',
    name: 'Compact Data',
    description: 'Optimized for large datasets — denser rows, smaller type, more records per page.',
    tier: 'free',
    swatch: ['#1E2C4A', '#DFF3F1'],
    portrait: {
      margin: { top: 40, right: 30, bottom: 36, left: 30 },
      title: { font: 'helvetica', size: 15, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 9, color: SLATE },
      organization: { font: 'helvetica', size: 8, color: MUTED },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 24, placement: 'top-right' },
      accentRule: { width: 1.0, color: TEAL },
      table: { headFill: NAVY, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'striped', fontSize: 7, cellPadding: 4, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 8, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 10, tableToSummary: 12 }
    },
    landscape: {
      margin: { top: 36, right: 36, bottom: 32, left: 36 },
      title: { font: 'helvetica', size: 14, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 8.5, color: SLATE },
      organization: { font: 'helvetica', size: 8, color: MUTED },
      meta: { font: 'helvetica', size: 7.5, color: FAINT },
      logo: { size: 22, placement: 'top-right' },
      accentRule: { width: 0.9, color: TEAL },
      table: { headFill: NAVY, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'striped', fontSize: 6.8, cellPadding: 3.5, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 7.5, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 8, tableToSummary: 10 }
    }
  },
  {
    id: 'branded-premium',
    name: 'Branded',
    description: 'Your logo, colors, and footer applied automatically to every export.',
    tier: 'premium',
    comingSoon: true,
    swatch: ['#0F172A', '#B7791F'],
    portrait: {
      margin: { top: 54, right: 40, bottom: 48, left: 40 },
      title: { font: 'helvetica', size: 18, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 11, color: SLATE },
      organization: { font: 'helvetica', size: 10, color: MUTED },
      meta: { font: 'helvetica', size: 9, color: FAINT },
      logo: { size: 36, placement: 'inline-left' },
      accentRule: { width: 1.4, color: AMBER },
      table: { headFill: INK, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'striped', fontSize: 8, cellPadding: 6, gridLineColor: GRID },
      summary: { placement: 'footer-band', font: 'helvetica', size: 9, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 8, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 16, tableToSummary: 20 }
    },
    landscape: {
      margin: { top: 48, right: 48, bottom: 44, left: 48 },
      title: { font: 'helvetica', size: 16, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 10, color: SLATE },
      organization: { font: 'helvetica', size: 9, color: MUTED },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 32, placement: 'inline-left' },
      accentRule: { width: 1.2, color: AMBER },
      table: { headFill: INK, headText: WHITE, bodyText: SLATE, alternateRowFill: PAPER, style: 'striped', fontSize: 7.5, cellPadding: 5, gridLineColor: GRID },
      summary: { placement: 'footer-band', font: 'helvetica', size: 8.5, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7.5, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 14, tableToSummary: 16 }
    }
  },
  {
    id: 'custom-premium',
    name: 'Fully Custom',
    description: 'Design your own layout, typography, and section order.',
    tier: 'premium',
    comingSoon: true,
    swatch: ['#14A69B', '#0F172A'],
    portrait: {
      margin: { top: 54, right: 40, bottom: 48, left: 40 },
      title: { font: 'helvetica', size: 18, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 11, color: SLATE },
      organization: { font: 'helvetica', size: 10, color: MUTED },
      meta: { font: 'helvetica', size: 9, color: FAINT },
      logo: { size: 32, placement: 'top-right' },
      accentRule: { width: 1.4, color: TEAL_B },
      table: { headFill: TEAL_B, headText: WHITE, bodyText: SLATE, alternateRowFill: TEAL_TINT, style: 'striped', fontSize: 8, cellPadding: 6, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 9, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 8, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 16, tableToSummary: 20 }
    },
    landscape: {
      margin: { top: 48, right: 48, bottom: 44, left: 48 },
      title: { font: 'helvetica', size: 16, align: 'left', color: INK },
      subtitle: { font: 'helvetica', size: 10, color: SLATE },
      organization: { font: 'helvetica', size: 9, color: MUTED },
      meta: { font: 'helvetica', size: 8, color: FAINT },
      logo: { size: 28, placement: 'top-right' },
      accentRule: { width: 1.2, color: TEAL_B },
      table: { headFill: TEAL_B, headText: WHITE, bodyText: SLATE, alternateRowFill: TEAL_TINT, style: 'striped', fontSize: 7.5, cellPadding: 5, gridLineColor: GRID },
      summary: { placement: 'below-table', font: 'helvetica', size: 8.5, labelColor: MUTED, valueColor: INK },
      footer: { font: 'helvetica', size: 7.5, color: FAINT, pageNumbers: true },
      spacing: { headerToTable: 14, tableToSummary: 16 }
    }
  }
];

export function getPdfTemplate(id: string): PdfTemplate {
  return PDF_TEMPLATES.find((t) => t.id === id && t.tier === 'free') ?? PDF_TEMPLATES[0];
}

export function getComposition(templateId: string, orientation: PdfOrientation): PdfComposition {
  const t = getPdfTemplate(templateId);
  return orientation === 'landscape' ? t.landscape : t.portrait;
}
