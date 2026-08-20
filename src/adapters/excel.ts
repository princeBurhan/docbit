import * as XLSX from 'xlsx';
import type { CellValue, RawDataset } from '../types/dataset';
import { makeId } from '../utils/id';
import { normalizeRows } from './normalize';
import { AdapterError } from './errors';

export async function parseExcelFile(file: File): Promise<RawDataset> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new AdapterError("We couldn't read this file from disk. Please try again.");
  }

  if (buffer.byteLength === 0) {
    throw new AdapterError('This file is empty.');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
  } catch {
    throw new AdapterError('This Excel file could not be opened. It may be corrupted or in an unsupported format.');
  }

  const sheetNames = workbook.SheetNames.filter((name) => {
    const sheet = workbook.Sheets[name];
    return sheet && sheet['!ref'];
  });

  if (sheetNames.length === 0) {
    throw new AdapterError('No readable sheets were found in this workbook.');
  }

  // Prefer the first non-empty sheet by default.
  const sheetName = sheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  let aoa: unknown[][];
  try {
    aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null, blankrows: true }) as unknown[][];
  } catch {
    throw new AdapterError('We could not extract data from this spreadsheet.');
  }

  const { rows, columnCount } = normalizeRows(aoa as CellValue[][]);

  if (rows.length === 0) {
    throw new AdapterError('This spreadsheet does not contain any rows of data.');
  }

  return {
    id: makeId('ds'),
    meta: {
      fileName: file.name,
      fileType: file.name.toLowerCase().endsWith('.xls') ? 'xls' : 'xlsx',
      fileSize: file.size,
      sheetName,
      sheetNames,
      importedAt: new Date().toISOString()
    },
    rows,
    columnCount
  };
}
