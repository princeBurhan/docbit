// PDF export templates. Each template controls the visual presentation of
// the exported PDF (colors, header layout, table density) without touching
// what data goes into the report — that's still entirely driven by the
// single authoritative ProcessedReport produced by engine/pipeline.ts.
//
// Structured for easy extension: adding a paid-tier template later is just
// adding another entry with tier: 'premium'. The export code
// (export/pdf.ts) already reads every visual property from here, so no
// export logic needs to change when new templates are added — only this
// registry and, eventually, real plan-gating logic where `tier` is checked.

export type PdfTemplateTier = 'free' | 'premium';

export interface PdfTemplateStyle {
  /** RGB triplets, 0-255, matching jsPDF's color API. */
  headerFill: [number, number, number];
  headerText: [number, number, number];
  accent: [number, number, number];
  alternateRowFill: [number, number, number];
  bodyText: [number, number, number];
  titleFont: 'helvetica' | 'times' | 'courier';
  tableStyle: 'grid' | 'striped' | 'plain';
  cornerRadius: number; // for header band / accent bar, in pt
}

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  tier: PdfTemplateTier;
  /** Small swatch colors shown in the template picker UI (not used by jsPDF). */
  swatch: [string, string];
  style: PdfTemplateStyle;
  comingSoon?: boolean;
}

export const DEFAULT_PDF_TEMPLATE_ID = 'modern';

export const PDF_TEMPLATES: PdfTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold dark header with a teal accent — DocBit\u2019s signature look.',
    tier: 'free',
    swatch: ['#0F172A', '#14A69B'],
    style: {
      headerFill: [15, 23, 42],
      headerText: [255, 255, 255],
      accent: [14, 138, 130],
      alternateRowFill: [247, 248, 250],
      bodyText: [30, 41, 59],
      titleFont: 'helvetica',
      tableStyle: 'striped',
      cornerRadius: 0
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean whitespace, thin rules, no fills — quietly professional.',
    tier: 'free',
    swatch: ['#FFFFFF', '#1E2C4A'],
    style: {
      headerFill: [255, 255, 255],
      headerText: [15, 23, 42],
      accent: [30, 44, 74],
      alternateRowFill: [255, 255, 255],
      bodyText: [30, 41, 59],
      titleFont: 'helvetica',
      tableStyle: 'plain',
      cornerRadius: 0
    }
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Classic bordered table with a serif title — built for finance and audit reports.',
    tier: 'free',
    swatch: ['#F4F5F2', '#0F172A'],
    style: {
      headerFill: [244, 245, 242],
      headerText: [15, 23, 42],
      accent: [15, 23, 42],
      alternateRowFill: [250, 250, 248],
      bodyText: [30, 41, 59],
      titleFont: 'times',
      tableStyle: 'grid',
      cornerRadius: 0
    }
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Denser rows and smaller type — fits more records per page.',
    tier: 'free',
    swatch: ['#1E2C4A', '#DFF3F1'],
    style: {
      headerFill: [30, 44, 74],
      headerText: [255, 255, 255],
      accent: [14, 138, 130],
      alternateRowFill: [244, 245, 242],
      bodyText: [30, 41, 59],
      titleFont: 'helvetica',
      tableStyle: 'striped',
      cornerRadius: 0
    }
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Centered title, generous margins, and a summary emphasis for leadership reviews.',
    tier: 'free',
    swatch: ['#FFFFFF', '#B7791F'],
    style: {
      headerFill: [255, 255, 255],
      headerText: [15, 23, 42],
      accent: [183, 121, 31],
      alternateRowFill: [251, 241, 221],
      bodyText: [30, 41, 59],
      titleFont: 'times',
      tableStyle: 'plain',
      cornerRadius: 0
    }
  },
  {
    id: 'branded-premium',
    name: 'Branded',
    description: 'Your logo, colors, and footer applied automatically to every export.',
    tier: 'premium',
    comingSoon: true,
    swatch: ['#0F172A', '#B7791F'],
    style: {
      headerFill: [15, 23, 42],
      headerText: [255, 255, 255],
      accent: [183, 121, 31],
      alternateRowFill: [247, 248, 250],
      bodyText: [30, 41, 59],
      titleFont: 'helvetica',
      tableStyle: 'striped',
      cornerRadius: 0
    }
  },
  {
    id: 'custom-premium',
    name: 'Fully Custom',
    description: 'Design your own layout, typography, and section order.',
    tier: 'premium',
    comingSoon: true,
    swatch: ['#14A69B', '#0F172A'],
    style: {
      headerFill: [20, 166, 155],
      headerText: [255, 255, 255],
      accent: [15, 23, 42],
      alternateRowFill: [223, 243, 241],
      bodyText: [30, 41, 59],
      titleFont: 'helvetica',
      tableStyle: 'striped',
      cornerRadius: 0
    }
  }
];

export function getPdfTemplate(id: string): PdfTemplate {
  return PDF_TEMPLATES.find((t) => t.id === id && t.tier === 'free') ?? PDF_TEMPLATES[0];
}
