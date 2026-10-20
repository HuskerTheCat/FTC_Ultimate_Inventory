// The topographic lines drift at half the scroll speed. The tile repeats seamlessly, so the offset wraps at its height (twice its width, see the ::after rule in style.css).
const root = document.documentElement;
let queued = false;
addEventListener('scroll', () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    root.style.setProperty('--topo-y', `${(scrollY * 0.5) % (2 * Math.max(innerWidth, 1280))}px`);
  });
}, { passive: true });
