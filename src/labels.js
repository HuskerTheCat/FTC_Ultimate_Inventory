import QRCode from 'qrcode';
import { CUBE_MARK } from './cube.js';

// Normal and stylized labels fit OnlineLabels OL911 sheets: letter paper, 3 across and 7 down, 2.5" x 1.25" each.
// Mini labels are tiny codes to cut out, each captioned outside its cut line.
export const LABEL_SHEET_URL = 'https://www.onlinelabels.com/products/ol911';
export const LABEL_STYLES = { normal: 'Normal', stylized: 'Stylized', mini: 'Mini' };
const PER_PAGE = { normal: 21, stylized: 21, mini: 110 };

// Prints QR labels in one of LABEL_STYLES. Each label is { url, title, subtitle }.
export async function printLabels(labels, style) {
  if (!PER_PAGE[style]) throw new Error(`Unknown label style: ${style}`);
  await document.fonts.ready; // a font still loading prints in the fallback font
  const sheet = document.createElement('div');
  sheet.id = 'labels';
  sheet.className = style;
  // The pages are laid out to the inch, so the printer's own margins have to go.
  sheet.append(Object.assign(document.createElement('style'), { textContent: '@page { size: letter; margin: 0; }' }));
  for (let i = 0; i < labels.length; i += PER_PAGE[style]) {
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = labels.slice(i, i + PER_PAGE[style]).map((label, j) => LABEL[style](label, i + j)).join('');
    sheet.append(page);
  }
  print(sheet);
}

const LABEL = {
  normal: (label) => `<figure${short(label)}>${qr(label.url)}${caption(label)}</figure>`,
  // The whole label is a patch of the topographic map, a different patch on each, with the code on a white tile.
  stylized: (label, i) => `<figure${short(label)} style="--topo-x: ${(i * 37) % 100}%; --topo-y: ${(i * 53) % 100}%">
    ${brandedQr(label.url)}${caption(label)}${CUBE_MARK}
  </figure>`,
  mini: (label) => `<figure><div class="cut">${qr(label.url)}</div>${caption(label)}</figure>`,
};

// A short title, like a grid spot's C12, prints big.
const short = ({ title }) => (title.length <= 4 ? ' class="short"' : '');

const caption = ({ title, subtitle }) => `<figcaption><strong>${escape(title)}</strong><span>${escape(subtitle)}</span></figcaption>`;

// A plain black QR code.
function qr(url) {
  const { modules } = QRCode.create(url);
  let path = '';
  for (let r = 0; r < modules.size; r++) {
    for (let c = 0; c < modules.size; c++) if (modules.get(r, c)) path += `M${c} ${r}h1v1h-1z`;
  }
  return `<svg class="qr" viewBox="0 0 ${modules.size} ${modules.size}" shape-rendering="crispEdges" aria-hidden="true"><path d="${path}"/></svg>`;
}

// A QR code in the app's look: navy modules with softened corners, blue corner eyes, on a white tile. Modules stay full
// size and the eyes a dark blue: gaps between modules, or the brighter blue, made blurry photos on the dark label fail.
function brandedQr(url) {
  const { modules } = QRCode.create(url);
  const n = modules.size;
  const eyes = [[0, 0], [0, n - 7], [n - 7, 0]];
  const inEye = (r, c) => eyes.some(([er, ec]) => r >= er && r < er + 7 && c >= ec && c < ec + 7);
  let dots = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules.get(r, c) && !inEye(r, c)) dots += `<rect x="${c}" y="${r}" width="1" height="1" rx="0.25"/>`;
    }
  }
  const eye = ([r, c]) => `<rect x="${c + 0.5}" y="${r + 0.5}" width="6" height="6" rx="1.8" fill="none" stroke="#1e40af"/>
    <rect x="${c + 2}" y="${r + 2}" width="3" height="3" rx="0.9" fill="#13204a"/>`;
  return `<svg class="qr" viewBox="-3 -3 ${n + 6} ${n + 6}" aria-hidden="true">
    <rect x="-3" y="-3" width="${n + 6}" height="${n + 6}" rx="3" fill="#fff"/>
    <g fill="#13204a">${dots}</g>${eyes.map(eye).join('')}
  </svg>`;
}

// Prints a table. groups is [[heading, rows]], each row a list of cell texts; a blank heading prints no heading row.
export function printSheet(title, subtitle, headers, groups) {
  const sheet = document.createElement('div');
  sheet.id = 'sheet';
  const head = document.createElement('thead');
  head.append(tableRow('th', headers));
  const body = document.createElement('tbody');
  for (const [heading, rows] of groups) {
    if (heading) {
      const row = tableRow('th', [heading]);
      row.className = 'group';
      row.firstChild.colSpan = headers.length;
      body.append(row);
    }
    body.append(...rows.map((cells) => tableRow('td', cells)));
  }
  const table = document.createElement('table');
  table.append(head, body);
  sheet.append(element('h1', title), element('p', subtitle), table);
  print(sheet);
}

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function tableRow(tag, cells) {
  const row = document.createElement('tr');
  row.append(...cells.map((text) => element(tag, text)));
  return row;
}

// The sheet is only shown when printing (see style.css) and goes away afterwards.
function print(sheet) {
  document.body.append(sheet);
  window.addEventListener('afterprint', () => sheet.remove(), { once: true });
  window.print();
}

const escape = (text) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
