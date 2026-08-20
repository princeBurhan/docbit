import type { CellValue, ColumnSchema, DataQualityIssue, DataType, DatasetSchema, RawDataset } from '../types/dataset';
import { makeId } from '../utils/id';
import { toDate, toNumber } from '../utils/format';

const SAMPLE_SIZE = 200;

/** Infers the most likely header row within the first N rows of a file. */
export function guessHeaderRow(rows: CellValue[][]): number {
  const limit = Math.min(rows.length, 25);
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || row.every((c) => isEmptyCell(c))) continue;

    const nonEmpty = row.filter((c) => !isEmptyCell(c));
    if (nonEmpty.length < 2) continue;

    const allStrings = nonEmpty.every((c) => typeof c === 'string' || typeof c === 'number');
    const uniqueRatio = new Set(nonEmpty.map((c) => String(c).trim().toLowerCase())).size / nonEmpty.length;
    const looksNumericHeavy = nonEmpty.filter((c) => typeof c === 'number').length / nonEmpty.length;

    // Check the following row: header rows are usually followed by data rows
    // whose types differ from a plain label row.
    const nextRow = rows[i + 1];
    let followedByData = 0;
    if (nextRow) {
      const nextNonEmpty = nextRow.filter((c) => !isEmptyCell(c));
      followedByData = nextNonEmpty.length >= Math.max(1, Math.floor(nonEmpty.length * 0.5)) ? 1 : 0;
    }

    let score = nonEmpty.length * 2 + uniqueRatio * 5 + followedByData * 6 - looksNumericHeavy * 3;
    if (!allStrings) score -= 1;
    // Rows that are almost entirely a single long string (titles) score low.
    if (nonEmpty.length <= 1) score -= 10;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function isEmptyCell(c: CellValue): boolean {
  return c === null || c === undefined || String(c).trim() === '';
}

export function buildSchema(raw: RawDataset, headerRowIndex: number): DatasetSchema {
  const rows = raw.rows;
  const clampedHeaderIndex = Math.min(Math.max(headerRowIndex, 0), Math.max(rows.length - 1, 0));
  const headerRow = rows[clampedHeaderIndex] ?? [];
  const dataStartIndex = clampedHeaderIndex + 1;
  const dataEndIndex = rows.length;

  const columnCount = Math.max(raw.columnCount, headerRow.length);
  const usedNames = new Map<string, number>();
  const columns: ColumnSchema[] = [];
  const quality: DataQualityIssue[] = [];

  let emptyHeaderCount = 0;
  let duplicateHeaderCount = 0;

  for (let colIndex = 0; colIndex < columnCount; colIndex++) {
    const rawName = headerRow[colIndex];
    let name = rawName === null || rawName === undefined ? '' : String(rawName).trim();

    if (!name) {
      emptyHeaderCount += 1;
      name = `Column ${colIndex + 1}`;
    }

    const lower = name.toLowerCase();
    if (usedNames.has(lower)) {
      duplicateHeaderCount += 1;
      const count = usedNames.get(lower)! + 1;
      usedNames.set(lower, count);
      name = `${name} (${count})`;
    } else {
      usedNames.set(lower, 1);
    }

    const sample = sampleColumn(rows, colIndex, dataStartIndex, dataEndIndex);
    columns.push({
      key: `col_${colIndex}`,
      index: colIndex,
      originalName: name,
      dataType: sample.dataType,
      emptyCount: sample.emptyCount,
      sampledCount: sample.sampledCount
    });
  }

  if (emptyHeaderCount > 0) {
    quality.push({
      id: makeId('q'),
      severity: 'warning',
      message: `${emptyHeaderCount} column${emptyHeaderCount > 1 ? 's' : ''} had no header name and ${emptyHeaderCount > 1 ? 'were' : 'was'} labeled automatically.`
    });
  }
  if (duplicateHeaderCount > 0) {
    quality.push({
      id: makeId('q'),
      severity: 'warning',
      message: `${duplicateHeaderCount} duplicate header name${duplicateHeaderCount > 1 ? 's were' : ' was'} found and renamed to stay unique.`
    });
  }

  const totalDataRows = dataEndIndex - dataStartIndex;
  if (totalDataRows === 0) {
    quality.push({
      id: makeId('q'),
      severity: 'warning',
      message: 'No data rows were found below the selected header row.'
    });
  }

  return { headerRowIndex: clampedHeaderIndex, columns, dataStartIndex, dataEndIndex, quality };
}

function sampleColumn(
  rows: CellValue[][],
  colIndex: number,
  start: number,
  end: number
): { dataType: DataType; emptyCount: number; sampledCount: number } {
  let seen = 0;
  let empty = 0;
  let numberCount = 0;
  let boolCount = 0;
  let dateCount = 0;
  let stringCount = 0;

  const limit = Math.min(end, start + SAMPLE_SIZE);
  for (let r = start; r < limit; r++) {
    const cell = rows[r]?.[colIndex] ?? null;
    seen += 1;
    if (isEmptyCell(cell)) {
      empty += 1;
      continue;
    }
    if (typeof cell === 'boolean') {
      boolCount += 1;
    } else if (typeof cell === 'number') {
      numberCount += 1;
    } else if (toDate(cell) && !/^\d+$/.test(String(cell).trim())) {
      dateCount += 1;
    } else if (toNumber(cell) !== null && String(cell).trim() !== '') {
      numberCount += 1;
    } else {
      stringCount += 1;
    }
  }

  const nonEmpty = seen - empty;
  let dataType: DataType = 'empty';
  if (nonEmpty > 0) {
    const counts: [DataType, number][] = [
      ['number', numberCount],
      ['boolean', boolCount],
      ['date', dateCount],
      ['string', stringCount]
    ];
    counts.sort((a, b) => b[1] - a[1]);
    const [topType, topCount] = counts[0];
    dataType = topCount / nonEmpty >= 0.8 ? topType : 'mixed';
  }

  return { dataType, emptyCount: empty, sampledCount: seen };
}
