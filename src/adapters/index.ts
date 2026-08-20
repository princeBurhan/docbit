import type { RawDataset } from '../types/dataset';
import { parseExcelFile } from './excel';
import { parseCsvFile } from './csv';
import { parseJsonFile } from './json';
import { AdapterError } from './errors';

export { AdapterError };

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB practical browser-memory ceiling

export async function parseFile(file: File): Promise<RawDataset> {
  if (file.size === 0) {
    throw new AdapterError('This file is empty.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AdapterError(
      `This file is ${(file.size / (1024 * 1024)).toFixed(0)} MB, which is larger than DocBit can process reliably in the browser (100 MB limit). Try splitting it into smaller files.`
    );
  }

  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseExcelFile(file);
  }
  if (name.endsWith('.csv')) {
    return parseCsvFile(file);
  }
  if (name.endsWith('.json')) {
    return parseJsonFile(file);
  }

  throw new AdapterError('DocBit supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files. This file type is not supported yet.');
}
