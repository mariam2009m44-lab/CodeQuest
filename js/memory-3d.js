/* Real 3D cards for the existing memory game.
   The game's own DOM buttons stay in place (they keep clicks, focus, keyboard and screen-reader labels);
   this layer draws each one as a lit 3D card that flips, glows when matched and tilts toward the pointer. */
import * as THREE from '../assets/vendor/three.module.min.js';

(function start() {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'board3d'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  document.body.appendChild(canvas);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const FOV = 40;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 4000);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(-300, 500, 700); scene.add(key);
  const fill = new THREE.PointLight(0x6be8ff, 1.2, 0, 0); fill.position.set(0, 0, 500); scene.add(fill);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.set(w / 2, -h / 2, (h / 2) / Math.tan(FOV * Math.PI / 360)); camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  const frontCache = new Map();
  function faceTexture(text, kind) {
    const k = kind + '|' + text; if (frontCache.has(k)) return frontCache.get(k);
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, S, S);
    if (kind === 'front') { grad.addColorStop(0, '#2a2f6e'); grad.addColorStop(1, '#141a3d'); } else { grad.addColorStop(0, '#103a4a'); grad.addColorStop(1, '#0c1f33'); }
    g.fillStyle = grad; g.fillRect(0, 0, S, S);
    g.strokeStyle = kind === 'front' ? 'rgba(169,154,255,.7)' : 'rgba(107,232,255,.7)'; g.lineWidth = 8; g.strokeRect(10, 10, S - 20, S - 20);
    g.fillStyle = kind === 'front' ? '#c9c0ff' : '#e9fbff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = kind === 'front' ? 120 : 64; g.font = '900 ' + size + 'px Cairo, Arial, sans-serif';
    while (g.measureText(text).width > S - 44 && size > 18) { size -= 4; g.font = '900 ' + size + 'px Cairo, Arial, sans-serif'; }
    g.fillText(text, S / 2, S / 2 + 4);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; frontCache.set(k, t); return t;
  }
  const edge = new THREE.MeshStandardMaterial({ color: 0x1b2450, roughness: 0.5, metalness: 0.4 });
  const geo = new THREE.BoxGeometry(1, 1, 1);

  let cards = [], pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', e => { pointer.x = e.clientX / window.innerWidth - 0.5; pointer.y = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  function rebuild() {
    cards.forEach(c => { scene.remove(c.mesh); c.mats.forEach(m => m.dispose()); });
    cards = [];
    grid.querySelectorAll('.card').forEach(el => {
      const label = el.querySelector('.card-back')?.textContent || '';
      const front = new THREE.MeshStandardMaterial({ map: faceTexture('?', 'front'), roughness: 0.45, metalness: 0.2 });
      const back = new THREE.MeshStandardMaterial({ map: faceTexture(label, 'back'), roughness: 0.4, metalness: 0.2, emissive: 0x000000 });
      const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]);
      mesh.rotation.y = 0; scene.add(mesh);
      cards.push({ el, mesh, mats: [front, back], ang: 0, pop: 0, wasMatched: false });
    });
    document.body.classList.toggle('cq-board3d', cards.length > 0);
  }
  new MutationObserver(rebuild).observe(grid, { childList: true });
  rebuild();

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const visible = grid.offsetParent !== null;
    canvas.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;
    cards.forEach(c => {
      const r = c.el.getBoundingClientRect();
      const up = c.el.classList.contains('flipped') || c.el.classList.contains('matched');
      const target = up ? Math.PI : 0;
      c.ang = reduce ? target : c.ang + (target - c.ang) * Math.min(1, dt * 11);
      const matched = c.el.classList.contains('matched');
      if (matched && !c.wasMatched) { c.pop = 1; c.wasMatched = true; }
      if (!matched) c.wasMatched = false;
      c.pop = Math.max(0, c.pop - dt * 2.2);
      const lift = Math.sin(c.pop * Math.PI) * 40 + (up ? 14 : 0);
      c.mesh.scale.set(r.width, r.height, 26);
      c.mesh.position.set(r.left + r.width / 2, -(r.top + r.height / 2), lift);
      const tiltX = reduce ? 0 : pointer.y * 0.35, tiltY = reduce ? 0 : pointer.x * 0.35;
      const flipLift = Math.sin(Math.min(1, Math.abs(c.ang % Math.PI) / Math.PI) * Math.PI) * 0.25;
      c.mesh.rotation.set(tiltX - flipLift * 0, c.ang + tiltY, 0);
      c.mats[1].emissive.setHex(matched ? 0x0b6b4a : 0x000000); c.mats[1].emissiveIntensity = matched ? 0.7 + c.pop : 0;
    });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  window.__board3d = { get count() { return cards.length; } };
})();
