import QRCode from 'qrcode';
import * as firebase from './firebase.js';
import { parseFirebaseConfig, encodeJoinCode, decodeJoinCode, findTeam, newSecret } from './joincode.js';
import { scanCode, BARCODES } from './scanner.js';
import { codeKey, findProduct } from './catalog.js';
import { printLabels, printSheet } from './labels.js';
import { toCsv, parseCsv } from './csv.js';
import { startStatusBanners, checkRules } from './status.js';
import { RULES, consolePage, AUTH_PAGE, RULES_PAGE, AUTH_OFF_CODES, setupProblems } from './setup.js';
import { PROGRAMS, recordTeam, recordDeletedTeam, findTeamProject, teamProject, sendBugReport } from './hub.js';

const WEB_URL = 'https://huskerthecat.github.io/FTC_Ultimate_Inventory/';
const PRIVACY_URL = 'https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/blob/main/PRIVACY.md';
const SETUP_URL = 'https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/blob/main/SETUP.md';
const GUIDE_URL = 'https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/blob/main/docs/HOW-TO.md';
// The AGPL license asks anyone hosting a version of the app to offer its source; forks should point this at their own code.
const SOURCE_URL = 'https://github.com/HuskerTheCat/FTC_Ultimate_Inventory';
const STORAGE_KEY = 'ftc-inventory-connection';
// Opening the app with ?demo runs it on sample data instead of a team's Firebase project (see demo.js).
const DEMO = new URLSearchParams(location.search).has('demo');
const FIELDS = [
  ['name', 'Item'],
  ['partNumber', 'Part #'],
  ['quantity', 'Qty'],
  ['location', 'Location'],
  ['supplier', 'Supplier'],
  ['category', 'Category'],
];
// Part fields edited in the part dialog but not shown as their own table columns.
const DETAIL_FIELDS = [
  ['unit', 'Unit'],
  ['condition', 'Condition'],
  ['notes', 'Notes'],
];
const UNITS = ['pcs', 'pack', 'box', 'm', 'ft'];
const CONDITIONS = { '': 'Condition not set', new: 'New', used: 'Used', broken: 'Broken' };

const SEARCH_KEYS = ['name', 'partNumber', 'barcode', 'supplier', 'location', 'category', 'condition', 'notes'];
// Small line icons that take the button's text color.
const icon = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON_EDIT = icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>');
const ICON_CHEVRON = icon('<path d="m6 9 6 6 6-6"/>');
const ICON_SCAN = icon('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>');
const ICON_MENU = icon('<path d="M4 6h16M4 12h16M4 18h16"/>');
const ICON_MORE = icon('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>');
const ICON_FILTER = icon('<path d="M4 6h16M7 12h10M10 18h4"/>');
const ICON_PLUS = icon('<path d="M12 5v14M5 12h14"/>');

// Every project is an inventory (holds its own parts), a project or a packing list (both use parts from inventories).
const TYPES = {
  inventory: {
    label: 'Inventory', plural: 'Inventories',
    icon: icon('<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>'),
    about: 'Holds its own parts. Projects and packing lists can use parts from any inventory.',
  },
  project: {
    label: 'Project', plural: 'Projects',
    icon: icon('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>'),
    about: 'Lists the parts a robot or build uses, from any inventory. Those parts show as in use in their inventory.',
  },
  packing: {
    label: 'Packing list', plural: 'Packing lists',
    icon: icon('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>'),
    about: 'Lists parts to pack, from any inventory. Each part shows as in use once it’s checked off as packed.',
  },
};

// The unfiltered view that "Reset filters" returns to.
const DEFAULT_FILTERS = { search: '', category: '', location: '', tag: '', low: false, sort: 'name', sortDir: 1, group: '' };

let fb = firebase;
const app = document.getElementById('app');
const state = {
  connection: null, user: null, parts: [], projects: [], uses: [], members: [], locations: [], orders: [], printed: new Set(), loaded: new Set(), pendingLink: null, picker: null, newProjectId: null,
  projectId: fb.MAIN_PROJECT, ...DEFAULT_FILTERS, selected: null,
};

// ---------- helpers ----------

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// People are shown by their username; accounts made before usernames existed fall back to their email.
const nameOf = (member) => member?.name || member?.email.split('@')[0].slice(0, 40) || 'Someone';
const me = () => ({ uid: state.user.uid, name: nameOf(state.members.find((m) => m.uid === state.user.uid) ?? { email: state.user.email }) });
const nameByEmail = (email) => nameOf(state.members.find((m) => m.email === email) ?? { email });
const nameByUid = (uid, fallback) => state.members.find((m) => m.uid === uid)?.name || fallback;

const sorted = (values) => [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b));
const unique = (rows, key) => sorted(rows.map((p) => p[key]));
const allTags = (rows) => sorted(rows.flatMap((p) => p.tags));
// Every word of the search has to be in some field or tag, so "m4 screw" finds "M4 x 8mm socket head screw".
const matches = (part, query) => query.split(/\s+/).filter(Boolean).every((word) =>
  SEARCH_KEYS.some((key) => String(part[key] ?? '').toLowerCase().includes(word)) || part.tags.some((t) => t.includes(word)));

// A "/" in a category separates levels, so "Hardware/Screws" also lists (and filters as) "Hardware".
// Capitalization is ignored, so "electronics" and "Electronics" are one category (the first spelling wins).
const categoryPaths = (rows) => {
  const paths = new Map();
  for (const path of sorted(rows.flatMap((p) => p.category.split('/').map((_, i, levels) => levels.slice(0, i + 1).join('/'))))) {
    if (!paths.has(path.toLowerCase())) paths.set(path.toLowerCase(), path);
  }
  return [...paths.values()];
};
const inCategory = (part, category) => {
  const own = part.category.toLowerCase();
  return own === category.toLowerCase() || own.startsWith(category.toLowerCase() + '/');
};
// How a category is shown: "Hardware › Screws" for "Hardware/Screws".
const categoryLabel = (category) => category.split('/').join(' › ');
const cleanCategory = (text) => text.split('/').map((level) => level.trim()).filter(Boolean).join('/');
// Spells a typed category the way the team already spells it, level by level.
function canonicalCategory(text) {
  const known = new Map(categoryPaths(state.parts).map((path) => [path.toLowerCase(), path]));
  return cleanCategory(text).split('/').reduce((path, level) => {
    const next = path ? `${path}/${level}` : level;
    return known.get(next.toLowerCase()) ?? next;
  }, '');
}

const parseTags = (text) =>
  [...new Set(text.split(',').map((tag) => tag.trim().toLowerCase().slice(0, 40)).filter(Boolean))].slice(0, 20);
// The × on a removable tag chip.
const TAG_X = '<span class="x" aria-hidden="true">×</span>';
const tagChips = (tags) => tags.length
  ? `<div class="tags">${tags.map((t) => `<button type="button" class="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>`
  : '';

const project = (id) => state.projects.find((p) => p.id === id);
const currentProject = () => project(state.projectId);
const inventoryParts = (projectId) => state.parts.filter((p) => p.projectId === projectId);
const useOf = (projectId, partId) => state.uses.find((u) => u.projectId === projectId && u.partId === partId);
const usesOfPart = (partId) => state.uses.filter((u) => u.partId === partId);
const isPacking = (projectId) => project(projectId)?.kind === 'packing';
const typeOf = (p) => (!p.source ? 'inventory' : p.kind === 'packing' ? 'packing' : 'project');
const inventories = () => state.projects.filter((p) => !p.source);
// Which inventory a part is in, worth showing only once the team has more than one.
const inventoryNote = (part) => (inventories().length > 1 ? project(part.projectId)?.name ?? '' : '');
// A packing list only holds a part once it's checked off as packed.
const holdsPart = (use) => use.packed !== false;
const inUse = (partId) => usesOfPart(partId).filter(holdsPart).reduce((sum, u) => sum + u.quantity, 0);
// How many of a part the team is waiting on from the order list.
const onOrder = (partId) => state.orders.filter((o) => o.partId === partId).reduce((sum, o) => sum + o.quantity, 0);
// None of the part has arrived yet: the team has none and some are on order.
const waiting = (partId) => onOrder(partId) > 0 && !state.parts.find((p) => p.id === partId).quantity;
// The inventory part's free count (what projects and packed lists aren't using) is down to its "Low stock at" quantity
// or below. Parts without one are never low.
const lowStock = (partId) => {
  const part = state.parts.find((p) => p.id === partId);
  return part.minQuantity != null && part.quantity - inUse(partId) <= part.minQuantity;
};
// Numeric so "Bin 2" sorts before "Bin 10".
const naturalCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Firebase errors only say "Error (auth/…)" or "Missing or insufficient permissions", so these get their own words.
const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'That email address isn’t valid.',
  'auth/email-already-in-use': 'There’s already an account with that email. Sign in instead.',
  'auth/too-many-requests': 'Too many tries. Wait a few minutes, then try again.',
  'auth/network-request-failed': 'Can’t reach the server. Check your internet connection.',
  // Firestore's code for something it can't do offline, like reading what this device hasn't stored yet.
  unavailable: 'That needs an internet connection. Try again once you’re back online.',
  // Usually a new version of the app that needs the new firestore.rules.
  'permission-denied': 'The server didn’t allow that change. If the app was just updated, ask your team admin to publish the latest firestore.rules (see SETUP.md).',
};

const ERROR_MS = 10000;
let errorTimer;

// Shows a message at the top for a few seconds, so it doesn't stay up after the problem is fixed.
function showError(error) {
  const message = ERROR_MESSAGES[error.code] ?? error.message.replace(/^Firebase: /, '').replace(/\s*\(.*\)\.?$/, '');
  const banner = document.getElementById('error');
  banner.textContent = message;
  if (error.link) banner.append(' ', Object.assign(document.createElement('a'), { href: error.link, target: '_blank', rel: 'noopener', textContent: error.linkText }));
  banner.hidden = false;
  clearTimeout(errorTimer);
  errorTimer = setTimeout(() => { banner.hidden = true; }, ERROR_MS);
}

// An error that links to where it can be fixed, like a page of the team's Firebase project.
const errorWithLink = (message, link, linkText) => Object.assign(new Error(message), { link, linkText });

