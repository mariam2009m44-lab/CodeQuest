/* Shared 3D backdrop for the existing CodeQuest games.
   Floating low-poly code shapes with pointer/tilt parallax behind the game UI.
   Falls back silently (the page keeps its normal background) when WebGL is unavailable. */
import * as THREE from '../assets/vendor/three.module.min.js';

(function start() {
  const body = document.body;
  if (!body || !body.classList.contains('cq-game-page')) return;
  const old = document.getElementById('bg-canvas');
  const canvas = document.createElement('canvas');
  canvas.id = 'bg3d'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { return; }
  if (old) old.remove();
  body.prepend(canvas);
  // Move the page background to <html> so the canvas (z-index -1) is not painted over by the body background.
  const cs = getComputedStyle(body), root = document.documentElement;
  const bright = ['bright','space'].includes(body.dataset.cqTheme);
  root.style.backgroundColor = cs.backgroundColor; root.style.backgroundImage = body.dataset.cqTheme === 'space' ? 'radial-gradient(ellipse at 50% 0%,#25126b,transparent 55%),linear-gradient(160deg,#060625,#10104b 60%,#090829)' : bright ? 'linear-gradient(170deg,#7c6cff 0%,#4f8cff 48%,#39c6d9 100%)' : cs.backgroundImage;
  root.style.backgroundAttachment = 'fixed'; body.style.background = 'transparent';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  camera.position.z = 14;
  scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x1a2140, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(5, 8, 8); scene.add(key);
  const rim = new THREE.PointLight(0x6be8ff, 40, 40); rim.position.set(-8, -4, 6); scene.add(rim);

  const palette = [0x6be8ff, 0xa99aff, 0x76e9c0, 0xffd48a, 0xff91a9];
  const geos = bright ? [new THREE.SphereGeometry(1, 20, 14)] : [new THREE.IcosahedronGeometry(0.9, 0), new THREE.OctahedronGeometry(0.9, 0), new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.TorusGeometry(0.7, 0.22, 12, 28), new THREE.TetrahedronGeometry(1, 0)];
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const items = [];
  const count = bright ? (window.innerWidth < 700 ? 4 : 7) : (window.innerWidth < 700 ? 16 : 26);
  for (let i = 0; i < count; i++) {
    const c = palette[i % palette.length];
    const m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.45, emissive: c, emissiveIntensity: 0.12, transparent: true, opacity: bright ? 0.28 : 0.85 }));
    const side = rnd() < 0.5 ? -1 : 1;
    const z = -4 - rnd() * 14, half = Math.tan(27.5 * Math.PI / 180) * (14 - z), aspect = window.innerWidth / window.innerHeight;
    m.position.set(side * half * aspect * (0.35 + rnd() * 0.75), (rnd() - 0.5) * 2 * half * 0.95, z);
    const s = bright ? 0.9 + rnd() * 1.6 : 0.45 + rnd() * 0.9; m.scale.setScalar(s);
    items.push({ m, vx: (rnd() - 0.5) * 0.5, vy: (rnd() - 0.5) * 0.5, base: m.position.y, ph: rnd() * 6, sp: 0.15 + rnd() * 0.3 });
    scene.add(m);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => { tx = (e.clientX / window.innerWidth - 0.5); ty = (e.clientY / window.innerHeight - 0.5); }, { passive: true });
  window.addEventListener('deviceorientation', e => { if (e.gamma != null) { tx = Math.max(-.5, Math.min(.5, e.gamma / 60)); ty = Math.max(-.5, Math.min(.5, (e.beta - 45) / 90)); } }, { passive: true });

  let raf = 0, last = 0;
  function draw(now) {
    const t = now / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    camera.position.x = px * 4; camera.position.y = -py * 3; camera.lookAt(0, 0, -6);
    items.forEach(o => {
      o.m.rotation.x += o.vx * dt * (reduce ? 0 : 1); o.m.rotation.y += o.vy * dt * (reduce ? 0 : 1);
      if (!reduce) o.m.position.y = o.base + Math.sin(t * o.sp + o.ph) * 0.8;
    });
    renderer.render(scene, camera);
  }
  function loop(now) { raf = requestAnimationFrame(loop); if (now - last >= 33) draw(now); }
  function run() { if (reduce) { draw(performance.now()); return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : run());
  window.addEventListener('pagehide', stop);
  window.__cq3d = { scene, camera, ready: true };
  run();
})();
