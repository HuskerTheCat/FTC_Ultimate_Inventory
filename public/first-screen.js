// Sets up the grey placeholder index.html shows until the app's code has drawn its first screen: in the saved theme (src/main.js
// sets it again), shaped like the inventory on a device that was signed in to its team last time (SIGNED_IN_KEY in src/main.js)
// and in the demo, else like a sign-in card. A plain script in <head>, so it runs before anything is shown.
document.documentElement.dataset.theme = localStorage.getItem('ftc-inventory-theme') ?? 'dark';
const savedTeam = JSON.parse(localStorage.getItem('ftc-inventory-connection'));
if (new URLSearchParams(location.search).has('demo') || (savedTeam && localStorage.getItem('ftc-inventory-signed-in') === savedTeam.config.projectId)) {
  document.documentElement.dataset.firstScreen = 'inventory';
}