// Asks for a line of text over whatever dialog is open. The Windows app has no prompt(), so the app uses this instead.
// Resolves with the trimmed text, or '' when cancelled. `value` fills the box to start with.
function ask(question, value = '') {
  const dialog = app.querySelector('#ask');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <label>${esc(question)}<input name="answer" value="${esc(value)}" /></label>
      <div class="row">
        <button value="ok">OK</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
      </div>
    </form>`;
  dialog.returnValue = ''; // Escape keeps the last returnValue
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok' ? dialog.querySelector('input').value.trim() : ''), { once: true });
  });
}

function saveConnection(connection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
  location.reload();
}

// The join secret is only needed to join. Once in, this device forgets it, so the next person to use it can't join with it.
function forgetSecret() {
  if (!state.connection.secret) return;
  delete state.connection.secret;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.connection));
}

function forgetConnection() {
  localStorage.removeItem(STORAGE_KEY);
  location.hash = '';
  location.reload();
}

// ---------- screens ----------

// Grey placeholder rows shaped like part rows, shown until the inventory arrives.
const skeletonRows = () => [70, 45, 60, 80, 50, 65].map((width) => `
  <tr class="loading" aria-hidden="true">
    <td class="name"><div class="skeleton" style="width: ${width}%"></div></td>
    <td data-label="Part #"><div class="skeleton"></div></td>
    <td data-label="Qty" class="qty"><div class="skeleton"></div></td>
    <td data-label="Location"><div class="skeleton"></div></td>
    <td data-label="Supplier"><div class="skeleton"></div></td>
    <td data-label="Category"><div class="skeleton"></div></td>
  </tr>`).join('');

// Shown while signing in and joining the team, before the inventory screen can be built.
function renderLoading() {
  app.innerHTML = `
    <header><div class="skeleton title"></div></header>
    <table aria-busy="true" aria-label="Loading inventory"><tbody>${skeletonRows()}</tbody></table>`;
}

// The team's program and number, as on the welcome screen's forms.
const teamFields = () => `
  <div class="teamid">
    <select name="program" aria-label="Program">${PROGRAMS.map((p) => `<option>${p}</option>`).join('')}</select>
    <input name="teamNumber" required inputmode="numeric" pattern="[1-9][0-9]{0,5}" placeholder="Team number, e.g. 26706" />
  </div>`;

// The join QR code holds the join link (…#join=CODE); anything else is taken as a typed join code.
const joinCodeFrom = (text) => new URLSearchParams(text.split('#')[1]).get('join') ?? text;

function renderWelcome() {
  app.innerHTML = `
    <main class="center wide">
      <h1>FTC Ultimate Inventory</h1>
      <p id="error" class="error" hidden></p>
      <form id="signin" class="card">
        <h2>Sign in to your team</h2>
        <p class="muted">Already have an account? Enter your team number, then sign in with your email. New to the team? Join it first with your join code.</p>
        ${teamFields()}
        <button>Next</button>
      </form>
      <form id="join" class="card">
        <h2>Join a team</h2>
        <p class="muted">New to the team? Scan the QR code or paste the join code your team admin shared with you, then create your account.</p>
        <input name="code" required autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Join code" />
        <div class="row">
          <button>Join team</button>
          <button type="button" id="scan-join" class="secondary">Scan QR</button>
        </div>
      </form>
      <div class="card">
        <h2>Set up a new team</h2>
        <p class="muted">For one person per team, once. Your team gets its own free Firebase project.</p>
        <button id="setup" class="secondary">Start setup</button>
      </div>
      <div class="card">
        <h2>Just looking?</h2>
        <p class="muted">Try the app with sample parts. Nothing is saved.</p>
        <button id="demo" class="secondary">Try the demo</button>
      </div>
    </main>
    <dialog id="dialog"></dialog>`;

  app.querySelector('#demo').onclick = () => { location.search = 'demo'; };
  app.querySelector('#setup').onclick = renderSetup;
  app.querySelector('#signin').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const { program, teamNumber } = e.target;
      saveConnection({ ...await findTeam(await findTeamProject(program.value, Number(teamNumber.value))), role: 'member' });
    } catch (error) {
      showError(error);
    }
  };
  app.querySelector('#join').onsubmit = async (e) => {
    e.preventDefault();
    try {
      saveConnection({ ...await decodeJoinCode(e.target.code.value), role: 'member' });
    } catch (error) {
      showError(error);
    }
  };
  app.querySelector('#scan-join').onclick = () => scanCode(app.querySelector('#dialog'), 'Scan the join QR code', 'Point the camera at your team’s join QR code.')
    .then((text) => {
      if (!text) return;
      const form = app.querySelector('#join');
      form.code.value = joinCodeFrom(text);
      form.requestSubmit();
    }).catch(showError);
}

// The setup steps in short, with the details in SETUP.md. Creating the team first checks the Firebase project (see setup.js).
function renderSetup() {
  app.innerHTML = `
    <main class="center wide">
      <h1>Set up a new team</h1>
      <p id="error" class="error" hidden></p>
      <div class="card">
        <p class="muted">One person per team does this once, in about 10 minutes. The <a href="${SETUP_URL}" target="_blank" rel="noopener">setup guide</a> shows each step in detail.</p>
        <ol class="steps">
          <li>Create a free project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener">console.firebase.google.com</a>.</li>
          <li>In Authentication, turn on <strong>Email/Password</strong> sign-in.</li>
          <li>Create a <strong>Firestore</strong> database in production mode. In its <strong>Rules</strong> tab, replace everything with the app’s rules and click <strong>Publish</strong>.
            <button type="button" id="copy-rules" class="secondary">Copy rules</button></li>
          <li>In Project settings, add a web app (<code>&lt;/&gt;</code>) and copy its <code>firebaseConfig</code>.</li>
        </ol>
      </div>
      <form id="create" class="card">
        <h2>Create your team</h2>
        <input name="teamName" required maxlength="200" placeholder="Team name, e.g. 26706 Thunder Lab" />
        ${teamFields()}
        <textarea name="config" rows="6" required placeholder="Paste your firebaseConfig here"></textarea>
        <ul id="problems" class="problems" hidden></ul>
        <button>Create team</button>
      </form>
      <button id="back" class="link">Back</button>
    </main>`;

  copyButton(app.querySelector('#copy-rules'), RULES);
  app.querySelector('#back').onclick = renderWelcome;
  const form = app.querySelector('#create');
  const list = app.querySelector('#problems');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const button = e.submitter;
    button.disabled = true;
    button.textContent = 'Checking your Firebase project…';
    try {
      const config = parseFirebaseConfig(form.config.value);
      const problems = await setupProblems(config);
      list.hidden = !problems.length;
      list.innerHTML = problems.map(({ step, text, page }) => `<li>
        ${step ? `<strong>Step ${step}:</strong> ` : ''}${esc(text)}
        ${page ? `<a href="${esc(consolePage(config.projectId, page))}" target="_blank" rel="noopener">Fix it in Firebase</a>` : ''}
      </li>`).join('') + (problems.some((problem) => problem.step) ? '<li class="muted">Then click Create team again.</li>' : '');
      if (!problems.length) saveConnection({ config, secret: newSecret(), teamName: form.teamName.value.trim(), program: form.program.value, teamNumber: Number(form.teamNumber.value), role: 'owner' });
    } catch (error) {
      showError(error);
    } finally {
      button.disabled = false;
      button.textContent = 'Create team';
    }
  };
}

function renderSignIn() {
  const owner = state.connection.role === 'owner';
  // Signing in by team number brings no join code, so there's no account to create.
  const canJoin = Boolean(state.connection.secret);
  app.innerHTML = `
    <main class="center">
      <h1>${esc(state.connection.teamName)}</h1>
      <p class="muted">${!canJoin ? 'Sign in with your email and password.' : owner ? 'Create the admin account for your team.' : 'Sign in, or create an account if this is your first time.'}</p>
      <p id="error" class="error" hidden></p>
      <form id="auth" class="card">
        ${canJoin ? '<input name="username" maxlength="40" autocomplete="nickname" placeholder="Your name (for new accounts)" />' : ''}
        <input name="email" type="email" required autocomplete="email" placeholder="Email" />
        <div class="password">
          <input name="password" type="password" required autocomplete="current-password" placeholder="Password" />
          <button type="button" id="toggle-password" class="secondary" aria-label="Show password">Show</button>
        </div>
        ${canJoin ? `<label class="check"><input name="privacy" type="checkbox" /><span>I accept the <a href="${PRIVACY_URL}" target="_blank" rel="noopener">privacy policy</a> (first time on this team)</span></label>` : ''}
        ${canJoin ? `<div class="row">
          <button name="action" value="up">Create account</button>
          <button name="action" value="in" class="secondary">Sign in</button>
        </div>` : '<button name="action" value="in">Sign in</button>'}
        <button type="button" id="reset" class="link">Forgot password?</button>
      </form>
      <button id="switch" class="link">Use a different team</button>
    </main>`;
  if (state.signInError) showError(state.signInError);
  state.signInError = null;

  const form = app.querySelector('#auth');
  app.querySelector('#toggle-password').onclick = (e) => {
    const hidden = form.password.type === 'password';
    form.password.type = hidden ? 'text' : 'password';
    e.target.textContent = hidden ? 'Hide' : 'Show';
    e.target.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = form;
    state.acceptedPrivacy = Boolean(form.privacy?.checked);
    try {
      if (e.submitter.value === 'up') {
        if (!username.value.trim()) throw new Error('Enter your name so teammates know who you are.');
        if (password.value.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (!form.privacy.checked) throw new Error('Accept the privacy policy to create an account.');
        state.newName = username.value.trim();
        await fb.signUp(email.value, password.value);
      }
      else await fb.signIn(email.value, password.value);
    } catch (error) {
      showError(AUTH_OFF_CODES.includes(error.code)
        ? errorWithLink('Email sign-in isn’t turned on in this team’s Firebase project. The team admin needs to turn it on (setup step 2).',
          consolePage(state.connection.config.projectId, AUTH_PAGE), 'Open Authentication')
        : error);
    }
  };
  app.querySelector('#reset').onclick = async () => {
    if (!form.email.value) return showError(new Error('Enter your email first.'));
    try {
      await fb.resetPassword(form.email.value);
      showError(new Error('Password reset email sent.'));
    } catch (error) {
      showError(error);
    }
  };
  app.querySelector('#switch').onclick = forgetConnection;
}

function renderInventory() {
  app.innerHTML = `
    <header>
      <h1>${esc(state.connection.teamName)}</h1>
      <div class="row">
        <button id="scan" class="secondary">${ICON_SCAN}<span>Scan</span></button>
        <div class="menuwrap">
          <button id="main-menu-toggle" class="icon" aria-label="Menu" title="Menu" aria-haspopup="true" aria-expanded="false" aria-controls="main-menu">${ICON_MENU}</button>
          <div id="main-menu" class="menu right" hidden>
            <button id="orders" class="menu-item">Orders</button>
            <button id="locations" class="menu-item">Locations</button>
            <button id="log" class="menu-item">Change log</button>
            <button id="trash" class="menu-item">Trash</button>
            <hr />
            <button id="invite" class="menu-item">Team</button>
            <button id="bug" class="menu-item">Report bug</button>
            <button id="signout" class="menu-item">Sign out</button>
          </div>
        </div>
      </div>
    </header>
    <p id="error" class="error" hidden></p>
    <div class="projectpick">
      <div class="projectmenu menuwrap">
        <button id="project" class="secondary" aria-haspopup="true" aria-expanded="false" aria-controls="project-menu"></button>
        <div id="project-menu" class="menu" hidden></div>
      </div>
      <button id="edit-project" class="icon" aria-label="Rename or delete" title="Rename or delete">${ICON_EDIT}</button>
    </div>
    <p id="packed-count" class="muted small" hidden></p>
    <div class="toolbar">
      <input id="search" type="search" placeholder="Search parts…" />
      <button id="filters-toggle" class="secondary" aria-expanded="false" aria-controls="filters">${ICON_FILTER}<span>Filters</span><b id="filter-count" hidden></b></button>
      <div class="menuwrap">
        <button id="more-toggle" class="icon" aria-label="More" title="More" aria-haspopup="true" aria-expanded="false" aria-controls="more-menu">${ICON_MORE}</button>
        <div id="more-menu" class="menu right" hidden>
          <button id="select" class="menu-item">Select parts</button>
          <button id="print-labels" class="menu-item">Print QR labels</button>
          <button id="print-list" class="menu-item">Print list</button>
          <button id="unpack-all" class="menu-item" hidden>Unpack all</button>
          <button id="export-csv" class="menu-item">Export CSV</button>
          <button id="import-csv" class="menu-item">Import CSV</button>
        </div>
      </div>
      <button id="add" disabled>+ Add part</button>
    </div>
    <div id="filters" class="filters" hidden>
      <div class="row">
        <span class="muted small">Filter</span>
        <select id="category"></select>
        <select id="location"></select>
        <select id="tag"></select>
        <button id="low" class="secondary" aria-pressed="false">Low stock</button>
      </div>
      <div class="row">
        <span class="muted small">Sort</span>
        <select id="sort" aria-label="Sort by"></select>
        <button id="sort-dir" class="secondary" aria-label="Reverse sort order">▾</button>
        <select id="group" aria-label="Group by">
          <option value="">No grouping</option>
          <option value="category">Group by category</option>
          <option value="location">Group by location</option>
          <option value="supplier">Group by supplier</option>
        </select>
      </div>
      <button id="reset-filters" class="link" hidden>Reset filters</button>
    </div>
    <div id="bulkbar" class="viewbar" hidden>
      <span id="selected-count"></span>
      <button id="select-shown" class="secondary">Select all shown</button>
      <button id="select-none" class="secondary">Clear</button>
      <button id="bulk-edit">Edit selected</button>
      <button id="select-done" class="secondary">Done</button>
    </div>
    <table aria-busy="true">
      <thead><tr></tr></thead>
      <tbody id="rows">${skeletonRows()}</tbody>
    </table>
    <p id="empty" class="muted center-text" hidden></p>
    <p id="elsewhere" class="muted center-text" hidden></p>
    <div id="getting-started" class="card getting-started" hidden>
      <h2>Add your first parts</h2>
      <p class="muted">Scanning a goBILDA, REV, AndyMark, ServoCity, TETRIX or Studica package fills in the part for you. Parts in a spreadsheet can come in as a CSV file.</p>
      <div class="row">
        <button data-start="#add">+ Add part</button>
        <button data-start="#scan" class="secondary">Scan a package</button>
        <button data-start="#import-csv" class="secondary">Import CSV</button>
        <button data-start="#locations" class="secondary">Add locations</button>
        ${DEMO ? '' : '<button data-start="#invite" class="secondary">Invite your team</button>'}
      </div>
      <p class="muted small">New to the app? The <a href="${GUIDE_URL}" target="_blank" rel="noopener">how-to guide</a> shows every feature with pictures.</p>
    </div>
    <div id="undo" class="toast" hidden><span></span><button class="link">Undo</button></div>
    <dialog id="dialog"></dialog>
    <dialog id="ask"></dialog>`;

  const dialog = app.querySelector('#dialog');
  app.querySelectorAll('[aria-haspopup]').forEach((button) => {
    button.onclick = () => showMenu(button, button.getAttribute('aria-expanded') !== 'true');
  });
  // Choosing anything in a menu closes it.
  app.querySelectorAll('.menu').forEach((menu) => menu.addEventListener('click', (e) => e.target.closest('button') && closeMenus()));
  app.querySelector('#project-menu').onclick = (e) => {
    if (e.target.closest('#new-project')) return openProjectDialog();
    const id = e.target.closest('[data-project]')?.dataset.project;
    if (id) switchProject(id);
  };
  app.querySelector('#filters-toggle').onclick = toggleFilters;
  app.querySelector('#locations').onclick = openLocationsDialog;
  app.querySelector('#orders').onclick = openOrdersDialog;
  app.querySelector('#trash').onclick = openTrashDialog;
  app.querySelector('#edit-project').onclick = openListDialog;
  app.querySelector('#search').oninput = (e) => { state.search = e.target.value; renderRows(); };
  app.querySelector('#elsewhere').onclick = (e) => {
    const id = e.target.dataset.searchIn;
    if (id) switchProject(id, state.search);
  };
  app.querySelector('#category').onchange = (e) => { state.category = e.target.value; renderRows(); };
  app.querySelector('#location').onchange = (e) => { state.location = e.target.value; renderRows(); };
  app.querySelector('#tag').onchange = (e) => { state.tag = e.target.value; renderRows(); };
  app.querySelector('#low').onclick = () => { state.low = !state.low; renderRows(); };
  app.querySelector('#reset-filters').onclick = resetFilters;
  app.querySelector('#print-labels').onclick = openLabelsDialog;
  app.querySelector('#sort').onchange = (e) => { Object.assign(state, { sort: e.target.value, sortDir: 1 }); renderRows(); };
  app.querySelector('#sort-dir').onclick = () => { state.sortDir = -state.sortDir; renderRows(); };
  app.querySelector('#group').onchange = (e) => { state.group = e.target.value; renderRows(); };
  app.querySelector('#print-list').onclick = printList;
  app.querySelector('#unpack-all').onclick = unpackAll;
  app.querySelector('#export-csv').onclick = exportCsv;
  app.querySelector('#import-csv').onclick = pickCsv;
  app.querySelector('#select').onclick = () => { state.selected = new Set(); renderRows(); };
  app.querySelector('#select-shown').onclick = () => { visibleRows().forEach((p) => state.selected.add(p.id)); renderRows(); };
  app.querySelector('#select-none').onclick = () => { state.selected.clear(); renderRows(); };
  app.querySelector('#bulk-edit').onclick = openBulkEditDialog;
  app.querySelector('#select-done').onclick = () => { state.selected = null; renderRows(); };
  app.querySelector('#add').onclick = () => (currentProject().source ? openPicker() : openPartDialog(null, { location: state.location }));
  app.querySelector('#scan').onclick = () => scanCode(dialog).then((text) => text && openScanned(text)).catch(showError);
  app.querySelector('#invite').onclick = () => openTeamDialog().catch(showError);
  app.querySelector('#log').onclick = openLogDialog;
  app.querySelector('#bug').onclick = openBugDialog;
  // Restarts the app, since wiping the data kept on this device shuts down its connection to Firebase.
  app.querySelector('#signout').onclick = () => fb.logOut().then(fb.clearDeviceData)
    .then(() => location.assign(location.pathname), showError);
  // The rules banners (see status.js) open the steps here, where the rules can be copied.
  document.getElementById('rules-banner').onclick = (e) => { e.preventDefault(); openRulesDialog(false); };
  document.getElementById('open-rules-banner').onclick = (e) => { e.preventDefault(); openRulesDialog(true); };
  app.querySelector('#invite').hidden = DEMO;
  app.querySelector('#bug').hidden = DEMO;
  // Each getting-started button does what the same button or menu item does.
  app.querySelector('#getting-started').onclick = (e) => {
    const target = e.target.closest('[data-start]')?.dataset.start;
    if (target) app.querySelector(target).click();
  };
  app.querySelector('thead').onclick = (e) => {
    const key = e.target.dataset.sort;
    if (!key) return;
    // Tapping the sorted column again reverses it.
    Object.assign(state, { sort: key, sortDir: key === state.sort ? -state.sortDir : 1 });
    renderRows();
  };
  app.querySelector('#rows').onclick = (e) => {
    if (e.target.closest('a')) return;
    if (e.target.dataset.project) return switchProject(e.target.dataset.project);
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    if (state.selected) return toggleSelected(row.dataset.id);
    if (e.target.closest('[data-add-to]')) return openAddToDialog(state.parts.find((p) => p.id === row.dataset.id));
    if (e.target.dataset.packed) return setPacked(useOf(state.projectId, row.dataset.id), e.target.checked);
    if (e.target.dataset.tag) {
      state.tag = e.target.dataset.tag;
      return renderRows();
    }
    const delta = Number(e.target.dataset.delta);
    const current = currentProject();
    if (current.source) {
      const use = useOf(current.id, row.dataset.id);
      if (delta) setUse(current.id, use.partId, use.quantity + delta);
      else openUseDialog(use);
    } else {
      if (delta) changeQuantity(state.parts.find((p) => p.id === row.dataset.id), delta);
      else openPartDialog(state.parts.find((p) => p.id === row.dataset.id));
    }
  };

  renderRows();
}

function switchProject(id, search = '') {
  Object.assign(state, { projectId: id, search, category: '', location: '', tag: '', low: false, sort: 'name', sortDir: 1, selected: null });
  app.querySelector('#search').value = search;
  renderRows();
}

function resetFilters() {
  Object.assign(state, DEFAULT_FILTERS);
  app.querySelector('#search').value = '';
  renderRows();
}

function renderFilter(id, label, values, selected, text = (v) => v) {
  const select = app.querySelector(`#${id}`);
  select.innerHTML = `<option value="">All ${label}</option>` +
    values.map((v) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(text(v))}</option>`).join('');
}

// A button showing the current project, which opens a menu of every project grouped by type.
function renderProjectPicker() {
  const current = currentProject();
  const type = TYPES[typeOf(current)];
  const button = app.querySelector('#project');
  button.innerHTML = `${type.icon}<span>${esc(current.name)}</span>${ICON_CHEVRON}`;
  button.setAttribute('aria-label', `${type.label}: ${current.name}`);
  app.querySelector('#project-menu').innerHTML = Object.entries(TYPES).map(([key, { plural, icon: typeIcon }]) => {
    const items = state.projects.filter((p) => typeOf(p) === key);
    return items.length ? `<h3>${plural}</h3>` + items.map((p) =>
      `<button type="button" class="menu-item" data-project="${esc(p.id)}" ${p === current ? 'aria-current="true"' : ''}>${typeIcon}<span>${esc(p.name)}</span></button>`).join('') : '';
  }).join('') + `<hr /><button type="button" id="new-project" class="menu-item">${ICON_PLUS}<span>New inventory, project or list</span></button>`;
}

// Menus (the project picker, the header menu and More) open from their button.
function showMenu(button, open) {
  app.querySelector(`#${button.getAttribute('aria-controls')}`).hidden = !open;
  button.setAttribute('aria-expanded', String(open));
}

