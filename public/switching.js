// Every page load shows the app's loading screen, #switching in index.html, from its first paint until the app has drawn
// its first screen, then fades it out. Opening another FTC Ultimate app on the website (src/switching.js) fades into the
// same screen first, so the switch looks like one loading screen. A plain script in <head>, so it runs before anything is shown.
document.documentElement.classList.add('switching');
const drawn = new MutationObserver(() => {
  if (!document.getElementById('app')?.firstElementChild) return;
  drawn.disconnect();
  document.documentElement.classList.remove('switching');
});
drawn.observe(document.documentElement, { childList: true, subtree: true });
// Coming back with the browser's Back button, the page is still covered by the loading screen.
addEventListener('pageshow', (e) => e.persisted && document.documentElement.classList.remove('switching'));
