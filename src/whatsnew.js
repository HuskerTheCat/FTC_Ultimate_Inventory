// What's new: WHATS-NEW.md from the repo's main branch, so every copy of the app shows the latest list without a new release.
const WHATS_NEW_URL = 'https://raw.githubusercontent.com/HuskerTheCat/FTC_Ultimate_Inventory/main/WHATS-NEW.md';
// The top section this device last opened, so ☰ shows a dot only when it changes.
const SEEN_KEY = 'ftc-inventory-whats-new-seen';

// The file from its first version heading on; the title and note above it are for whoever edits the file.
async function fetchSections() {
  const response = await fetch(WHATS_NEW_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Couldn’t load What’s new (${response.status}).`);
  const text = await response.text();
  const start = text.indexOf('\n## ');
  if (start < 0) throw new Error('WHATS-NEW.md has no ## sections.');
  return text.slice(start + 1);
}

const topSection = (sections) => sections.split(/\n(?=## )/)[0].trim();

export async function hasUnseenNews() {
  return topSection(await fetchSections()) !== localStorage.getItem(SEEN_KEY);
}

// The sections as HTML, links opening outside the app. Opening them counts as seen.
export async function whatsNewHtml() {
  const [sections, { marked }] = await Promise.all([fetchSections(), import('marked')]);
  localStorage.setItem(SEEN_KEY, topSection(sections));
  return marked.parse(sections).replaceAll('<a href=', '<a target="_blank" rel="noopener" href=');
}