// Closes every open menu except the one inside `keep`.
function closeMenus(keep) {
  app.querySelectorAll('[aria-haspopup][aria-expanded="true"]').forEach((button) => {
    if (button.closest('.menuwrap') !== keep) showMenu(button, false);
  });
}

// A menu closes on a tap anywhere else or on Escape.
document.addEventListener('pointerdown', (e) => closeMenus(e.target.closest('.menuwrap')));
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenus());

// The Filters button shows or hides the filter and sort controls.
function toggleFilters(e) {
  const filters = app.querySelector('#filters');
  filters.hidden = !filters.hidden;
  e.currentTarget.setAttribute('aria-expanded', String(!filters.hidden));
}

// Rows for the current project: its own parts, or the inventory parts it uses with how many it uses.
function projectRows() {
  const current = currentProject();
  if (!current.source) return inventoryParts(current.id).map((p) => ({ ...p, inUse: inUse(p.id) }));
  return state.uses
    .filter((u) => u.projectId === current.id)
    .map((u) => ({ ...state.parts.find((p) => p.id === u.partId), quantity: u.quantity, packed: u.packed }))
    .filter((row) => row.id);
}

// These sort by number; "Recently changed" puts the newest first.
const SORT_NUMBERS = { quantity: (p) => p.quantity, inUse: (p) => p.inUse, updatedAt: (p) => -p.updatedAt.toMillis() };

function compareRows(a, b) {
  const number = SORT_NUMBERS[state.sort];
  const order = number ? number(a) - number(b) : String(a[state.sort] ?? '').localeCompare(String(b[state.sort] ?? ''));
  return order * state.sortDir;
}

function visibleRows() {
  const query = state.search.toLowerCase();
  return projectRows()
    .filter((p) => !state.category || inCategory(p, state.category))
    .filter((p) => !state.location || p.location === state.location)
    .filter((p) => !state.tag || p.tags.includes(state.tag))
    .filter((p) => !state.low || lowStock(p.id))
    .filter((p) => !query || matches(p, query))
    .sort(compareRows);
}

const GROUPS = { category: (p) => p.category.split('/')[0], location: (p) => p.location, supplier: (p) => p.supplier };

// [[name, rows]] in name order, with parts that have no value last under "None". Rows keep their order.
// Without grouping it's one group with a blank name.
function groupRows(rows) {
  if (!state.group) return [['', rows]];
  const groups = new Map();
  for (const row of rows) {
    const name = GROUPS[state.group](row);
    groups.set(name, [...(groups.get(name) ?? []), row]);
  }
  return [...groups]
    .sort(([a], [b]) => !a - !b || a.localeCompare(b, undefined, { numeric: true }))
    .map(([name, group]) => [name || 'None', group]);
}

const countParts = (n) => `${n} ${n === 1 ? 'part' : 'parts'}`;

function columnsFor(current) {
  if (!current.source) return [...FIELDS.slice(0, 3), ['inUse', 'In use'], ...FIELDS.slice(3)];
  if (!isPacking(current.id)) return FIELDS.map(([key, label]) => [key, key === 'quantity' ? 'Using' : label]);
  return [['packed', 'Packed'], ...FIELDS.map(([key, label]) => [key, key === 'quantity' ? 'Pack' : label])];
}

function renderViewBar(columns) {
  app.querySelector('#sort').innerHTML = [...columns, ['updatedAt', 'Recently changed']].map(([key, label]) =>
    `<option value="${key}" ${key === state.sort ? 'selected' : ''}>Sort: ${label}</option>`).join('');
  app.querySelector('#sort-dir').textContent = state.sortDir > 0 ? '▾' : '▴';
  app.querySelector('#group').value = state.group;
  const selecting = Boolean(state.selected);
  app.querySelector('#select').hidden = selecting;
  app.querySelector('#bulkbar').hidden = !selecting;
  if (!selecting) return;
  app.querySelector('#selected-count').textContent = `${countParts(state.selected.size)} selected`;
  app.querySelector('#bulk-edit').disabled = !state.selected.size;
}

// The Filters button counts the filters that hide parts, so a hidden filter is never forgotten.
function renderFilterCount() {
  const count = ['category', 'location', 'tag', 'low'].filter((key) => state[key] !== DEFAULT_FILTERS[key]).length;
  const badge = app.querySelector('#filter-count');
  badge.hidden = !count;
  badge.textContent = count;
  app.querySelector('#filters-toggle').classList.toggle('active', count > 0);
}

function renderRows() {
  // Projects, parts and uses must all arrive before rows replace the loading placeholders.
  if (!state.user || !app.querySelector('#rows') || state.loaded.size < 3 || !currentProject()) return;
  app.querySelector('table').removeAttribute('aria-busy');
  const usesParts = Boolean(currentProject().source);
  const columns = columnsFor(currentProject());
  const all = projectRows();

  renderProjectPicker();
  renderFilter('category', 'categories', categoryPaths(all), state.category, categoryLabel);
  renderFilter('location', 'locations', unique(all, 'location'), state.location);
  renderFilter('tag', 'tags', allTags(all), state.tag);
  app.querySelector('#low').classList.toggle('active', state.low);
  app.querySelector('#low').setAttribute('aria-pressed', String(state.low));
  app.querySelector('#reset-filters').hidden = Object.entries(DEFAULT_FILTERS).every(([key, value]) => state[key] === value);
  renderFilterCount();
  renderViewBar(columns);
  app.querySelector('#add').textContent = usesParts ? '+ Add parts' : '+ Add part';
  app.querySelector('#export-csv').hidden = usesParts;
  app.querySelector('#import-csv').hidden = usesParts;
  app.querySelector('#add').disabled = false;
  app.querySelector('thead tr').innerHTML = (state.selected ? '<th aria-label="Selected"></th>' : '') + columns.map(([key, label]) =>
    `<th data-sort="${key}" class="${key === state.sort ? `sorted${state.sortDir < 0 ? ' desc' : ''}` : ''}">${label}</th>`).join('');

  const rows = visibleRows();
  app.querySelector('#rows').innerHTML = groupRows(rows).map(([name, group]) =>
    (name ? `<tr class="group"><th colspan="${columns.length + (state.selected ? 1 : 0)}">${esc(name)} <span class="muted small">${countParts(group.length)}</span></th></tr>` : '')
    + group.map((p) => rowHtml(p, columns)).join('')).join('');

  // A team with no parts yet gets ways to start instead of the empty message.
  const gettingStarted = app.querySelector('#getting-started');
  gettingStarted.hidden = state.parts.length > 0 || usesParts;
  const empty = app.querySelector('#empty');
  empty.hidden = rows.length > 0 || !gettingStarted.hidden;
  empty.textContent = all.length ? 'No parts match your filters.'
    : usesParts ? 'No parts yet. Tap “+ Add parts” to pick parts this project uses.'
      : 'No parts yet. Tap “+ Add part” to add the first one.';
  renderElsewhere(usesParts);
  renderPacked();
}

// A packing list shows how much of it is packed.
function renderPacked() {
  const packing = isPacking(state.projectId);
  const rows = packing ? projectRows() : [];
  const packed = rows.filter((row) => row.packed).length;
  const count = app.querySelector('#packed-count');
  count.hidden = !rows.length;
  count.textContent = `Packed ${packed} of ${rows.length}`;
  app.querySelector('#unpack-all').hidden = !packing;
  app.querySelector('#unpack-all').disabled = !packed;
}

// Unchecks every packed item of the packing list on screen, putting them back in the inventory, with one Undo.
function unpackAll() {
  const list = currentProject();
  const packed = state.uses.filter((u) => u.projectId === list.id && u.packed);
  if (!confirm(`Unpack all ${packed.length} packed items in ${list.name}? They count as back in the inventory.`)) return;
  const write = (packedNow, details) => logged(
    Promise.all(packed.map((u) => fb.setUse(u.projectId, u.partId, u.quantity, packedNow))), 'used', list.name, details);
  write(false, `Unpacked all ${packed.length} items`);
  offerUndo(`Unpacked ${packed.length} items`, () => write(true, `Undo: packed ${packed.length} items again`));
}

// While searching an inventory, names the team's other inventories with matching parts. Tapping one opens it with the
// same search.
function renderElsewhere(usesParts) {
  const query = state.search.toLowerCase();
  const others = usesParts || !query.trim() ? [] : state.projects
    .filter((p) => !p.source && p.id !== state.projectId)
    .map((p) => [p, inventoryParts(p.id).filter((part) => matches(part, query)).length])
    .filter(([, count]) => count);
  const elsewhere = app.querySelector('#elsewhere');
  elsewhere.hidden = !others.length;
  elsewhere.innerHTML = 'Also found in ' + others.map(([p, count]) =>
    `<button class="link inline" data-search-in="${esc(p.id)}">${esc(p.name)} (${count})</button>`).join(', ');
}

function rowHtml(p, columns) {
  const selected = state.selected?.has(p.id);
  const label = (key) => columns.find(([k]) => k === key)?.[1];
  return `
    <tr data-id="${esc(p.id)}" class="${selected ? 'selected' : ''} ${p.packed ? 'packed' : ''} ${waiting(p.id) ? 'waiting' : ''}">
      ${state.selected ? `<td class="check"><input type="checkbox" aria-label="Select ${esc(p.name)}" ${selected ? 'checked' : ''} /></td>` : ''}
      ${label('packed') ? `<td data-label="Packed" class="packed"><input type="checkbox" data-packed="1" aria-label="Packed" ${p.packed ? 'checked' : ''} /></td>` : ''}
      <td data-label="Item" class="name">${esc(p.name)}${lowBadge(p.id)}${orderBadge(p.id)}${conditionBadge(p.condition)}${notesLine(p.notes)}${tagChips(p.tags)}</td>
      <td class="card-meta muted small">${esc(cardMeta(p, !label('inUse')))}</td>
      <td data-label="Part #">${esc(p.partNumber)}${partLink(p)}</td>
      <td data-label="${label('quantity')}" class="qty">
        <button class="step" data-delta="-1" ${p.quantity > 0 ? '' : 'disabled'} aria-label="Remove one">−</button>
        <span>${esc(p.quantity)}</span>${p.unit ? `<small class="unit muted">${esc(p.unit)}</small>` : ''}
        <button class="step" data-delta="1" aria-label="Add one">+</button>
      </td>
      ${label('inUse') ? `<td data-label="In use">${usedIn(p)}<button class="add-to" data-add-to="1">${ICON_PLUS}<span>Add to</span></button></td>` : ''}
      <td data-label="Location">${esc(p.location)}${!label('inUse') && inventoryNote(p) ? `<div class="muted small">${esc(inventoryNote(p))}</div>` : ''}</td>
      <td data-label="Supplier">${esc(p.supplier)}</td>
      <td data-label="Category">${esc(categoryLabel(p.category))}</td>
    </tr>`;
}

// ---------- printing ----------

// Prints the parts listed right now, grouped like the screen.
function printList() {
  const current = currentProject();
  const headers = ['Item', 'Part #', columnsFor(current).find(([key]) => key === 'quantity')[1], 'Location', 'Category'];
  const groups = groupRows(visibleRows()).map(([name, rows]) => [
    name && `${name} (${countParts(rows.length)})`,
    rows.map((p) => [p.name, p.partNumber, `${p.quantity} ${p.unit ?? ''}`.trim(), p.location, categoryLabel(p.category)]),
  ]);
  printSheet(current.name, `${state.connection.teamName} · ${new Date().toLocaleDateString()}`, headers, groups);
}

// ---------- CSV export and import ----------

// The columns of an export, which an import reads back. Import also takes a column under one of the other names.
const CSV_COLUMNS = [
  ['name', 'Item', ['name', 'item name', 'part name']],
  ['partNumber', 'Part #', ['part number', 'part no', 'part no.', 'sku']],
  ['quantity', 'Qty', ['quantity', 'count']],
  ['minQuantity', 'Low stock at', ['minimum', 'min quantity', 'min qty']],
  ['unit', 'Unit', []],
  ['location', 'Location', ['bin']],
  ['supplier', 'Supplier', ['vendor']],
  ['category', 'Category', []],
  ['tags', 'Tags', []],
  ['condition', 'Condition', []],
  ['barcode', 'Barcode', []],
  ['link', 'Link', ['url']],
  ['notes', 'Notes', []],
];

