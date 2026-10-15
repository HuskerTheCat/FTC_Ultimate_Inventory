// Banners above the app: one while offline, one when a newer version is out.
// The website compares its build id with the deployed version.json; the Windows and Android apps compare their
// version with the latest GitHub release.
const RELEASES_API = 'https://api.github.com/repos/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest';
const RELEASES_PAGE = 'https://github.com/HuskerTheCat/FTC_Ultimate_Inventory/releases/latest';
const WEB_CHECK_MS = 15 * 60 * 1000;

const offlineBanner = document.getElementById('offline-banner');
const updateBanner = document.getElementById('update-banner');

function showOffline() {
  offlineBanner.hidden = navigator.onLine;
}

function showUpdate(text, href, target) {
  updateBanner.textContent = text;
  updateBanner.href = href;
  if (target) updateBanner.target = target;
  updateBanner.hidden = false;
}

async function checkWebsite() {
  if (!navigator.onLine || !updateBanner.hidden) return;
  const response = await fetch('version.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`version.json: ${response.status}`);
  const { build } = await response.json();
  if (build !== __BUILD_ID__) showUpdate('New version available, tap to refresh', location.href.split('#')[0]);
}

async function checkApp() {
  const response = await fetch(RELEASES_API);
  if (!response.ok) throw new Error(`GitHub releases: ${response.status}`);
  const { tag_name } = await response.json();
  if (tag_name !== `v${__APP_VERSION__}`) showUpdate(`Update available (${tag_name}), tap to download`, RELEASES_PAGE, '_blank');
}

export function startStatusBanners() {
  showOffline();
  addEventListener('online', showOffline);
  addEventListener('offline', showOffline);
  if (import.meta.env.DEV) return;
  if (import.meta.env.MODE === 'app') {
    if (navigator.onLine) checkApp();
    else addEventListener('online', checkApp, { once: true });
    return;
  }
  setInterval(checkWebsite, WEB_CHECK_MS);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkWebsite());
}
