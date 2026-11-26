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
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-300, 500, 700); scene.add(key);
  const fill = new THREE.PointLight(0x6be8ff, 1.2, 0, 0); fill.position.set(0, 0, 500); scene.add(fill);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.set(w / 2, -h / 2, (h / 2) / Math.tan(FOV * Math.PI / 360)); camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  const PAL = [['#ff6b6b','#c92a4b'],['#ffa94d','#e8590c'],['#ffd43b','#f08c00'],['#69db7c','#2b9a4a'],['#38d9a9','#0b8f73'],['#4dabf7','#1c6fd1'],['#9775fa','#5f3dc4'],['#f783ac','#c2255c']];
  const ICONS = ['star', 'heart', 'bolt', 'moon', 'drop', 'leaf', 'diamond', 'flower'];
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function icon(g, kind, cx, cy, R, col) {
    g.fillStyle = col; g.beginPath();
    if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.45 : R; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
    else if (kind === 'heart') { g.moveTo(cx, cy + R * 0.9); g.bezierCurveTo(cx - R * 1.4, cy, cx - R * 0.9, cy - R * 1.1, cx, cy - R * 0.4); g.bezierCurveTo(cx + R * 0.9, cy - R * 1.1, cx + R * 1.4, cy, cx, cy + R * 0.9); }
    else if (kind === 'bolt') { [[.15,-1],[-.6,.15],[-.05,.15],[-.3,1],[.65,-.2],[.05,-.2],[.15,-1]].forEach(([x, y]) => g.lineTo(cx + x * R, cy + y * R)); }
    else if (kind === 'moon') { g.arc(cx, cy, R, 0.5, Math.PI * 2 - 0.5); g.arc(cx + R * 0.45, cy, R * 0.8, Math.PI * 2 - 0.9, 0.9, true); }
    else if (kind === 'drop') { g.moveTo(cx, cy - R); g.bezierCurveTo(cx + R * 1.1, cy + R * 0.2, cx + R * 0.8, cy + R, cx, cy + R); g.bezierCurveTo(cx - R * 0.8, cy + R, cx - R * 1.1, cy + R * 0.2, cx, cy - R); }
    else if (kind === 'leaf') { g.moveTo(cx - R, cy + R * 0.8); g.bezierCurveTo(cx - R, cy - R, cx + R * 0.4, cy - R * 1.1, cx + R, cy - R); g.bezierCurveTo(cx + R, cy + R * 0.4, cx, cy + R, cx - R, cy + R * 0.8); }
    else if (kind === 'diamond') { g.moveTo(cx, cy - R); g.lineTo(cx + R * 0.85, cy); g.lineTo(cx, cy + R); g.lineTo(cx - R * 0.85, cy); }
    else { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; g.moveTo(cx + Math.cos(a) * R * 0.55 + R * 0.45, cy + Math.sin(a) * R * 0.55); g.arc(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55, R * 0.45, 0, Math.PI * 2); } }
    g.closePath(); g.fill();
  }
  const texCache = new Map();
  function faceTexture(kind, text, pair, ratio, role) {
    const k = kind + '|' + role + '|' + text + '|' + pair + '|' + ratio.toFixed(2); if (texCache.has(k)) return texCache.get(k);
    const W = 256, H = Math.round(256 * ratio), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const [c1, c2] = kind === 'front' ? ['#8b7bff', '#4b3bd0'] : PAL[pair % PAL.length];
    const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, c1); grad.addColorStop(1, c2);
    rr(g, 0, 0, W, H, W * 0.14); g.fillStyle = grad; g.fill();
    g.save(); rr(g, 0, 0, W, H, W * 0.14); g.clip();
    g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.ellipse(W * 0.2, -H * 0.05, W * 0.8, H * 0.35, -0.2, 0, Math.PI * 2); g.fill();
    g.restore();
    rr(g, 9, 9, W - 18, H - 18, W * 0.11); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 6; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kind === 'front') {
      g.fillStyle = 'rgba(255,255,255,.28)';
      [[.22,.2,.07],[.8,.25,.05],[.2,.8,.05],[.78,.82,.07]].forEach(([x, y, r]) => icon(g, 'star', W * x, H * y, W * r * 1.6, 'rgba(255,255,255,.35)'));
      g.fillStyle = '#fff'; g.shadowColor = 'rgba(40,20,120,.45)'; g.shadowBlur = 12; g.shadowOffsetY = 6; g.font = '900 ' + Math.round(W * 0.5) + 'px Cairo, Arial, sans-serif'; g.fillText('?', W / 2, H / 2 + 6);
    } else {
      // Fit the label: wrap greedily into at most 3 lines and keep the largest size that fits the plate. Long labels get a taller plate (the icon moves up and shrinks) instead of shrinking the text further.
      const font = z => '900 ' + z + 'px Cairo, Arial, sans-serif', maxW = W - 50, words = String(text).split(/\s+/);
      const wrap = z => { g.font = font(z); const out = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && g.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t; } out.push(cur); return out; };
      const fits = (z, ls, hh) => ls.length <= 3 && Math.max(...ls.map(l => g.measureText(l).width)) <= maxW && ls.length * z * 1.15 <= hh - 14;
      let size = 52, lines = wrap(size), tall = false;
      const normalH = H * 0.46;
      while (size > 20 && !fits(size, lines, normalH)) { size -= 2; lines = wrap(size); }
      if (!fits(size, lines, normalH) || lines.length > 1) {
        // try the taller plate and take the larger size it allows
        const tallH = H * 0.6; let s2 = 52, l2 = wrap(s2);
        while (s2 > 20 && !fits(s2, l2, tallH)) { s2 -= 2; l2 = wrap(s2); }
        if (s2 > size || !fits(size, lines, normalH)) { size = s2; lines = l2; tall = true; }
      }
      const plateTop = tall ? H * 0.31 : H * 0.43, plateH = tall ? H * 0.6 : normalH;
      icon(g, ICONS[pair % ICONS.length], W / 2, tall ? H * 0.17 : H * 0.26, tall ? W * 0.11 : W * 0.15, 'rgba(255,255,255,.95)');
      rr(g, 20, plateTop, W - 40, plateH, W * 0.07); g.fillStyle = role === 'definition' ? '#fff1c2' : '#ffffff'; g.fill();
      g.lineWidth = 5; g.strokeStyle = role === 'definition' ? '#f59f00' : '#1c7ed6'; g.stroke();
      g.fillStyle = c2; g.font = font(size);
      const lh = size * 1.15, y0 = plateTop + plateH / 2 - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => g.fillText(l, W / 2, y0 + i * lh));
      (window.__cqFaceMetrics = window.__cqFaceMetrics || {})[text] = { size, lines: lines.length, tall, plateTop, plateH, canvasW: W };
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; texCache.set(k, t); return t;
  }
  const shape = new THREE.Shape(); { const r = 0.14, w = 1, h = 1;
    shape.moveTo(r, 0); shape.lineTo(w - r, 0); shape.quadraticCurveTo(w, 0, w, r); shape.lineTo(w, h - r); shape.quadraticCurveTo(w, h, w - r, h); shape.lineTo(r, h); shape.quadraticCurveTo(0, h, 0, h - r); shape.lineTo(0, r); shape.quadraticCurveTo(0, 0, r, 0); }
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 8 }); bodyGeo.translate(-0.5, -0.5, -0.5);
  const faceGeo = new THREE.ShapeGeometry(shape, 8); faceGeo.translate(-0.5, -0.5, 0);
  const sparks = [];
  const sparkGeo = new THREE.OctahedronGeometry(1, 0);

  let cards = [], pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', e => { pointer.x = e.clientX / window.innerWidth - 0.5; pointer.y = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  const pairIndex = new Map();
  function rebuild() {
    cards.forEach(c => { scene.remove(c.mesh); c.mats.forEach(m => m.dispose()); });
    cards = [];
    grid.querySelectorAll('.card').forEach(el => {
      const label = el.querySelector('.card-back')?.textContent || '';
      const id = el.dataset.id || label; if (!pairIndex.has(id)) pairIndex.set(id, pairIndex.size);
      const pair = pairIndex.get(id) % PAL.length;
      const r0 = el.getBoundingClientRect(), ratio = r0.width > 0 ? Math.min(1.5, Math.max(0.9, r0.height / r0.width)) : 1.15;
      const front = new THREE.MeshStandardMaterial({ map: faceTexture('front', '?', 0, ratio), roughness: 0.55, metalness: 0, transparent: true });
      const back = new THREE.MeshStandardMaterial({ map: faceTexture('back', label, pair, ratio, el.querySelector('.card-back')?.dataset.kind || ''), roughness: 0.5, metalness: 0, transparent: true });
      const side = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ffffff'), roughness: 0.5 });
      const mesh = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, side);
      const f = new THREE.Mesh(faceGeo, front); f.position.z = 0.502;
      const b = new THREE.Mesh(faceGeo, back); b.position.z = -0.502; b.rotation.y = Math.PI;
      mesh.add(body, f, b); scene.add(mesh);
      cards.push({ el, mesh, mats: [front, back, side], ang: 0, pop: 0, wasMatched: false, pair });
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
      c.mesh.scale.set(r.width, r.height, 22);
      c.mesh.position.set(r.left + r.width / 2, -(r.top + r.height / 2), lift);
      const tiltX = reduce ? 0 : pointer.y * 0.35, tiltY = reduce ? 0 : pointer.x * 0.35;
      const flipLift = Math.sin(Math.min(1, Math.abs(c.ang % Math.PI) / Math.PI) * Math.PI) * 0.25;
      c.mesh.rotation.set(tiltX - flipLift * 0, c.ang + tiltY, 0);
      c.mats[1].emissive.setHex(0xffffff); c.mats[1].emissiveMap = c.mats[1].map; c.mats[1].emissiveIntensity = matched ? 0.15 + c.pop * 0.5 : 0;
      if (matched && c.pop > 0.98 && !reduce) for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL[(c.pair + i) % PAL.length][0]), transparent: true })); const a = i / 10 * Math.PI * 2; m.position.copy(c.mesh.position); m.scale.setScalar(5 + (i % 3) * 3); scene.add(m); sparks.push({ m, vx: Math.cos(a) * (120 + i * 8), vy: Math.sin(a) * (120 + i * 8), life: 1 }); }
    });
    for (let i = sparks.length - 1; i >= 0; i--) { const q = sparks[i]; q.life -= dt * 1.6; q.m.position.x += q.vx * dt; q.m.position.y -= q.vy * dt; q.m.position.z = 60; q.m.rotation.z += dt * 6; q.m.material.opacity = Math.max(0, q.life); if (q.life <= 0) { scene.remove(q.m); q.m.material.dispose(); sparks.splice(i, 1); } }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  window.__board3d = { get count() { return cards.length; } };
})();