// Saves every part of the inventory on screen as a CSV file, as a backup or to open in a spreadsheet.
function exportCsv() {
  // The Android app's web view can't save files.
  if (window.Capacitor?.isNativePlatform()) return showError(new Error('The Android app can’t save files. Export from the website or the Windows app.'));
  const current = currentProject();
  const rows = inventoryParts(current.id).sort((a, b) => naturalCompare(a.name, b.name))
    .map((p) => CSV_COLUMNS.map(([key]) => (key === 'tags' ? p.tags.join(', ') : p[key])));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([toCsv([CSV_COLUMNS.map(([, label]) => label), ...rows])], { type: 'text/csv' }));
  link.download = `${current.name} ${new Date().toISOString().slice(0, 10)}.csv`.replace(/[\\/:*?"<>|]/g, '-');
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function pickCsv() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.onchange = () => input.files[0].text().then((text) => openImportDialog(input.files[0].name, parseCsv(text))).catch(showError);
  input.click();
}

// Which CSV_COLUMNS key each column of the file is, by its name in the first row; null for columns the app doesn't know.
function csvKeys(headers) {
  const taken = new Set();
  return headers.map((header) => {
    const name = header.trim().toLowerCase();
    const column = CSV_COLUMNS.find(([key, label, others]) => !taken.has(key) && [label.toLowerCase(), ...others].includes(name));
    if (!column) return null;
    taken.add(column[0]);
    return column[0];
  });
}

// A new part from a row of the file, or the reason the row can't be one.
function csvPart(values, projectId) {
  const text = (key, max = 200) => (values[key] ?? '').trim().slice(0, max);
  if (!text('name')) return { problem: 'no item name' };
  const quantity = text('quantity') ? Number(text('quantity')) : 0;
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1000000) return { problem: 'quantity not a whole number' };
  const minQuantity = text('minQuantity') ? Number(text('minQuantity')) : null;
  if (minQuantity !== null && (!Number.isInteger(minQuantity) || minQuantity < 0 || minQuantity > 1000000)) {
    return { problem: 'low stock at not a whole number' };
  }
  const condition = text('condition').toLowerCase();
  const link = webLink(text('link', 1000));
  return {
    part: {
      projectId,
      name: text('name'),
      partNumber: text('partNumber'),
      quantity,
      location: text('location'),
      supplier: text('supplier'),
      category: canonicalCategory(text('category')).slice(0, 200),
      unit: text('unit'),
      condition: Object.hasOwn(CONDITIONS, condition) ? condition : '',
      notes: text('notes', 1000),
      tags: parseTags(text('tags')),
      ...(text('barcode') && { barcode: text('barcode') }),
      ...(link && { link }),
      ...(minQuantity !== null && { minQuantity }),
    },
  };
}

// Shows what a CSV file will add to the inventory on screen, then adds it. Parts already there (same name or part number) are
// left out, so importing the same file twice adds nothing, and nothing already in the inventory is changed.
function openImportDialog(fileName, rows) {
  const current = currentProject();
  const keys = csvKeys(rows[0] ?? []);
  if (!keys.includes('name')) {
    throw new Error(`The first row of ${fileName} needs column names, with one called Item. Export CSV shows the columns the app reads.`);
  }
  const existing = inventoryParts(current.id);
  const parts = [];
  const problems = {};
  const skip = (problem) => { problems[problem] = (problems[problem] ?? 0) + 1; };
  for (const row of rows.slice(1)) {
    const { part, problem } = csvPart(Object.fromEntries(keys.map((key, i) => [key, row[i]]).filter(([key]) => key)), current.id);
    if (problem) skip(problem);
    else if (existing.some((p) => sameName(p.name, part.name) || (part.partNumber && p.partNumber === part.partNumber))) skip(`already in ${current.name}`);
    else parts.push(part);
  }
  // A location is spelled the way the team (or the file's first row with it) spells it, ignoring capitals.
  const spellings = new Map(state.locations.map((l) => [l.name.toLowerCase(), l.name]));
  const newLocations = [];
  for (const part of parts.filter((p) => p.location)) {
    const key = part.location.toLowerCase();
    if (!spellings.has(key)) {
      spellings.set(key, part.location);
      newLocations.push(part.location);
    }
    part.location = spellings.get(key);
  }
  const ignored = rows[0].filter((header, i) => !keys[i] && header.trim());

  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Import ${countParts(parts.length)}</h2>
      <p class="muted small">From ${esc(fileName)} into ${esc(current.name)}. Nothing already in ${esc(current.name)} is changed.</p>
      <ul class="small">
        <li>Columns read: ${esc(keys.filter(Boolean).map((key) => CSV_COLUMNS.find(([k]) => k === key)[1]).join(', '))}</li>
        ${ignored.length ? `<li>Columns left out: ${esc(ignored.join(', '))}</li>` : ''}
        ${Object.entries(problems).map(([problem, count]) => `<li>Skipped ${count}: ${esc(problem)}</li>`).join('')}
        ${newLocations.length ? `<li>New locations: ${esc(newLocations.join(', '))}</li>` : ''}
      </ul>
      <ul class="members">${parts.slice(0, 5).map((p) => `<li><strong>${esc(p.name)}</strong>
        <span class="muted small">${esc([`qty ${p.quantity}`, p.location, p.partNumber].filter(Boolean).join(' · '))}</span></li>`).join('')}
        ${parts.length > 5 ? `<li class="muted small">and ${parts.length - 5} more</li>` : ''}</ul>
      <div class="row">
        <button value="import" ${parts.length ? '' : 'disabled'}>Import</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
      </div>
    </form>`;
  dialog.querySelector('form').onsubmit = (e) => {
    if (e.submitter.value === 'import') importParts(parts, newLocations, fileName);
  };
  dialog.showModal();
}

// Adds the parts, and the locations they name that the team doesn't have yet. Undo moves the parts to the trash.
function importParts(parts, newLocations, fileName) {
  newLocations.forEach((name) => fb.addLocation(name).catch(showError));
  const changes = parts.map((part) => [fb.newPartId(), part]);
  const name = countParts(parts.length);
  writeParts(changes, 'added', name, `Imported from ${fileName}`.slice(0, 1990));
  offerUndo(`Imported ${name}`, () => logged(Promise.all(changes.map(([id, data]) =>
    fb.moveToTrash({ kind: 'part', docId: id, name: data.name, data, uses: [] }, state.user))), 'deleted', name, 'Undo: removed after import'));
}

const lowBadge = (partId) => lowStock(partId) ? '<small class="badge low">Low stock</small>' : '';
const orderBadge = (partId) => onOrder(partId) ? `<small class="badge on-order">${onOrder(partId)} on order</small>` : '';
const conditionBadge = (condition) => ['used', 'broken'].includes(condition)
  ? `<small class="badge ${condition}">${CONDITIONS[condition]}</small>` : '';
// Phones show a part as a short card, with its location (and inventory, outside inventories) and part number on one
// line under the name. Supplier and category are left to the part dialog there.
const cardMeta = (p, withInventory) => [p.location, withInventory && inventoryNote(p), p.partNumber].filter(Boolean).join(' · ');
// The part's link, in the Part # column, which phones' short cards leave out.
const partLink = (p) => p.link ? `<a class="part-link small" href="${esc(p.link)}" target="_blank" rel="noopener">Link ↗</a>` : '';
const notesLine = (notes) => notes ?`<div class="notes muted small">${esc(notes.split('\n')[0])}</div>` : '';

// Free count plus a link to every project using this inventory part, one per line.
function usedIn(part) {
  const uses = usesOfPart(part.id).filter(holdsPart);
  if (!uses.length) return '';
  const free = part.quantity - part.inUse;
  const links = uses.map((u) =>
    `<span class="small muted"><button class="link inline" data-project="${esc(u.projectId)}">${esc(project(u.projectId)?.name)}</button> (${u.quantity})</span>`).join('');
  return `<div class="in-use"><span class="${free < 0 ? 'over' : ''}">${free < 0 ? `${-free} short` : `${free} free`}</span>
    <span class="small muted">Used in</span>${links}</div>`;
}

// ---------- links and labels ----------

const partLabel = (part) => ({
  key: `part-${part.id}`,
  url: `${WEB_URL}#${new URLSearchParams({ part: part.id })}`,
  title: part.name,
  subtitle: [part.partNumber, part.location].filter(Boolean).join(' · '),
});

// The inventory a bin label opens: the one on screen, or while a project or packing list is on screen (they hold no
// parts of their own), the inventory with the most parts in that bin.
function binInventory(name) {
  if (!currentProject().source) return state.projectId;
  const counts = new Map();
  for (const p of state.parts) if (p.location === name) counts.set(p.projectId, (counts.get(p.projectId) ?? 0) + 1);
  const [most] = [...counts].sort((a, b) => b[1] - a[1]);
  return most?.[0] ?? fb.MAIN_PROJECT;
}

const locationLabel = (name) => {
  const projectId = binInventory(name);
  return {
    key: `bin-${projectId}-${encodeURIComponent(name)}`,
    url: `${WEB_URL}#${new URLSearchParams({ project: projectId, location: name })}`,
    title: name,
    subtitle: project(projectId).name,
  };
};

// Prints labels and remembers them as printed, so the labels dialog can pick out the ones still to print.
function printAndMark(labels) {
  printLabels(labels).catch(showError);
  fb.markPrinted(labels.map((l) => l.key)).catch(showError);
}

// A scan is one of the app's own QR labels, or the barcode on a part's package.
function openScanned(text) {
  if (text.startsWith(WEB_URL)) return openLink(new URLSearchParams(new URL(text).hash.slice(1)));
  return openBarcode(text.trim());
}

// Opens what a label points at: one part, or one location in a project.
function openLink(params) {
  if (params.has('part')) {
    const part = state.parts.find((p) => p.id === params.get('part'));
    if (!part) throw new Error('That label’s part isn’t in this team’s inventory anymore.');
    switchProject(part.projectId);
    return openTakeDialog(part);
  }
  if (params.has('location')) {
    if (!project(params.get('project'))) throw new Error('That label’s project isn’t in this team anymore.');
    switchProject(params.get('project'));
    state.location = params.get('location');
    return renderRows();
  }
  throw new Error('That QR code isn’t an inventory label.');
}

// Opens the part a package barcode belongs to. A new part is added to the inventory, filled in from the supplier
// catalog when the barcode is listed there, or else remembering the barcode so the next scan finds the part.
async function openBarcode(code) {
  if (code.length > 200) throw new Error('That code is too long to be a part’s barcode.');
  // A part with this barcode or part number opens without the catalog; otherwise the catalog may know its part number.
  let part = partWithCode(code);
  const product = part ? null : await findProduct(code);
  if (product) part = partWithCode(product.partNumber);
  if (part) {
    switchProject(part.projectId);
    return openTakeDialog(part);
  }
  // New parts go into the inventory on screen, or Main Inventory when a project is.
  if (currentProject().source) switchProject(fb.MAIN_PROJECT);
  if (product) {
    const { name, partNumber, supplier, link } = product;
    const category = product.category && canonicalCategory(product.category);
    return openPartDialog(null, { name, partNumber, supplier, link, category, quantity: 1 }, `Filled in from the ${supplier} catalog.`);
  }
  openPartDialog(null, { barcode: code, quantity: 1 }, 'This barcode isn’t in the supplier catalog. Fill in the part once, and scanning it again will find it.');
}

// Fills a form's item, supplier and link from the supplier catalog as its part number is typed. What it filled follows
// the part number, so a partial number's match is replaced; whatever the user typed in those fields stays.
function autofillFromCatalog(form) {
  const filled = { name: '', supplier: '', link: '' };
  form.partNumber.addEventListener('input', () => {
    findProduct(form.partNumber.value).then((product) => {
      for (const key of Object.keys(filled)) {
        if (form[key].readOnly || (form[key].value && form[key].value !== filled[key])) continue;
        form[key].value = filled[key] = product?.[key] ?? '';
      }
    }).catch(showError);
  });
}

// Scans a package barcode into the part form, and fills the form's empty fields from the supplier catalog.
async function scanBarcodeInto(form) {
  const code = (await scanCode(app.querySelector('#ask'), 'Scan a barcode', 'Point the camera at the barcode on the part’s package.', BARCODES))?.trim();
  if (!code) return;
  form.barcode.value = code;
  const product = await findProduct(code);
  if (!product) return;
  for (const key of ['name', 'partNumber', 'supplier', 'link']) {
    if (!form[key].value) form[key].value = product[key] ?? '';
  }
  const category = product.category && canonicalCategory(product.category);
  if (category && !form.category.value) {
    if (![...form.category.options].some((o) => o.value === category)) form.category.add(new Option(categoryLabel(category), category), form.category.options.length - 1);
    form.category.value = category;
    form.category.dispatchEvent(new Event('change')); // so "+ New category…" falls back to it
  }
}

// The part a code is saved on as its barcode or part number. Prefers the inventory on screen.
function partWithCode(code) {
  const key = codeKey(code);
  const matches = state.parts.filter((p) => [p.barcode, p.partNumber].some((c) => c && codeKey(c) === key));
  return matches.find((p) => p.projectId === state.projectId) ?? matches[0];
}

// ---------- dialogs ----------

// A scanned part opens with its count and − / +, for taking some or putting some back. Edit part opens the full form.
function openTakeDialog(part) {
  const dialog = app.querySelector('#dialog');
  let quantity = part.quantity;
  dialog.innerHTML = `
    <form method="dialog" class="card take">
      <h2>${esc(part.name)}</h2>
      <p class="muted small">${esc([part.location, inventoryNote(part), part.partNumber].filter(Boolean).join(' · '))}</p>
      <div class="take-qty">
        <button type="button" class="step" data-delta="-1" aria-label="Remove one">−</button>
        <span></span>
        <button type="button" class="step" data-delta="1" aria-label="Add one">+</button>
      </div>
      <p id="take-free" class="muted small"></p>
      <div class="row">
        <button value="done">Done</button>
        <button value="edit" class="secondary">Edit part</button>
      </div>
    </form>`;
  const render = () => {
    dialog.querySelector('.take-qty span').textContent = `${quantity}${part.unit ? ` ${part.unit}` : ''}`;
    dialog.querySelector('[data-delta="-1"]').disabled = !quantity;
    const used = inUse(part.id);
    const free = quantity - used;
    dialog.querySelector('#take-free').textContent = used ? `${free < 0 ? `${-free} short` : `${free} free`}, ${used} in use` : '';
  };
  dialog.querySelector('.take-qty').onclick = (e) => {
    const delta = Number(e.target.dataset.delta);
    if (!delta) return;
    quantity += delta;
    changeQuantity(part, delta);
    render();
  };
  dialog.querySelector('form').onsubmit = (e) => {
    if (e.submitter.value !== 'edit') return;
    e.preventDefault();
    openPartDialog(state.parts.find((p) => p.id === part.id));
  };
  render();
  if (!dialog.open) dialog.showModal();
}

