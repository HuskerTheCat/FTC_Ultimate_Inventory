// CSV files the way spreadsheets write them: commas between cells, quotes around a cell that holds a comma, quote or line break.

// A spreadsheet runs a cell starting with one of these as a formula, so export puts a ' in front, and import takes it off.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value) => {
  let text = String(value ?? '');
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

// rows are lists of cell values. Starts with a byte order mark, so Excel reads accented letters right.
export const toCsv = (rows) => `﻿${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;

// Excel saves CSV files with semicolons in countries that write decimals with a comma, so the first line shows which a file uses.
const separatorOf = (line) => (line.split(';').length > line.split(',').length ? ';' : ',');

// Reads a CSV file's text into rows of cell texts, leaving out blank lines. Cells copied from a spreadsheet are the same
// with tabs between them, so pasted text is read with separator '\t'.
export function parseCsv(text, separator = separatorOf(text.split('\n', 1)[0])) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const endCell = () => {
    row.push(value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value);
    value = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((v) => v.trim())) rows.push(row);
    row = [];
  };
  const chars = text.replace(/^﻿/, '');
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (quoted) {
      if (c !== '"') value += c;
      else if (chars[i + 1] === '"') value += chars[++i];
      else quoted = false;
    } else if (c === '"' && !value) quoted = true; // only at the start of a cell, so a pasted 1/4" spacer keeps its inch mark
    else if (c === separator) endCell();
    else if (c === '\n') endRow();
    else if (c !== '\r') value += c;
  }
  endRow();
  return rows;
}
