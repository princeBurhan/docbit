// Canonical internal data model shared by every input adapter.
// Every adapter (Excel, CSV, JSON) normalizes into this shape so the
// report engine never needs to know the original file format.

export type CellValue = string | number | boolean | null;

export type SourceFileType = 'xlsx' | 'xls' | 'csv' | 'json';

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'mixed';

export interface DatasetMeta {
  fileName: string;
  fileType: SourceFileType;
  fileSize: number;
  sheetName?: string;
  sheetNames?: string[];
  importedAt: string;
}

/**
 * RawDataset is the untouched, normalized representation of the uploaded
 * file. It is never mutated after creation. Every row from the source file
 * is preserved (including title rows, blank rows, etc.) so the user can
 * choose the correct header row and row range in the UI.
 */
export interface RawDataset {
  id: string;
  meta: DatasetMeta;
  rows: CellValue[][];
  columnCount: number;
}

export interface ColumnSchema {
  key: string; // stable internal identifier, e.g. "col_0" — never changes even if renamed
  index: number; // index into a data row array
  originalName: string; // name as detected from the header row
  dataType: DataType;
  emptyCount: number;
  sampledCount: number;
}

export interface DataQualityIssue {
  id: string;
  severity: 'info' | 'warning';
  message: string;
  columnKey?: string;
}

export interface DatasetSchema {
  headerRowIndex: number;
  columns: ColumnSchema[];
  dataStartIndex: number; // index into rows[] where data begins (headerRowIndex + 1)
  dataEndIndex: number; // exclusive end index into rows[]
  quality: DataQualityIssue[];
}