function openLabelsDialog() {
  const dialog = app.querySelector('#dialog');
  const rows = visibleRows();
  const labels = [
    ...unique(rows, 'location').map((name) => locationLabel(name)),
    ...rows.map(partLabel),
  ];
  const bins = labels.length - rows.length;
  const item = (label, i) => `<li><label>
    <input type="checkbox" data-index="${i}" ${state.printed.has(label.key) ? '' : 'checked'} />
    <span>${esc(label.title)} ${state.printed.has(label.key) ? '' : '<span class="badge">Not printed</span>'}</span>
  </label></li>`;
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>QR labels</h2>
      <p class="muted">Stick these on bins and parts. Scanning one with the app or a phone camera opens that bin or part.</p>
      <p class="muted small">Labels not printed yet are checked. The list follows your filters.</p>
      <div class="row">
        <button type="button" class="secondary" data-select="new">Not yet printed</button>
        <button type="button" class="secondary" data-select="all">All</button>
        <button type="button" class="secondary" data-select="none">None</button>
      </div>
      <ul class="label-list">
        ${bins ? '<li><h3>Storage</h3></li>' : ''}${labels.slice(0, bins).map(item).join('')}
        ${rows.length ? '<li><h3>Parts</h3></li>' : ''}${labels.slice(bins).map((l, i) => item(l, bins + i)).join('')}
      </ul>
      <div class="row">
        <button value="print" id="print"></button>
        <button value="cancel" class="secondary">Cancel</button>
      </div>
    </form>`;
  const boxes = [...dialog.querySelectorAll('[data-index]')];
  const printButton = dialog.querySelector('#print');
  const update = () => {
    const count = boxes.filter((b) => b.checked).length;
    printButton.textContent = `Print ${count} label${count === 1 ? '' : 's'}`;
    printButton.disabled = !count;
  };
  dialog.querySelector('.label-list').onchange = update;
  dialog.querySelectorAll('[data-select]').forEach((button) => {
    button.onclick = () => {
      const pick = button.dataset.select;
      boxes.forEach((b) => { b.checked = pick === 'all' || (pick === 'new' && !state.printed.has(labels[b.dataset.index].key)); });
      update();
    };
  });
  dialog.querySelector('form').onsubmit = (e) => {
    if (e.submitter.value === 'print') printAndMark(boxes.filter((b) => b.checked).map((b) => labels[b.dataset.index]));
  };
  update();
  dialog.showModal();
}

function openProjectDialog() {
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2></h2>
      <fieldset class="types">
        <legend>Type</legend>
        ${Object.entries(TYPES).map(([key, { label, icon: typeIcon }]) =>
          `<label><input type="radio" name="type" value="${key}" ${key === 'project' ? 'checked' : ''} />${typeIcon}${label}</label>`).join('')}
      </fieldset>
      <p id="type-about" class="muted small"></p>
      <label>Name<input name="name" required /></label>
      <div class="row">
        <button value="save">Create</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  const showType = () => {
    const type = TYPES[form.type.value];
    form.querySelector('h2').textContent = `New ${type.label.toLowerCase()}`;
    form.querySelector('#type-about').textContent = type.about;
    form.name.placeholder = { inventory: 'e.g. Pit spares', project: 'e.g. Robot 2026', packing: 'e.g. Qualifier pit box' }[form.type.value];
  };
  form.onchange = showType;
  showType();
  form.onsubmit = (e) => {
    if (e.submitter.value !== 'save') return;
    const type = form.type.value;
    // Projects and packing lists use parts from every inventory. They still name Main Inventory as their source,
    // which marks them as not being inventories and lets older versions of the app open them.
    const source = type === 'inventory' ? '' : fb.MAIN_PROJECT;
    // Switched to when it shows up in the projects list, which happens right away even offline.
    state.newProjectId = fb.newProjectId();
    fb.createProject(state.newProjectId, form.name.value.trim(), source, type === 'packing' ? 'packing' : '').catch(showError);
  };
  dialog.showModal();
}

// A location can only be deleted once no part in any project is there.
function openLocationsDialog() {
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Locations</h2>
      <p class="muted small">Parts pick their location from this list. Delete a location after moving its parts.</p>
      <div class="password">
        <input id="new-location" maxlength="200" placeholder="e.g. Bin 3" />
        <button type="button" id="add-location">Add</button>
      </div>
      <ul id="location-list" class="members"></ul>
      <div class="row"><button value="close" class="secondary">Close</button></div>
    </form>`;
  const input = dialog.querySelector('#new-location');
  const list = dialog.querySelector('#location-list');
  const renderLocations = () => {
    list.innerHTML = state.locations.map((l) => {
      const count = state.parts.filter((p) => p.location === l.name).length;
      return `<li>
        <span><strong>${esc(l.name)}</strong> <span class="muted small">${count} part${count === 1 ? '' : 's'}</span></span>
        <span class="row">
          <button type="button" class="secondary" data-rename="${esc(l.id)}">Rename</button>
          <button type="button" class="secondary" data-label="${esc(l.name)}">Label</button>
          <button type="button" class="danger" data-id="${esc(l.id)}" ${count ? 'disabled' : ''}>Delete</button>
        </span>
      </li>`;
    }).join('') || '<li class="muted">No locations yet.</li>';
  };
  const add = () => {
    const name = input.value.trim();
    if (!name) return;
    if (state.locations.some((l) => sameName(l.name, name))) return showError(new Error(`${name} is already a location.`));
    input.value = '';
    fb.addLocation(name).catch(showError);
  };
  dialog.querySelector('#add-location').onclick = add;
  input.onkeydown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    add();
  };
  list.onclick = (e) => {
    if (e.target.dataset.id) fb.deleteLocation(e.target.dataset.id).catch(showError);
    if (e.target.dataset.label) printAndMark([locationLabel(e.target.dataset.label)]);
    if (e.target.dataset.rename) renameLocation(state.locations.find((l) => l.id === e.target.dataset.rename)).catch(showError);
  };
  renderLocations();
  state.onLocationsChange = renderLocations;
  dialog.addEventListener('close', () => { state.onLocationsChange = null; }, { once: true });
  dialog.showModal();
}

// Renames a location and moves every part there (in any inventory) to the new name.
// QR labels hold the location's name, so labels for the old name need printing again.
async function renameLocation(location) {
  const name = (await ask(`Rename ${location.name}. Its printed QR labels will need printing again.`, location.name)).slice(0, 200);
  if (!name || name === location.name) return;
  if (state.locations.some((l) => l.id !== location.id && sameName(l.name, name))) throw new Error(`${name} is already a location.`);
  fb.renameLocation(location.id, name).catch(showError);
  const edits = state.parts.filter((p) => p.location === location.name).map((p) => [p.id, partData(p), { ...partData(p), location: name }]);
  if (edits.length) editParts(edits, 'edited', countParts(edits.length), `Location ${location.name} → ${name}`);
}

