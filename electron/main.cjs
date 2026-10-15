// Windows desktop app: a window that shows the same web app, bundled from dist/.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const INDEX = path.join(__dirname, '../dist/index.html');

const openInBrowser = (url) => {
  if (url.startsWith('https://')) shell.openExternal(url);
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
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
