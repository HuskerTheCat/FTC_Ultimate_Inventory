import QRCode from 'qrcode';

// Prints a sheet of QR labels. Each label is { url, title, subtitle }.
export async function printLabels(labels) {
  const sheet = document.createElement('div');
  sheet.id = 'labels';
  for (const label of labels) {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = await QRCode.toDataURL(label.url, { width: 240, margin: 1 });
    await image.decode(); // printing before an image is decoded leaves a blank label
    const caption = document.createElement('figcaption');
    caption.append(element('strong', label.title), element('span', label.subtitle));
    figure.append(image, caption);
    sheet.append(figure);
  }
  print(sheet);
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