// Parts the team is waiting on. "Arrived" moves an order into the inventory. Tapping an order loads it into the form below to change it.
function openOrdersDialog() {
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Order list</h2>
      <p class="muted small">Parts the team is waiting on. They show in the inventory as on order, and projects and packing lists can use them already. Tap an order to change it, and Arrived when it comes in. New items go into ${esc(project(fb.MAIN_PROJECT).name)}.</p>
      <ul id="order-list" class="members"></ul>
      <h2 id="order-form-title">Add to the order list</h2>
      <input name="name" maxlength="200" list="order-parts" placeholder="Item, or pick a part you already have" />
      <datalist id="order-parts">${sorted(state.parts.map((p) => p.name)).map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="row order-fields">
        <input name="quantity" type="number" min="1" step="1" value="1" aria-label="Quantity" />
        <input name="partNumber" maxlength="200" placeholder="Part #" />
        <input name="supplier" maxlength="200" placeholder="Supplier" />
      </div>
      <input name="link" maxlength="1000" inputmode="url" placeholder="Item link (optional)" />
      <input name="notes" maxlength="1000" placeholder="Notes (optional)" />
      <div class="row">
        <button value="add" id="save-order">Add</button>
        <button type="button" id="cancel-edit" class="secondary" hidden>Cancel</button>
        <button type="button" id="print-orders" class="secondary">Print</button>
        <button value="close" formnovalidate class="secondary">Close</button>
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  autofillFromCatalog(form);
  const list = dialog.querySelector('#order-list');
  const printButton = dialog.querySelector('#print-orders');
  printButton.onclick = printOrders;
  // The order being changed, or null while the form adds new orders. Its item stays the same.
  let editing = null;
  const setEditing = (order) => {
    editing = order;
    form.reset();
    if (order) for (const key of ['name', 'quantity', 'partNumber', 'supplier', 'link', 'notes']) form[key].value = order[key] ?? '';
    form.name.readOnly = Boolean(order);
    dialog.querySelector('#order-form-title').textContent = order ? `Change ${order.name}` : 'Add to the order list';
    dialog.querySelector('#save-order').textContent = order ? 'Save' : 'Add';
    dialog.querySelector('#cancel-edit').hidden = !order;
    printButton.hidden = Boolean(order);
  };
  dialog.querySelector('#cancel-edit').onclick = () => setEditing(null);
  const renderOrders = () => {
    if (editing && !state.orders.some((o) => o.id === editing.id)) setEditing(null);
    printButton.disabled = !state.orders.length;
    list.innerHTML = sortedOrders().map((o) => {
      const part = state.parts.find((p) => p.id === o.partId);
      const details = [o.partNumber, o.supplier, part ? `have ${part.quantity}` : 'new part'].filter(Boolean).map((d) => `<span>${esc(d)}</span>`);
      if (o.link) details.push(`<a href="${esc(o.link)}" target="_blank" rel="noopener">Item link ↗</a>`);
      return `<li>
        <span class="order-text" data-edit="${esc(o.id)}"><strong>${esc(o.name)}</strong> ×${o.quantity} <span class="muted small order-details">${details.join(' · ')}</span>${o.notes ? `<span class="small order-notes">${esc(o.notes)}</span>` : ''}</span>
        <span class="row">
          <button type="button" data-arrived="${esc(o.id)}">Arrived</button>
          <button type="button" class="danger" data-remove="${esc(o.id)}">Remove</button>
        </span>
      </li>`;
    }).join('') || '<li class="muted">Nothing on order.</li>';
  };
  // Adding keeps the dialog open; Enter in a field adds too.
  form.onsubmit = (e) => {
    if (e.submitter?.value === 'close') return;
    e.preventDefault();
    const name = form.name.value.trim();
    const quantity = Number(form.quantity.value);
    if (!name) return showError(new Error('Enter the item to order.'));
    if (!Number.isInteger(quantity) || quantity < 1) return showError(new Error('Order at least 1.'));
    const link = webLink(form.link.value);
    if (link === null) return showError(new Error('That item link is not a web address.'));
    const notes = form.notes.value.trim();
    if (editing) {
      const { id, ...before } = editing;
      const order = {
        name: editing.name, partId: editing.partId, quantity, partNumber: form.partNumber.value.trim(), supplier: form.supplier.value.trim(),
        ...(link && { link }),
        ...(notes && { notes }),
      };
      fb.saveOrder(id, order).catch(showError);
      offerUndo(`Changed ${editing.name}`, () => fb.saveOrder(id, before).catch(showError));
      return setEditing(null);
    }
    const part = state.parts.find((p) => sameName(p.name, name));
    const order = {
      name: part?.name ?? name,
      partNumber: form.partNumber.value.trim() || (part?.partNumber ?? ''),
      supplier: form.supplier.value.trim() || (part?.supplier ?? ''),
      quantity,
      partId: part?.id ?? fb.newPartId(),
      // Left out when empty, so orders without them still pass older firestore.rules.
      ...((link || part?.link) && { link: link || part.link }),
      ...(notes && { notes }),
    };
    // Something new is added to the inventory with none in stock, so it shows as on order and projects can use it.
    // The part is written first, because the rules only accept an order for a part that exists.
    if (!part) writeParts([[order.partId, orderedPart(order, 0)]], 'added', order.name, `Ordered ${quantity}`);
    fb.addOrder(order).catch(showError);
    form.reset();
    form.name.focus();
  };
  list.onclick = (e) => {
    const { arrived, remove } = e.target.dataset;
    if (arrived) return receiveOrder(state.orders.find((o) => o.id === arrived)).catch(showError);
    if (remove) return trashOrder(state.orders.find((o) => o.id === remove));
    const edit = e.target.closest('[data-edit]')?.dataset.edit;
    if (!edit || e.target.closest('a')) return;
    setEditing(state.orders.find((o) => o.id === edit));
    form.quantity.focus();
  };
  renderOrders();
  state.onOrdersChange = renderOrders;
  dialog.addEventListener('close', () => { state.onOrdersChange = null; }, { once: true });
  dialog.showModal();
}

const sortedOrders = () => [...state.orders].sort((a, b) => a.name.localeCompare(b.name));

// Prints the order list as a table.
function printOrders() {
  const headers = ['Item', 'Part #', 'Qty', 'Supplier', 'Notes'];
  const rows = sortedOrders().map((o) => [o.name, o.partNumber, String(o.quantity), o.supplier, o.notes ?? '']);
  printSheet('Order list', `${state.connection.teamName} · ${new Date().toLocaleDateString()}`, headers, [['', rows]]);
}

// A typed link as an https:// address ('' when empty, null when it isn't a web address).
// The Windows app only opens https links, so http:// and missing schemes become https://.
function webLink(text) {
  const rest = text.trim().replace(/^https?:\/\//i, '');
  if (!rest) return '';
  try {
    const url = new URL(`https://${rest}`);
    return url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

// A Main Inventory part for an order of something the team doesn't have.
const orderedPart = (order, quantity) => ({
  projectId: fb.MAIN_PROJECT, name: order.name, partNumber: order.partNumber, quantity, location: '',
  supplier: order.supplier, category: '', tags: [], unit: '', condition: 'new', notes: '',
  ...(order.link && { link: order.link }),
});

// Adds an arrived order to the part it's for, or makes it a new part in Main Inventory
// (orders from before new items were added to the inventory right away, or whose part was deleted).
// Some of an order can arrive first: what's left stays on the order list. Orders without a part arrive all at once.
async function receiveOrder(order) {
  const part = state.parts.find((p) => p.id === order.partId);
  const count = part && order.quantity > 1 ? Number(await ask(`How many ${order.name} arrived?`, order.quantity)) : order.quantity;
  if (!count) return;
  if (!Number.isInteger(count) || count < 1 || count > order.quantity) throw new Error(`Enter a whole number from 1 to ${order.quantity}.`);
  const newPart = part ? null : orderedPart(order, order.quantity);
  logged(fb.receiveOrder(order, newPart, state.user, count), 'arrived', order.name, `+${count} from the order list`);
}

async function deleteCurrentProject() {
  const current = currentProject();
  if (!current.source && inventoryParts(current.id).length) throw new Error(`Delete the parts in ${current.name} first.`);
  const note = current.source ? ' Its parts stay in their inventories.' : '';
  const type = TYPES[typeOf(current)].label.toLowerCase();
  if (!confirm(`Delete the ${type} "${current.name}"?${note} You can bring it back from Trash for ${TRASH_DAYS} days.`)) return;
  switchProject(fb.MAIN_PROJECT);
  const { id, ...data } = current;
  const uses = state.uses.filter((u) => u.projectId === id).map(useData);
  fb.moveToTrash({ kind: 'project', docId: id, name: current.name, data, uses }, state.user).catch(showError);
}

// Renames the inventory, project or packing list on screen, or deletes it. Main Inventory can be renamed but not deleted.
function openListDialog() {
  const dialog = app.querySelector('#dialog');
  const current = currentProject();
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>${TYPES[typeOf(current)].label}</h2>
      <label>Name<input name="name" required maxlength="200" value="${esc(current.name)}" /></label>
      <div class="row">
        <button value="save">Save</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
        ${current.id === fb.MAIN_PROJECT ? '' : '<button value="delete" formnovalidate class="danger">Delete</button>'}
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  form.onsubmit = (e) => {
    const name = form.name.value.trim();
    if (e.submitter.value === 'save' && name !== current.name) fb.renameProject(current.id, name).catch(showError);
    if (e.submitter.value === 'delete') deleteCurrentProject().catch(showError);
  };
  dialog.showModal();
}

// Lists the parts in every inventory; tapping one adds one more to the current project.
function openPicker() {
  const dialog = app.querySelector('#dialog');
  const current = currentProject();
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Add parts</h2>
      <input id="picker-search" type="search" placeholder="Search parts…" />
      <ul id="picker" class="picker"></ul>
      <div class="row"><button value="close">Done</button></div>
    </form>`;
  const search = dialog.querySelector('#picker-search');
  const list = dialog.querySelector('#picker');
  state.picker = () => {
    const query = search.value.toLowerCase();
    list.innerHTML = state.parts
      .filter((p) => !query || matches(p, query))
      .sort((a, b) => a.name.localeCompare(b.name) || inventoryNote(a).localeCompare(inventoryNote(b)))
      .map((p) => {
        const using = useOf(current.id, p.id)?.quantity ?? 0;
        const free = p.quantity - inUse(p.id);
        return `<li><button type="button" class="secondary" data-id="${esc(p.id)}">
          <span><strong>${esc(p.name)}</strong>${orderBadge(p.id)} <span class="muted small">${esc([p.partNumber, p.location, inventoryNote(p)].filter(Boolean).join(' · '))}</span></span>
          <span class="small ${free < 0 ? 'over' : ''}">${free} free${using ? ` · using ${using}` : ''}</span>
        </button></li>`;
      }).join('') || '<li class="muted">No parts match.</li>';
  };
  search.oninput = state.picker;
  search.onkeydown = (e) => { if (e.key === 'Enter') e.preventDefault(); };
  list.onclick = (e) => {
    const id = e.target.closest('button')?.dataset.id;
    if (id) setUse(current.id, id, (useOf(current.id, id)?.quantity ?? 0) + 1);
  };
  dialog.addEventListener('close', () => { state.picker = null; }, { once: true });
  state.picker();
  dialog.showModal();
}

// Adds an inventory part to a project or packing list, straight from the inventory.
function openAddToDialog(part) {
  const dialog = app.querySelector('#dialog');
  const targets = state.projects.filter((p) => p.source);
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Add ${esc(part.name)} to</h2>
      <p class="muted">${esc(project(part.projectId).name)} has ${part.quantity}, and ${part.quantity - inUse(part.id)} are free.</p>
      <label>How many<input name="quantity" type="number" min="1" step="1" required value="1" /></label>
      <ul class="picker">${['project', 'packing'].map((key) => targets.filter((p) => typeOf(p) === key).map((p) => {
        const using = useOf(p.id, part.id)?.quantity ?? 0;
        return `<li><button type="button" class="secondary" data-target="${esc(p.id)}">
          <span class="target">${TYPES[key].icon}<strong>${esc(p.name)}</strong></span>
          ${using ? `<span class="small muted">using ${using}</span>` : ''}
        </button></li>`;
      }).join('')).join('') || '<li class="muted">No projects or packing lists yet. Make one with “New inventory, project or list” in the list picker.</li>'}</ul>
      <div class="row"><button value="cancel" formnovalidate class="secondary">Cancel</button></div>
    </form>`;
  const form = dialog.querySelector('form');
  form.querySelector('.picker').onclick = (e) => {
    const id = e.target.closest('[data-target]')?.dataset.target;
    if (!id || !form.reportValidity()) return;
    setUse(id, part.id, (useOf(id, part.id)?.quantity ?? 0) + Number(form.quantity.value));
    dialog.close();
  };
  dialog.showModal();
}

function openUseDialog(use) {
  const dialog = app.querySelector('#dialog');
  const part = state.parts.find((p) => p.id === use.partId);
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>${esc(part.name)}</h2>
      <p class="muted">${esc(project(part.projectId).name)} has ${part.quantity}, and ${part.quantity - inUse(part.id)} are free.${onOrder(part.id) ? ` ${onOrder(part.id)} more are on order.` : ''}</p>
      <label>${isPacking(use.projectId) ? 'How many to pack' : 'How many this project uses'}<input name="quantity" type="number" min="0" step="1" required value="${use.quantity}" /></label>
      <div class="row">
        <button value="save">Save</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
        <button value="remove" formnovalidate class="danger">Remove</button>
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  form.onsubmit = (e) => {
    const action = e.submitter.value;
    if (action === 'save') setUse(use.projectId, use.partId, Number(form.quantity.value));
    if (action === 'remove') setUse(use.projectId, use.partId, 0);
  };
  dialog.showModal();
}

// Add mode: "Save and add another" reopens the form for a new part, keeping the details in `carry`.
const CARRIED_FIELDS = ['location', 'supplier', 'category', 'unit', 'condition', 'tags'];
// Value of the "+ New…" option in the category and tag pickers.
const NEW_OPTION = '+new';

// `note` explains where the filled-in details came from.
function openPartDialog(part, carry = null, note = '') {
  const dialog = app.querySelector('#dialog');
  const values = part ?? carry;
  const input = (key, label, attrs = '') =>
    `<label>${label}<input name="${key}" value="${esc(values?.[key] ?? '')}" ${attrs} /></label>`;
  const categories = sorted([...categoryPaths(state.parts), values?.category]);
  let tags = [...(values?.tags ?? [])];
  const suggestions = (key) =>
    `<datalist id="${key}-list">${unique(state.parts, key).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`;

  dialog.innerHTML = `
    <form method="dialog" class="card part-form">
      <h2>${part ? 'Edit part' : 'Add part'}</h2>
      ${carry?.added ? `<p class="muted small">${carry.added} added so far. Location, category and tags are kept from the last part.</p>` : ''}
      ${note ? `<p class="muted small">${esc(note)}</p>` : ''}
      ${part && onOrder(part.id) ? `<p class="muted small">${onOrder(part.id)} on order. Tap Arrived in Orders when they come in.</p>` : ''}
      ${input('name', 'Item', 'required')}
      ${input('partNumber', 'Part number')}
      <label>Barcode
        <div class="password">
          <input name="barcode" value="${esc(values?.barcode ?? '')}" maxlength="200" placeholder="Scan a package to fill in" />
          <button type="button" id="scan-barcode" class="secondary" aria-label="Scan barcode">${ICON_SCAN}<span>Scan</span></button>
        </div>
      </label>
      ${input('quantity', 'Quantity', 'type="number" min="0" step="1" required')}
      ${input('minQuantity', 'Low stock at', 'type="number" min="0" max="1000000" step="1" placeholder="Flag at this many free or fewer (optional)"')}
      <label>Location
        <select name="location">
          <option value="">No location</option>
          ${locationNames(values).map((name) => `<option ${name === values?.location ? 'selected' : ''}>${esc(name)}</option>`).join('')}
          <option value="${NEW_OPTION}">+ New location…</option>
        </select>
      </label>
      ${input('supplier', 'Supplier', 'list="supplier-list"')}
      ${input('link', 'Link', 'maxlength="1000" inputmode="url" placeholder="Product page (optional)"')}
      <label>Category
        <select name="category">
          <option value="">No category</option>
          ${categories.map((c) => `<option value="${esc(c)}" ${c === values?.category ? 'selected' : ''}>${esc(categoryLabel(c))}</option>`).join('')}
          <option value="${NEW_OPTION}">+ New category…</option>
        </select>
      </label>
      <div class="field">Tags
        <div id="part-tags" class="tags"></div>
        <select id="add-tag" aria-label="Add a tag"></select>
      </div>
      <details class="more-details" ${DETAIL_FIELDS.some(([key]) => values?.[key]) ? 'open' : ''}>
        <summary>More details</summary>
        <div class="more-fields">
        ${input('unit', 'Unit', 'list="unit-list" placeholder="e.g. pcs"')}
        <label>Condition
          <select name="condition">
            ${Object.entries(CONDITIONS).map(([value, label]) =>
              `<option value="${value}" ${value === (values?.condition ?? '') ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
        <label>Notes<textarea name="notes" rows="3" maxlength="1000">${esc(part?.notes ?? '')}</textarea></label>
        </div>
      </details>
      ${suggestions('supplier')}
      <datalist id="unit-list">${sorted([...UNITS, ...state.parts.map((p) => p.unit)]).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
      ${part?.updatedBy ? `<p class="muted small">Last changed by ${esc(nameByEmail(part.updatedBy))}</p>` : ''}
      <div class="row">
        <button value="save">Save</button>
        ${part ? '' : '<button value="next">Save and add another</button>'}
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
        ${part ? '<button type="button" id="label" class="secondary">Print label</button>' : ''}
        ${part ? '<button value="delete" formnovalidate class="danger">Delete</button>' : ''}
      </div>
    </form>`;

  const form = dialog.querySelector('form');
  if (!part) form.quantity.value = values?.quantity ?? 0;
  if (part) dialog.querySelector('#label').onclick = () => printAndMark([partLabel(part)]);
  // Opening More details scrolls its fields into view, since on a phone they open below the bottom of the screen.
  const more = dialog.querySelector('.more-details');
  more.querySelector('summary').onclick = () => more.open || requestAnimationFrame(() => more.scrollIntoView({ block: 'start', behavior: 'smooth' }));

  watchNewCategory(form.category);
  watchNewLocation(form.location);
  autofillFromCatalog(form);
  dialog.querySelector('#scan-barcode').onclick = () => scanBarcodeInto(form).catch(showError);

  const tagBox = dialog.querySelector('#part-tags');
  const addTag = dialog.querySelector('#add-tag');
  const renderTags = () => {
    tagBox.innerHTML = tags.map((t) => `<button type="button" class="tag" data-tag="${esc(t)}" aria-label="Remove ${esc(t)}">${esc(t)}${TAG_X}</button>`).join('');
    addTag.innerHTML = '<option value="">Add a tag…</option>' +
      allTags(state.parts).filter((t) => !tags.includes(t)).map((t) => `<option>${esc(t)}</option>`).join('') +
      `<option value="${NEW_OPTION}">+ New tag…</option>`;
  };
  tagBox.onclick = (e) => {
    const tag = e.target.closest('[data-tag]')?.dataset.tag;
    if (!tag) return;
    tags = tags.filter((t) => t !== tag);
    renderTags();
  };
  addTag.onchange = async () => {
    const picked = addTag.value === NEW_OPTION ? await ask('New tag') : addTag.value;
    tags = parseTags([...tags, picked].join(','));
    renderTags();
  };
  renderTags();

  form.onsubmit = (e) => {
    const action = e.submitter.value;
    if (action === 'delete' && confirm(deleteMessage(part))) deletePart(part);
    if (action !== 'save' && action !== 'next') return;
    const data = Object.fromEntries([...FIELDS, ...DETAIL_FIELDS].map(([key]) => [key, form[key].value.trim()]));
    data.quantity = Number(data.quantity);
    data.projectId = part?.projectId ?? state.projectId;
    data.tags = tags;
    if (form.barcode.value.trim()) data.barcode = form.barcode.value.trim();
    const link = webLink(form.link.value);
    if (link === null) {
      e.preventDefault();
      return showError(new Error('That link is not a web address.'));
    }
    if (link) data.link = link;
    if (form.minQuantity.value !== '') data.minQuantity = Number(form.minQuantity.value);
    if (part) return editPart(part, data);
    if (!confirmDuplicate(data)) return e.preventDefault();
    addPart(data);
    if (action !== 'next') return;
    e.preventDefault();
    const kept = Object.fromEntries(CARRIED_FIELDS.map((key) => [key, data[key]]));
    openPartDialog(null, { ...kept, added: (carry?.added ?? 0) + 1 });
  };
  if (!dialog.open) dialog.showModal();
  if (carry) form.name.focus();
  // Opening a part to look at it doesn't bring up the phone keyboard; tapping a field does.
  if (part) document.activeElement.blur();
}

// Lets a category picker's "+ New category…" option ask for the new name.
function watchNewCategory(select) {
  let category = select.value;
  select.onchange = async () => {
    if (select.value !== NEW_OPTION) return (category = select.value);
    const typed = await ask('New category. Use "/" for a subcategory, e.g. Electronics/Motors');
    const name = typed ? canonicalCategory(typed) : '';
    if (name && ![...select.options].some((o) => o.value === name)) select.add(new Option(categoryLabel(name), name), select.options.length - 1);
    select.value = name || category;
    category = select.value;
  };
}

// Lets a location picker's "+ New location…" option add a location to the team's list.
function watchNewLocation(select) {
  let previous = select.value;
  select.addEventListener('change', async () => {
    if (select.value !== NEW_OPTION) return (previous = select.value);
    const name = await ask('New location, e.g. Bin 3');
    const known = state.locations.find((l) => sameName(l.name, name));
    if (name && !known) {
      fb.addLocation(name).catch(showError);
      select.add(new Option(name), select.options.length - 1);
    }
    select.value = known?.name ?? (name || previous);
    previous = select.value;
  });
}

// The team's locations, plus the part's own location if it was deleted from the list, so saving keeps it.
const locationNames = (part) =>
  [...new Set([...state.locations.map((l) => l.name), part?.location])].filter(Boolean).sort(naturalCompare);

// Asks before adding a part that looks like one already in the project.
function confirmDuplicate(data) {
  const twin = inventoryParts(data.projectId).find((p) =>
    sameName(p.name, data.name) || (data.partNumber && p.partNumber === data.partNumber));
  if (!twin) return true;
  const where = [twin.location, `qty ${twin.quantity}`].filter(Boolean).join(', ');
  return confirm(`A part named ${twin.name} already exists in this project (${where}). Add it anyway?`);
}

function deleteMessage(part) {
  const users = usesOfPart(part.id).map((u) => project(u.projectId)?.name);
  return `Delete "${part.name}"?${users.length ? ` It will also be removed from ${users.join(', ')}.` : ''} You can bring it back from Trash for ${TRASH_DAYS} days.`;
}

// ---------- changes and undo ----------
// Each change below is written, logged and offered for undo. Undoing writes the opposite change, so it is logged too.

const UNDO_MS = 10000;
let undoTimer;
let undoKey = null;

// Shows "what changed · Undo" for a few seconds. Only the latest change can be undone.
// key names the change while its Undo shows, so a repeat of the same change can be merged into it.
function offerUndo(text, undo, key = null) {
  const bar = app.querySelector('#undo');
  bar.querySelector('span').textContent = text;
  bar.querySelector('button').onclick = () => {
    hideUndo();
    undo();
  };
  bar.hidden = false;
  undoKey = key;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndo, UNDO_MS);
}

function hideUndo() {
  app.querySelector('#undo').hidden = true;
  undoKey = null;
}

// Everything a part stores apart from who changed it last and when.
// A barcode, link or low-stock quantity is only stored when the part has one, so parts without them still save under
// rules from before them.
const partData = (part) => ({
  ...Object.fromEntries([...FIELDS, ...DETAIL_FIELDS].map(([key]) => [key, part[key] ?? ''])),
  projectId: part.projectId,
  tags: part.tags,
  ...(part.barcode && { barcode: part.barcode }),
  ...(part.link && { link: part.link }),
  ...(part.minQuantity != null && { minQuantity: part.minQuantity }),
});

// Logs a change alongside its write rather than after the server confirms it, so an offline change
// is logged even if the app is closed before the device reconnects.
const logged = (write, action, partName, details) =>
  Promise.all([write, fb.logChange(me(), action, partName, details)]).catch(showError);

// Every field an edit can change, with its name for the change log.
const EDIT_FIELDS = [...FIELDS, ...DETAIL_FIELDS, ['barcode', 'Barcode'], ['link', 'Link'], ['minQuantity', 'Low stock at'], ['tags', 'Tags']];

// The fields that differ from `before` to `after`, with their `after` values. A barcode, link or low-stock quantity that
// was taken off is null.
const changedFields = (before, after) => Object.fromEntries(EDIT_FIELDS
  .filter(([key]) => String(before[key] ?? '') !== String(after[key] ?? ''))
  .map(([key]) => [key, after[key] ?? null]));

// Writes new parts ([[id, data]]) and logs them as one entry.
const writeParts = (changes, action, partName, details) => logged(fb.saveParts(changes, state.user), action, partName, details);

// Writes only the changed fields of parts, from [[id, before, after]], and logs them as one entry.
// So a teammate's change to another field in the meantime, like a quantity tap, isn't written over.
const editParts = (edits, action, partName, details) => logged(
  fb.updateParts(edits.map(([id, before, after]) => [id, changedFields(before, after)]), state.user), action, partName, details);

function addPart(data) {
  const id = fb.newPartId();
  writeParts([[id, data]], 'added', data.name, '');
  offerUndo(`Added ${data.name}`, () => trashPart({ id, ...data }, 'Undo: removed after adding'));
}

function editPart(part, data) {
  const details = describeEdit(part, data);
  if (!details) return;
  const before = partData(part);
  editParts([[part.id, before, data]], 'edited', data.name, details);
  offerUndo(`Edited ${data.name}`, () => editParts([[part.id, data, before]], 'edited', part.name, `Undo: ${describeEdit(data, before)}`));
}

function deletePart(part) {
  const entry = trashPart(part, '');
  offerUndo(`Deleted ${part.name}`, () => restore(entry, 'Undo: brought back after delete'));
}

// Moves a part and its project uses to the trash. Returns the trash entry.
function trashPart(part, details) {
  const entry = { kind: 'part', docId: part.id, name: part.name, data: partData(part), uses: usesOfPart(part.id).map(useData) };
  logged(fb.moveToTrash(entry, state.user), 'deleted', part.name, details);
  return entry;
}

// Removing an order can also remove the part it would leave behind with nothing in it.
function trashOrder(order) {
  const { id, ...data } = order;
  const entry = { kind: 'order', docId: id, name: order.name, data, uses: [] };
  const part = emptyPartOf(order);
  const partEntry = part && confirm(`Also remove ${part.name} from ${project(part.projectId).name}? None are in stock.`)
    ? trashPart(part, 'Removed with its order') : null;
  fb.moveToTrash(entry, state.user).catch(showError);
  // The part comes back first, because an order can only be for a part that exists.
  offerUndo(`Removed ${order.name}`, () => (partEntry ? restore(partEntry, 'Undo: brought back with its order') : Promise.resolve())
    .then(() => restore(entry)));
}

// The order's part when removing the order would leave it empty: none in stock, not used anywhere and on no other order.
function emptyPartOf(order) {
  const part = state.parts.find((p) => p.id === order.partId);
  const empty = part && !part.quantity && !usesOfPart(part.id).length && !state.orders.some((o) => o.id !== order.id && o.partId === part.id);
  return empty ? part : null;
}

// Net change of the taps on one part while its Undo shows, so one Undo reverts them all.
let quantityTotal = 0;

function changeQuantity(part, delta, undoable = true) {
  logged(fb.changeQuantity(part.id, delta, state.user), 'quantity', part.name, `Quantity ${delta > 0 ? '+' : ''}${delta}`);
  if (!undoable) return;
  const key = `quantity:${part.id}`;
  const total = quantityTotal = (undoKey === key ? quantityTotal : 0) + delta;
  if (!total) return hideUndo();
  offerUndo(`${part.name} ${total > 0 ? '+' : ''}${total}`, () => changeQuantity(part, -total, false), key);
}

// "Quantity 4 → 6, Location Bin A → Bin B"
function describeEdit(before, after) {
  return EDIT_FIELDS
    .map(([key, label]) => [label, String(before[key] ?? ''), String(after[key] ?? '')])
    .filter(([, from, to]) => from !== to)
    .map(([label, from, to]) => `${label} ${from || '(blank)'} → ${to || '(blank)'}`)
    .join(', ')
    .slice(0, 2000); // the rules' limit for log details
}

const partName = (partId) => state.parts.find((p) => p.id === partId)?.name ?? 'a part';

const writeUse = (projectId, partId, quantity, packed, details) =>
  logged(fb.setUse(projectId, partId, quantity, packed), 'used', partName(partId), details);

// Changes how many of an inventory part a project uses. A packing list item stays packed or unpacked.
function setUse(projectId, partId, quantity) {
  const use = useOf(projectId, partId);
  const before = use?.quantity ?? 0;
  const packed = isPacking(projectId) ? use?.packed ?? false : undefined;
  const details = (from, to) => `Used in ${project(projectId).name}: ${from} → ${to}`;
  writeUse(projectId, partId, quantity, packed, details(before, quantity));
  offerUndo(`${partName(partId)}: using ${quantity}`, () => writeUse(projectId, partId, before, packed, `Undo: ${details(quantity, before)}`));
}

// Checking off a packing list item takes it from the inventory, like a project use. Unchecking puts it back.
function setPacked(use, packed) {
  const details = (to) => `${to ? 'Packed' : 'Unpacked'} ${use.quantity} for ${project(use.projectId).name}`;
  writeUse(use.projectId, use.partId, use.quantity, packed, details(packed));
  offerUndo(`${packed ? 'Packed' : 'Unpacked'} ${partName(use.partId)}`,
    () => writeUse(use.projectId, use.partId, use.quantity, !packed, `Undo: ${details(!packed)}`));
}

// ---------- trash ----------
// Deleted parts, projects and orders stay in the trash for TRASH_DAYS days. Each entry holds the deleted doc's
// data and the project uses deleted with it, so bringing it back puts everything where it was.

const TRASH_DAYS = 30;
const DAY_MS = 24 * 3600 * 1000;
// A project use as stored, without the id the app adds when reading it.
const useData = ({ id, ...use }) => use;

// What it was, for the trash list.
function trashKind(entry) {
  if (entry.kind === 'project') return TYPES[typeOf(entry.data)].label;
  return { part: 'Part', order: 'Order' }[entry.kind];
}

// What belonged with the entry may be gone too. A part or project whose inventory is gone comes back into Main Inventory,
// an order whose part is gone comes back as an order for a new part, and uses of parts or projects that are gone are left out.
function restorable(entry) {
  const data = { ...entry.data };
  if (entry.kind === 'part' && !project(data.projectId)) data.projectId = fb.MAIN_PROJECT;
  if (entry.kind === 'project' && data.source && !project(data.source)) data.source = fb.MAIN_PROJECT;
  if (entry.kind === 'order' && data.partId && !state.parts.some((p) => p.id === data.partId)) data.partId = '';
  const exists = (projectId, partId) =>
    (projectId === entry.docId || project(projectId)) && (partId === entry.docId || state.parts.some((p) => p.id === partId));
  const uses = entry.kind === 'order' ? [] : entry.uses.filter((u) => exists(u.projectId, u.partId));
  return { ...entry, data, uses };
}

function restore(entry, details = 'Brought back from Trash') {
  const write = fb.restoreFromTrash(restorable(entry), state.user);
  return entry.kind === 'part' ? logged(write, 'added', entry.name, details) : write.catch(showError);
}

function deleteForever(entry) {
  const write = fb.deleteFromTrash(entry);
  if (entry.kind === 'part') logged(write, 'deleted', entry.name, 'Deleted forever from Trash');
  else write.catch(showError);
}

// Only the team owner can delete something for good; everyone else's deletes can be undone for TRASH_DAYS days.
// Offline, the team's info may not be on this device, so Delete forever waits until the device is back online.
async function openTrashDialog() {
  const owner = await fb.getTeam().then((team) => team.owner === state.user.uid, () => false);
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Trash</h2>
      <p class="muted small">Deleted parts, projects, packing lists and orders stay here for ${TRASH_DAYS} days, then they're gone for good.</p>
      <ul id="trash-list" class="members stacked"><li class="muted">Loading…</li></ul>
      <div class="row"><button value="close" class="secondary">Close</button></div>
    </form>`;
  const list = dialog.querySelector('#trash-list');
  let entries = [];
  const stop = fb.watchTrash((docs) => {
    entries = docs.sort((a, b) => b.deletedAt.toMillis() - a.deletedAt.toMillis());
    list.innerHTML = entries.map((e, i) => {
      const daysLeft = Math.max(1, Math.ceil(TRASH_DAYS - (Date.now() - e.deletedAt.toMillis()) / DAY_MS));
      const details = [trashKind(e), `deleted by ${nameByEmail(e.deletedBy)}`, `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`].join(' · ');
      return `<li>
        <span><strong>${esc(e.name)}</strong> <span class="muted small">${esc(details)}</span></span>
        <span class="row">
          <button type="button" data-restore="${i}">Restore</button>
          ${owner ? `<button type="button" class="danger" data-forever="${i}">Delete forever</button>` : ''}
        </span>
      </li>`;
    }).join('') || '<li class="muted">The trash is empty.</li>';
  }, showError);
  list.onclick = (e) => {
    const { restore: restoreIndex, forever } = e.target.dataset;
    if (restoreIndex) restore(entries[restoreIndex]);
    if (forever && confirm(`Delete "${entries[forever].name}" for good? This can't be undone.`)) deleteForever(entries[forever]);
  };
  dialog.addEventListener('close', stop, { once: true });
  dialog.showModal();
}

// ---------- bulk edit ----------

function toggleSelected(id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  renderRows();
}

// Value of the "Keep" option in the bulk edit pickers.
const KEEP = '+keep';

// Sets the location, category or low-stock quantity of every selected part, and adds or removes tags.
function openBulkEditDialog() {
  const dialog = app.querySelector('#dialog');
  const parts = state.parts.filter((p) => state.selected.has(p.id));
  const add = [];
  const remove = [];
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Edit ${countParts(parts.length)}</h2>
      <label>Location
        <select name="location">
          <option value="${KEEP}">Keep each part's location</option>
          <option value="">No location</option>
          ${locationNames().map((name) => `<option>${esc(name)}</option>`).join('')}
          <option value="${NEW_OPTION}">+ New location…</option>
        </select>
      </label>
      <label>Category
        <select name="category">
          <option value="${KEEP}">Keep each part's category</option>
          <option value="">No category</option>
          ${categoryPaths(state.parts).map((c) => `<option value="${esc(c)}">${esc(categoryLabel(c))}</option>`).join('')}
          <option value="${NEW_OPTION}">+ New category…</option>
        </select>
      </label>
      <label>Low stock at
        <input name="minQuantity" type="number" min="0" max="1000000" step="1" placeholder="Keep each part's" />
      </label>
      <div class="field">Tags
        <div id="bulk-tags" class="tags"></div>
        <select id="add-tag" aria-label="Add a tag"></select>
      </div>
      <div class="row">
        <button value="save">Save</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  watchNewCategory(form.category);
  watchNewLocation(form.location);

  const tagBox = dialog.querySelector('#bulk-tags');
  const addTag = dialog.querySelector('#add-tag');
  // Chips: tags the selected parts have (× removes it from all of them, struck through until saved), then tags being added.
  const renderTags = () => {
    const chip = (t, label, text, extra = '') =>
      `<button type="button" class="tag${extra}" data-tag="${esc(t)}" aria-label="${label} ${esc(t)}">${text}</button>`;
    tagBox.innerHTML = [
      ...allTags(parts).filter((t) => !add.includes(t)).map((t) => (remove.includes(t)
        ? chip(t, 'Keep', esc(t), ' removed')
        : chip(t, 'Remove from selected parts:', `${esc(t)}${TAG_X}`))),
      ...add.map((t) => chip(t, "Don't add", `+ ${esc(t)}${TAG_X}`)),
    ].join('');
    addTag.innerHTML = '<option value="">Add a tag…</option>' +
      allTags(state.parts).filter((t) => !add.includes(t) && !remove.includes(t)).map((t) => `<option>${esc(t)}</option>`).join('') +
      `<option value="${NEW_OPTION}">+ New tag…</option>`;
  };
  tagBox.onclick = (e) => {
    const tag = e.target.closest('[data-tag]')?.dataset.tag;
    if (!tag) return;
    if (add.includes(tag)) add.splice(add.indexOf(tag), 1);
    else if (remove.includes(tag)) remove.splice(remove.indexOf(tag), 1);
    else remove.push(tag);
    renderTags();
  };
  addTag.onchange = async () => {
    const picked = addTag.value === NEW_OPTION ? await ask('New tag') : addTag.value;
    add.push(...parseTags(picked).filter((t) => !add.includes(t) && !remove.includes(t)));
    renderTags();
  };
  renderTags();

  form.onsubmit = (e) => {
    if (e.submitter.value !== 'save') return;
    const set = (key) => (form[key].value === KEEP ? {} : { [key]: form[key].value });
    const edits = parts.map((p) => [p.id, partData(p), {
      ...partData(p), ...set('location'), ...set('category'),
      ...(form.minQuantity.value !== '' && { minQuantity: Number(form.minQuantity.value) }),
      tags: parseTags([...p.tags.filter((t) => !remove.includes(t)), ...add].join(',')),
    }]).filter(([, before, after]) => describeEdit(before, after));
    if (!edits.length) return;
    const details = [
      form.location.value !== KEEP && `Location → ${form.location.value || '(blank)'}`,
      form.category.value !== KEEP && `Category → ${form.category.value || '(blank)'}`,
      form.minQuantity.value !== '' && `Low stock at → ${form.minQuantity.value}`,
      add.length && `Tags + ${add.join(', ')}`,
      remove.length && `Tags − ${remove.join(', ')}`,
    ].filter(Boolean).join('; ').slice(0, 1990); // the rules' limit for log details, with room for "Undo: "
    const name = countParts(edits.length);
    editParts(edits, 'edited', name, details);
    offerUndo(`Edited ${name}`, () => editParts(edits.map(([id, before, after]) => [id, after, before]), 'edited', name, `Undo: ${details}`));
    state.selected = null;
    renderRows();
  };
  dialog.showModal();
}

const ACTIONS = { added: 'added', edited: 'edited', quantity: 'changed', deleted: 'deleted', used: 'changed use of', arrived: 'received' };

function openLogDialog() {
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Change log</h2>
      <ul id="log-list" class="log"><li class="muted">Loading…</li></ul>
      <div class="row"><button value="close" class="secondary">Close</button></div>
    </form>`;
  const list = dialog.querySelector('#log-list');
  const stopLog = fb.watchLog((entries) => {
    list.innerHTML = entries.length ? entries.map((e) => `
      <li>
        <div><strong>${esc(nameByUid(e.by, e.byName))}</strong> ${ACTIONS[e.action]} <strong>${esc(e.part)}</strong></div>
        ${e.details ? `<div class="small">${esc(e.details)}</div>` : ''}
        <div class="muted small">${esc(e.at.toDate().toLocaleString())}</div>
      </li>`).join('') : '<li class="muted">No changes yet.</li>';
  }, showError);
  dialog.addEventListener('close', stopLog, { once: true });
  dialog.showModal();
}

// Goes to the app's developer, not the team (see hub.js).
function openBugDialog() {
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Report a bug</h2>
      <p class="muted small">This is logged to a central server with your team name and app version. Please don't include personal info.</p>
      <label>What went wrong?<textarea name="text" rows="6" maxlength="5000" required placeholder="What you did, what you expected, and what happened instead"></textarea></label>
      <div class="row">
        <button value="send">Send</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
      </div>
    </form>`;
  const form = dialog.querySelector('form');
  form.onsubmit = (e) => {
    if (e.submitter.value !== 'send') return;
    // Sent in the background, so it still goes out once an offline device reconnects.
    sendBugReport(state.connection.teamName, form.text.value.trim())
      .then(() => alert('Thanks! Your bug report was sent.'))
      .catch(showError);
  };
  dialog.showModal();
}

// Shows the team dialog again with the new join code.
async function reopenTeamDialog() {
  app.querySelector('#dialog').close();
  await openTeamDialog();
}

// The join code is built from the team's current secret, so it stays valid after the owner resets it.
// A button that copies `text` and says "Copied" for a moment.
function copyButton(button, text) {
  const label = button.textContent;
  button.onclick = () => navigator.clipboard.writeText(text).then(() => {
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = label; }, 1500);
  }).catch(showError);
}

// How the team admin publishes the app's rules. `open` when the published rules let anyone in.
function openRulesDialog(open) {
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>${open ? 'Fix your Firebase rules' : 'Update your Firebase rules'}</h2>
      <p class="muted">${open
        ? 'Your team’s Firebase project isn’t using the app’s rules, so anyone could read your inventory and your members’ emails.'
        : 'This version of the app needs newer rules. New features won’t work until they’re published.'}
        Only your team admin, the person who owns the team’s Firebase project, can do this. It doesn’t change any of your team’s data.</p>
      <ol class="steps">
        <li><button type="button" id="copy-rules" class="secondary">Copy rules</button></li>
        <li><a href="${esc(consolePage(state.connection.config.projectId, RULES_PAGE))}" target="_blank" rel="noopener">Open your Firebase rules</a>, signed in with the Google account that owns the project.</li>
        <li>Select everything in the rules editor, paste the rules over it and click <strong>Publish</strong>.</li>
        <li>Wait a minute, then reopen the app.</li>
      </ol>
      <p class="muted small">Not the admin? Send them the <a href="${SETUP_URL}#updating-the-rules" target="_blank" rel="noopener">update steps</a>.</p>
      <div class="row"><button value="close" class="secondary">Close</button></div>
    </form>`;
  copyButton(dialog.querySelector('#copy-rules'), RULES);
  dialog.showModal();
}

async function openTeamDialog() {
  const dialog = app.querySelector('#dialog');
  const team = await fb.getTeam();
  const owner = team.owner === state.user.uid;
  if (owner) fb.setJoinInfo(state.connection.config, team.name).catch(showError);
  const code = encodeJoinCode({ projectId: state.connection.config.projectId, secret: team.secret });
  const link = `${WEB_URL}#join=${code}`;
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Invite teammates</h2>
      <p class="muted">Teammates scan this or open the link, then sign in. In the Windows, Android or iPhone app, they choose Scan QR under Join a team, or paste the join code. To use your account on another device, choose Sign in to your team and enter your team number.</p>
      <canvas id="qr"></canvas>
      <div class="field">Join code
        <div class="password">
          <input readonly value="${esc(code)}" aria-label="Join code" />
          <button type="button" id="copy-code" class="secondary">Copy</button>
        </div>
      </div>
      <button type="button" id="copy-link">Copy join link</button>
      <p class="muted small">Only share these with your team. Anyone with them can join.</p>
      <h2>Your name</h2>
      <div class="password">
        <input id="my-name" maxlength="40" value="${esc(nameOf(state.members.find((m) => m.uid === state.user.uid)))}" />
        <button type="button" id="save-name" class="secondary">Save</button>
      </div>
      <h2>Members</h2>
      <ul id="members" class="members"></ul>
      ${owner ? `
        <p class="muted small">Removing a member automatically resets the join link. Reset the code yourself if it was shared by mistake.</p>
        <button type="button" id="reset-code" class="danger">Reset join code</button>
        <button type="button" id="delete-team" class="danger">Delete team</button>` : ''}
      <p class="muted small">FTC Ultimate Inventory is open source under the AGPL v3. <a href="${SOURCE_URL}" target="_blank" rel="noopener">Source code</a></p>
      <div class="row"><button value="close" class="secondary">Close</button></div>
    </form>`;
  copyButton(dialog.querySelector('#copy-link'), link);
  copyButton(dialog.querySelector('#copy-code'), code);
  await QRCode.toCanvas(dialog.querySelector('#qr'), link, { width: 220, margin: 1 });

  dialog.querySelector('#save-name').onclick = async () => {
    const name = dialog.querySelector('#my-name').value.trim();
    if (!name) return showError(new Error('Your name can\'t be empty.'));
    await fb.setMyName(state.user.uid, name).catch(showError);
  };
  const list = dialog.querySelector('#members');
  const renderMembers = () => {
    list.innerHTML = [...state.members].sort((a, b) => nameOf(a).localeCompare(nameOf(b))).map((m) => `
      <li>
        <span><strong>${esc(nameOf(m))}</strong> <span class="muted small">${esc(m.email)}</span></span>
        ${m.uid === team.owner ? '<span class="muted small">Owner</span>'
          : owner ? `<button type="button" class="danger" data-uid="${esc(m.uid)}" data-name="${esc(nameOf(m))}">Remove</button>` : ''}
      </li>`).join('');
  };
  renderMembers();
  state.onMembersChange = renderMembers;
  dialog.addEventListener('close', () => { state.onMembersChange = null; }, { once: true });

  if (owner) {
    // Removing someone also replaces the join code, so the code they still have can't get them back in.
    list.onclick = async (e) => {
      const { uid, name } = e.target.dataset;
      if (!uid || !confirm(`Remove ${name} from the team? This also makes a new join code.`)) return;
      await fb.removeMember(uid, newSecret()).then(reopenTeamDialog).catch(showError);
    };
    dialog.querySelector('#reset-code').onclick = async () => {
      if (confirm('Make a new join code? The old code and link will stop working.')) await fb.setTeamSecret(newSecret()).then(reopenTeamDialog).catch(showError);
    };
    dialog.querySelector('#delete-team').onclick = () => deleteTeam().catch(showError);
  }
  dialog.showModal();
}

// Like ask(), with an optional reason that goes to the developer with the deleted team (see hub.js).
// Resolves to the form, or null if cancelled.
function askDeleteTeam() {
  const dialog = app.querySelector('#ask');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <label>Delete your team? Type your team number to confirm, e.g. FTC 26706.<input name="team" /></label>
      <label>Why are you leaving? (optional)<textarea name="reason" rows="3" maxlength="1000" placeholder="This is logged to a central server. Please don't include personal info."></textarea></label>
      <div class="row">
        <button value="ok">OK</button>
        <button value="cancel" formnovalidate class="secondary">Cancel</button>
      </div>
    </form>`;
  dialog.returnValue = ''; // Escape keeps the last returnValue
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok' ? dialog.querySelector('form') : null), { once: true });
  });
}

// The app can't delete a Firebase project, so it records the team as deleted for the developer (see hub.js),
// then points the owner to the Firebase console to erase the inventory and accounts.
async function deleteTeam() {
  const form = await askDeleteTeam();
  if (!form) return;
  // The program is optional for FTC teams.
  const match = form.team.value.trim().match(/^(?:(ftc|frc|fll|other)\s*)?([1-9][0-9]{0,5})$/i);
  if (!match) throw new Error('Enter your team number, e.g. FTC 26706.');
  const program = PROGRAMS.find((p) => p.toLowerCase() === (match[1] ?? 'ftc').toLowerCase());
  const ownerKey = await fb.getOwnerKey();
  if (!ownerKey) throw new Error('This team isn’t on the central server’s list of active teams.');
  await recordDeletedTeam(program, Number(match[2]), ownerKey, form.reason.value.trim()).catch((error) => {
    if (error.code !== 'permission-denied') throw error;
    throw new Error(`${program} team ${match[2]} isn't on the central server's list of active teams.`);
  });
  const dialog = app.querySelector('#dialog');
  dialog.innerHTML = `
    <form method="dialog" class="card">
      <h2>Team deleted</h2>
      <p>To erase your inventory and everyone's accounts, delete your Firebase project: open it, scroll to the bottom and click <strong>Delete project</strong>.</p>
      <p><a href="https://console.firebase.google.com/project/${esc(state.connection.config.projectId)}/settings/general" target="_blank" rel="noopener">Open your Firebase project</a></p>
      <div class="row"><button value="done">Done</button></div>
    </form>`;
  // This device leaves the team when the dialog closes.
  dialog.addEventListener('close', forgetConnection, { once: true });
}

// ---------- startup ----------

// Puts the team on the developer's team list (see hub.js), so teammates can sign in by team number.
// Checked each time the app opens on the device that set up the team, so a try that failed (say, offline) is made again,
// and the owner hears about it when the number is already taken.
// The owner key is saved in the team's own project first, so the owner can always take the team off the list later.
// Test teams on the local emulators ("demo-" project IDs) stay off the real list.
async function registerTeam() {
  const { teamName, program, teamNumber, config } = state.connection;
  if (config.projectId.startsWith('demo-')) return;
  if (!navigator.onLine || await teamProject(program, teamNumber) === config.projectId) return;
  let ownerKey = await fb.getOwnerKey();
  if (!ownerKey) {
    ownerKey = newSecret();
    await fb.saveOwnerKey(ownerKey);
  }
  await recordTeam(teamName, program, teamNumber, config.projectId, ownerKey).catch((error) => {
    if (error.code !== 'permission-denied') throw error;
    throw new Error(`${program} team ${teamNumber} is already on the central server's team list, so teammates can't sign in by team number. They can still join with the join code. Use Report bug to get it fixed.`);
  });
}

async function joinFromLink() {
  const code = new URLSearchParams(location.hash.slice(1)).get('join');
  if (!code) return;
  history.replaceState(null, '', location.pathname);
  const joining = await decodeJoinCode(code);
  const current = state.connection;
  // Already on this team: keep the secret, so someone new on this device can join with it.
  if (current?.config.projectId === joining.config.projectId) return saveConnection({ ...current, secret: joining.secret });
  if (current && !confirm(`Switch from ${current.teamName} to ${joining.teamName}?`)) return;
  saveConnection({ ...joining, role: 'member' });
}

// A scanned label opened in the browser: remember it until the inventory has loaded.
function labelFromLink() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has('part') && !params.has('location')) return;
  history.replaceState(null, '', location.pathname);
  state.pendingLink = params;
}

