// The topographic lines of the first screens and guide pages (.topo in style.css) drift at half the scroll speed.
// They follow the scroll on a spring, so they speed up and slow down smoothly even when the page jumps or is flicked fast. With reduced motion they stay still.
const topo = document.body.appendChild(document.createElement('div'));
topo.className = 'topo';
const STIFFNESS = 64, DAMPING = 16; // critically damped: no overshoot, settles in under a second
let y = 0, speed = 0, last = 0, running = false;
const step = (time) => {
  const dt = Math.min(Math.max(time - last, 0), 50) / 1000;
  last = time;
  const target = scrollY / 2;
  speed += (STIFFNESS * (target - y) - DAMPING * speed) * dt;
  y += speed * dt;
  running = Math.abs(target - y) > 0.1 || Math.abs(speed) > 1;
  if (!running) { y = target; speed = 0; }
  topo.style.transform = `translateY(${-(y % (2 * Math.max(innerWidth, 1280)))}px)`; // wraps at one tile of topo.svg (twice its width)
  if (running) requestAnimationFrame(step);
};
const start = () => {
  if (running || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(step);
};
addEventListener('scroll', start, { passive: true });
start();
