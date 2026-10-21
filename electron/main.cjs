// Windows desktop app: a window that shows the same web app, bundled from dist/.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const INDEX = path.join(__dirname, '../dist/index.html');

// Each FTC Ultimate Windows app registers a link scheme (see SUITE.md). Competition and Design open Inventory with this one,
// and the app switcher's links to their web pages open their Windows app instead when it's installed.
const SCHEME = 'ftc-ultimate-inventory';
const SUITE_APPS = {
  'https://huskerthecat.github.io/FTC_Ultimate_Competition/': 'ftc-ultimate-competition://open',
  'https://huskerthecat.github.io/FTC_Ultimate_Design/': 'ftc-ultimate-design://open',
};

const openInBrowser = (url) => {
  const appLink = SUITE_APPS[url];
  if (appLink && app.getApplicationNameForProtocol(appLink)) shell.openExternal(appLink);
  else if (url.startsWith('https://')) shell.openExternal(url);
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../dist/icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  // The app never leaves its own page: other links open in the normal browser, and only https links at all.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openInBrowser(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url.split(/[?#]/)[0] === pathToFileURL(INDEX).href) return; // the app reloading itself, or opening ?demo
    event.preventDefault();
    openInBrowser(url);
  });
  win.loadFile(INDEX);
}

Menu.setApplicationMenu(null);
if (app.isPackaged) app.setAsDefaultProtocolClient(SCHEME);
// One window: opening the app again, or from Competition or Design, brings it to the front.
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(createWindow);
app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win.isMinimized()) win.restore();
  win.focus();
});
app.on('window-all-closed', () => app.quit());