function dataChanged(key, docs) {
  state[key] = docs;
  state.loaded.add(key);
  if (key === 'projects') {
    docs.sort((a, b) => (a.id === fb.MAIN_PROJECT ? -1 : b.id === fb.MAIN_PROJECT ? 1 : a.name.localeCompare(b.name)));
    if (!currentProject()) state.projectId = fb.MAIN_PROJECT;
    if (project(state.newProjectId)) {
      switchProject(state.newProjectId);
      state.newProjectId = null;
    }
  }
  renderRows();
  state.picker?.();
  state.onLocationsChange?.();
  if (!state.pendingLink || state.loaded.size < 3) return;
  const link = state.pendingLink;
  state.pendingLink = null;
  try {
    openLink(link);
  } catch (error) {
    showError(error);
  }
}

async function start() {
  if (DEMO) {
    fb = await import('./demo.js');
    state.connection = { teamName: 'Demo Team' };
    document.getElementById('demo-banner').hidden = false;
  } else {
    state.connection = JSON.parse(localStorage.getItem(STORAGE_KEY));
    try {
      await joinFromLink();
      labelFromLink();
    } catch (error) {
      alert(error.message);
    }
    if (!state.connection) return renderWelcome();
  }

  fb.connect(state.connection.config);
  renderLoading();
  let stopWatching = [];
  fb.watchUser(async (user) => {
    stopWatching.forEach((stop) => stop());
    state.user = null;
    state.loaded.clear();
    if (!user) return renderSignIn();
    try {
      const createdTeam = await fb.ensureMembership(user, state.connection, state.newName || nameOf({ email: user.email }), state.acceptedPrivacy);
      // Signing in by team number reads join/info, so it must exist before the owner ever opens Team.
      if (createdTeam) fb.setJoinInfo(state.connection.config, state.connection.teamName).catch(showError);
      if (state.connection.role === 'owner') registerTeam().catch(showError);
      state.newName = null;
      forgetSecret();
      await fb.ensureMainProject();
    } catch (error) {
      const creating = state.connection.role === 'owner' && state.connection.secret;
      state.signInError = error.code !== 'permission-denied' ? error
        // The owner's first sign-in creates the team, which only the app's rules allow.
        : creating ? errorWithLink('Your Firebase project doesn’t have the app’s rules yet (setup step 3). Publish them, then sign in.',
          `${SETUP_URL}#3-create-the-database`, 'Show me how')
          : new Error(`Couldn't join ${state.connection.teamName}. Ask your team admin for a fresh join code.`);
      await fb.logOut();
      return;
    }
    state.user = user;
    renderInventory();
    checkRules(fb).catch(showError);
    fb.clearTrash(new Date(Date.now() - TRASH_DAYS * DAY_MS)).catch(showError);
    const onError = (error) => {
      if (error.code !== 'permission-denied') return showError(error);
      state.signInError = new Error(`You no longer have access to ${state.connection.teamName}.`);
      fb.logOut();
    };
    stopWatching = [
      fb.watchMembers((members) => {
        state.members = members;
        renderRows();
        state.onMembersChange?.();
      }, onError),
      fb.watchProjects((docs) => dataChanged('projects', docs), onError),
      fb.watchParts((docs) => dataChanged('parts', docs), onError),
      fb.watchUses((docs) => dataChanged('uses', docs), onError),
      fb.watchLocations((docs) => {
        state.locations = docs.sort((a, b) => naturalCompare(a.name, b.name));
        state.onLocationsChange?.();
      }, onError),
      fb.watchOrders((docs) => {
        state.orders = docs;
        renderRows();
        state.picker?.();
        state.onOrdersChange?.();
      }, onError),
      fb.watchPrinted((docs) => { state.printed = new Set(docs.map((d) => d.id)); }, onError),
    ];
  });
}

// The website keeps its own files on the device so it opens offline (see sw.js). The apps ship with theirs.
if (import.meta.env.PROD && import.meta.env.MODE !== 'app') navigator.serviceWorker.register('sw.js').catch(console.error);
startStatusBanners();
start();
