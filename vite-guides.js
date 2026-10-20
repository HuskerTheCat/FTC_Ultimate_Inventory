import { cpSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import { Marked } from 'marked';

// The guides as pages on the website, made from the .md files at build time so the .md files stay the only copy.
// The pages use the app's stylesheet: its colors, fonts, light mode and topographic background (the .guide rules in style.css).
const GUIDES = ['README.md', 'SETUP.md', 'PRIVACY.md', 'docs/HOW-TO.md', 'docs/QUICK-START.md', 'docs/TROUBLESHOOTING.md', 'docs/ADMIN.md', 'docs/DEVELOPMENT.md'];
// The scroll script of the app, inlined so the pages have the same moving background.
const REPO_URL = 'https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/blob/main/';

// README becomes the guide list; the others keep their path in lower case, e.g. docs/HOW-TO.md -> docs/how-to.html.
const pagePath = (file) => (file === 'README.md' ? 'guides.html' : file.replace(/\.md$/, '.html').toLowerCase());

// Links to other guides go to their pages, files in docs/ are copied next to the pages, anything else opens on GitHub.
function siteHref(href, file) {
  if (/^([a-z]+:|#)/i.test(href)) return href;
  const [path, hash = ''] = href.split(/(?=#)/);
  const target = posix.normalize(posix.join(posix.dirname(file), path));
  if (GUIDES.includes(target)) return posix.relative(posix.dirname(pagePath(file)), pagePath(target)) + hash;
  if (target.startsWith('docs/')) return href;
  return REPO_URL + target + hash;
}

// Heading ids the way GitHub makes them, so links like SETUP.md#updating-the-rules land on the same heading.
function headingRenderer() {
  const used = new Map();
  return function heading({ tokens, depth }) {
    const html = this.parser.parseInline(tokens);
    const base = html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;|&#\d+;/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return `<h${depth} id="${count ? `${base}-${count}` : base}">${html}</h${depth}>\n`;
  };
}

// On the website the header picture becomes a text heading and the divider pictures go; the styles draw both.
// The README's hero image goes too: it has its own topographic background, which clashes with the page's.
function pageHtml(file, css) {
  const markdown = readFileSync(file, 'utf8')
    .replace(/^<h1><picture>.*?alt="([^"]+)".*<\/h1>$/m, '# $1')
    .replace(/^<picture>.*divider.*<\/picture>\n/gm, '')
    .replace(/^<img src="docs\/hero\.jpg".*\n/m, '');
  const title = markdown.match(/^# (.+)$/m)?.[1];
  if (!title) throw new Error(`${file} has no title`);
  const marked = new Marked({
    renderer: { heading: headingRenderer() },
    walkTokens(token) { if (token.type === 'link') token.href = siteHref(token.href, file); },
  });
  const root = '../'.repeat(pagePath(file).split('/').length - 1);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0e1221">
<title>${title}</title>
<link rel="icon" href="${root}icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}${css}">
<script>document.documentElement.dataset.theme = localStorage.getItem('ftc-inventory-theme') ?? 'dark';</script>
</head>
<body class="guide">
<header><a class="brand" href="${root || './'}"><img src="${root}icon.svg" alt="" width="28" height="28">FTC Ultimate <span class="app-name">Inventory</span></a><a href="${root}guides.html">Guides</a></header>
<main>
${marked.parse(markdown)}</main>
</body>
</html>
`;
}

export function guides() {
  let css;
  let outDir;
  return {
    name: 'guides',
    // Only the website; the Windows and Android apps link to the guides here.
    apply: (_, { command, mode }) => command === 'build' && mode !== 'app',
    configResolved(config) { outDir = config.build.outDir; },
    generateBundle(_, bundle) {
      const styles = Object.keys(bundle).filter((name) => name.endsWith('.css'));
      if (styles.length !== 1) throw new Error(`Expected one stylesheet for the guides, found ${styles.length}`);
      [css] = styles;
    },
    writeBundle() {
      cpSync('docs', `${outDir}/docs`, { recursive: true, filter: (path) => !path.endsWith('.md') });
      for (const file of GUIDES) {
        const out = `${outDir}/${pagePath(file)}`;
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, pageHtml(file, css));
      }
    },
  };
}
