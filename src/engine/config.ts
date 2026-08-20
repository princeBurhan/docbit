import type { DatasetSchema } from '../types/dataset';
import type { ColumnConfig, ReportConfig } from '../types/report';
import { makeId } from '../utils/id';
import { DEFAULT_PDF_TEMPLATE_ID } from '../export/pdfTemplates';

export function createDefaultConfig(schema: DatasetSchema): ReportConfig {
  const columns: ColumnConfig[] = schema.columns.map((col, i) => ({
    key: col.key,
    visible: true,
    displayName: col.originalName,
    order: i
  }));

  return {
    headerRowIndex: schema.headerRowIndex,
    excludedRanges: [],
    columns,
    filterGroup: { id: makeId('fg'), logic: 'AND', conditions: [] },
    sorts: [],
    group: { columnKey: null, aggregates: [] },
    calculations: [],
    cellEdits: {},
    design: {
      title: 'Untitled Report',
      subtitle: '',
      organization: '',
      showGeneratedDate: true,
      showSummary: true,
      currencySymbol: '$',
      currencyColumns: [],
      thousandsSeparator: true,
      dateFormat: 'DD MMM YYYY',
      orientation: 'portrait',
      density: 'comfortable',
      pdfTemplateId: DEFAULT_PDF_TEMPLATE_ID,
      branding: { enabled: false, logoDataUrl: null, accentColor: '#0E8A82', footerText: '', contactInfo: '', showPageNumbers: true }
    }
  };
}

/** Rebuilds column config when the header row changes, preserving user intent where possible. */
export function remapColumnsForNewSchema(
  previous: ColumnConfig[],
  schema: DatasetSchema
): ColumnConfig[] {
  const prevByKey = new Map(previous.map((c) => [c.key, c]));
  return schema.columns.map((col, i) => {
    const prev = prevByKey.get(col.key);
    return {
      key: col.key,
      visible: prev ? prev.visible : true,
      displayName: prev && prev.displayName ? prev.displayName : col.originalName,
      order: prev ? prev.order : i
    };
  });
}
