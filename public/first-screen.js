// Picks which of index.html's first screens shows until the app's code has drawn the real one, and sets the saved theme
// (src/main.js sets it again). The inventory's loading screen on a device that was signed in to its team last time
// (SIGNED_IN_KEY in src/main.js) and in the demo, the sign-in screen for a saved team, else the welcome screen.
// A plain script in <head>, so it runs before anything is shown.
document.documentElement.dataset.theme = localStorage.getItem('ftc-inventory-theme') ?? 'dark';
const savedTeam = JSON.parse(localStorage.getItem('ftc-inventory-connection'));
document.documentElement.dataset.firstScreen = new URLSearchParams(location.search).has('demo') ? 'inventory'
  : !savedTeam ? 'welcome'
    : localStorage.getItem('ftc-inventory-signed-in') === savedTeam.config.projectId ? 'inventory' : 'signin';
