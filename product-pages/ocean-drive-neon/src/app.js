import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const STILL = /[?&]still\b/.test(location.search);

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
const LEVELS = [0, 1 / 3, 2 / 3, 1];
const PCT = [0, 33, 66, 100];
const COLORS = {
  red: { tube: '#ff3c1f', body: '#8f1714', spill: '#ff3d55', css: [255, 76, 54], name: 'Red' },
  amber: { tube: '#ffab38', body: '#a8742a', spill: '#ffad6a', css: [255, 186, 96], name: 'Amber' },
};
const S = {
  powered: false,
  idx: 0,
  lastIdx: 3,
  shown: 0,
  flickerT: -1,
  color: 'red',
  hangMode: 1,
  stars: 0,
  qty: 1,
  cart: 0,
};

/* ------------------------------------------------------------------ */
/* print artwork: a night beach painted on canvas                      */
/* ------------------------------------------------------------------ */
function skyline(g, r, u, x0, x1, base, maxH, color, winP, center) {
  const lights = ['#ffd78a', '#ffd78a', '#ff9bd4', '#9fefff', '#fff2d0'];
  let x = x0 * u;
  while (x < x1 * u) {
    const w = (12 + r() * 42) * u;
    const d = Math.min(1, Math.abs(x / u - center) / ((x1 - x0) / 2));
    const h = maxH * u * (0.22 + Math.pow(r(), 1.25) * 0.78) * (1 - d * 0.62);
    g.fillStyle = color;
    g.fillRect(x, base - h, w, h + 2 * u);
    if (r() < 0.14) g.fillRect(x + w / 2 - u, base - h - 16 * u, 2 * u, 16 * u);
    for (let wy = base - h + 5 * u; wy < base - 4 * u; wy += 7 * u) {
      for (let wx = x + 3 * u; wx < x + w - 4 * u; wx += 6 * u) {
        if (r() < winP) {
          g.globalAlpha = 0.45 + r() * 0.55;
          g.fillStyle = lights[(r() * lights.length) | 0];
          g.fillRect(wx, wy, 2.4 * u, 3.2 * u);
        }
      }
    }
    g.globalAlpha = 1;
    x += w + (r() < 0.3 ? r() * 9 * u : 0);
  }
}

function palm(g, r, u, x, base, h, lean) {
  const col = '#08040f';
  const s = h / (400 * u);
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  const top = { x: x + lean * h, y: base - h };
  const cx = x + lean * h * 0.1 + (lean >= 0 ? -1 : 1) * h * 0.08;
  const cy = base - h * 0.55;
  const N = 48;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    pts.push([a * x + b * cx + c * top.x, a * base + b * cy + c * top.y]);
  }
  const w0 = (16 * s + 3) * u, w1 = (7 * s + 1.5) * u;
  const edge = (side) => {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[Math.min(i + 1, N)], o = pts[Math.max(i - 1, 0)];
      const dx = q[0] - o[0], dy = q[1] - o[1], L = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1, i / N) / 2;
      out.push([p[0] + (-dy / L) * w * side, p[1] + (dx / L) * w * side]);
    });
    return out;
  };
  const left = edge(1), right = edge(-1).reverse();
  g.beginPath();
  [...left, ...right].forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.closePath();
  g.fill();

  const fronds = [];
  const n = 11 + ((r() * 3) | 0);
  for (let k = 0; k < n; k++) fronds.push(-Math.PI * (0.04 + 0.92 * (k / (n - 1))) + (r() - 0.5) * 0.22);
  fronds.push(0.18 + r() * 0.2, Math.PI - 0.18 - r() * 0.2, 0.55, Math.PI - 0.6);
  for (const a of fronds) {
    const L = h * (0.25 + r() * 0.11);
    const hang = a > 0 && a < Math.PI;
    const droop = h * (hang ? 0.05 : 0.12 + r() * 0.12) * (1 - Math.abs(Math.sin(a)) * 0.5);
    const ex = top.x + Math.cos(a) * L;
    const ey = top.y + Math.sin(a) * L * (hang ? 0.9 : 0.6) + droop;
    const mx = top.x + Math.cos(a) * L * 0.55;
    const my = top.y + Math.sin(a) * L * 0.62 - (hang ? 0 : h * 0.03);
    g.lineWidth = 3.4 * s * u;
    g.beginPath();
    g.moveTo(top.x, top.y);
    g.quadraticCurveTo(mx, my, ex, ey);
    g.stroke();
    g.lineWidth = 1.7 * s * u;
    for (let t = 0.08; t <= 1; t += 0.04) {
      const a1 = (1 - t) * (1 - t), b1 = 2 * (1 - t) * t, c1 = t * t;
      const px = a1 * top.x + b1 * mx + c1 * ex;
      const py = a1 * top.y + b1 * my + c1 * ey;
      let tx = 2 * (1 - t) * (mx - top.x) + 2 * t * (ex - mx);
      let ty = 2 * (1 - t) * (my - top.y) + 2 * t * (ey - my);
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const ll = L * 0.24 * (1 - t * 0.72) * (0.8 + r() * 0.4);
      for (const side of [-1, 1]) {
        let dx = tx * 0.4 + -ty * side * 0.9;
        let dy = ty * 0.4 + tx * side * 0.9 + 0.75;
        const dl = Math.hypot(dx, dy) || 1;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + (dx / dl) * ll, py + (dy / dl) * ll);
        g.stroke();
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc(top.x + (r() - 0.5) * 12 * s * u, top.y + (4 + r() * 8) * s * u, 4.5 * s * u, 0, Math.PI * 2);
    g.fill();
  }
}

function paintPrint(N) {
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const r = rng(1986);
  const W = N, H = N, u = N / 1000;
  const HZ = 600 * u;

  let gr = g.createLinearGradient(0, 0, 0, HZ);
  [[0, '#0a0726'], [0.3, '#190f4e'], [0.55, '#381977'], [0.74, '#742a92'], [0.9, '#cf4b8d'], [1, '#ff8d7f']].forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, HZ + 2);

  for (let i = 0; i < 560; i++) {
    const x = r() * W, y = Math.pow(r(), 1.7) * HZ * 0.84, big = r() < 0.06;
    const rad = (big ? 1.5 + r() * 1.6 : 0.5 + r() * 1.1) * u;
    g.globalAlpha = big ? 0.95 : 0.3 + r() * 0.6;
    g.fillStyle = r() < 0.18 ? '#ffd6f2' : '#ffffff';
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
    if (big && r() < 0.55) {
      g.globalAlpha = 0.45;
      g.fillRect(x - rad * 4, y - 0.5 * u, rad * 8, u);
      g.fillRect(x - 0.5 * u, y - rad * 4, u, rad * 8);
    }
  }
  g.globalAlpha = 1;

  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 46; i++) {
    const y = HZ - Math.pow(r(), 1.3) * 240 * u;
    g.fillStyle = `rgba(255,${(110 + r() * 60) | 0},${(180 + r() * 50) | 0},${0.03 + r() * 0.07})`;
    g.fillRect(r() * W * 0.8 - 120 * u, y, (200 + r() * 600) * u, (1 + r() * 3) * u);
  }
  gr = g.createRadialGradient(790 * u, HZ, 0, 790 * u, HZ, 380 * u);
  gr.addColorStop(0, 'rgba(255,120,175,.5)');
  gr.addColorStop(1, 'rgba(255,120,175,0)');
  g.fillStyle = gr;
  g.fillRect(0, HZ - 380 * u, W, 420 * u);
  g.globalCompositeOperation = 'source-over';

  skyline(g, r, u, 300, 995, HZ, 70, '#3b2070', 0.05, 790);
  skyline(g, r, u, 520, 975, HZ, 128, '#1f1146', 0.2, 800);

  gr = g.createLinearGradient(0, HZ, 0, 692 * u);
  gr.addColorStop(0, '#5a2b8e');
  gr.addColorStop(1, '#22114c');
  g.fillStyle = gr;
  g.fillRect(0, HZ, W, 94 * u);
  g.fillStyle = 'rgba(255,170,205,.55)';
  g.fillRect(0, HZ, W, 2.5 * u);
  g.globalCompositeOperation = 'screen';
  const refl = ['#ff7cc4', '#ffcf7a', '#ffe9c9', '#ff5fa8'];
  for (let i = 0; i < 620; i++) {
    const x = (300 + Math.pow(r(), 0.7) * 700) * u, y = HZ + Math.pow(r(), 1.5) * 90 * u;
    g.globalAlpha = (0.12 + r() * 0.5) * (1 - (y - HZ) / (100 * u));
    g.fillStyle = refl[(r() * refl.length) | 0];
    g.fillRect(x, y, (5 + r() * 34) * u, (1.5 + r() * 2) * u);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';

  g.fillStyle = '#100820';
  g.beginPath();
  g.moveTo(0, 720 * u);
  for (let x = 0; x <= 1000; x += 9) {
    const bump = Math.abs(Math.sin(x * 0.07) * 9 + Math.sin(x * 0.023) * 13 + (r() - 0.5) * 6);
    g.lineTo(x * u, (700 - bump * 0.9) * u);
  }
  g.lineTo(W, 720 * u);
  g.closePath();
  g.fill();

  gr = g.createLinearGradient(0, 712 * u, 0, H);
  gr.addColorStop(0, '#2c1549');
  gr.addColorStop(1, '#120824');
  g.fillStyle = gr;
  g.fillRect(0, 712 * u, W, 290 * u);
  g.fillStyle = 'rgba(255,160,220,.22)';
  g.fillRect(0, 712 * u, W, 2 * u);

  g.strokeStyle = 'rgba(255,200,235,.16)';
  g.lineWidth = 2 * u;
  const vp = [640 * u, 712 * u];
  for (const k of [-1.6, -0.75, 0.15, 1.05, 2.1]) {
    g.beginPath();
    g.moveTo(vp[0], vp[1]);
    g.lineTo(vp[0] + k * 720 * u, H);
    g.stroke();
  }
  g.setLineDash([22 * u, 26 * u]);
  g.strokeStyle = 'rgba(255,230,190,.28)';
  g.lineWidth = 3 * u;
  g.beginPath();
  g.moveTo(vp[0], vp[1]);
  g.lineTo(vp[0] - 0.3 * 720 * u, H);
  g.stroke();
  g.setLineDash([]);

  g.globalCompositeOperation = 'screen';
  const canFilter = 'filter' in g;
  if (canFilter) g.filter = `blur(${7 * u}px)`;
  const streak = ['#ff5fb0', '#ff5fb0', '#ffc96b', '#ffe6f4', '#c86bff'];
  for (let i = 0; i < 80; i++) {
    const x = (280 + Math.pow(r(), 0.8) * 720) * u;
    g.globalAlpha = 0.18 + r() * 0.35;
    g.fillStyle = streak[(r() * streak.length) | 0];
    g.fillRect(x, (722 + r() * 30) * u, (3 + r() * 14) * u, (60 + r() * 200) * u);
  }
  for (const [px, py, rx, ry, col] of [[560, 905, 170, 46, 'rgba(255,80,170,.55)'], [780, 860, 120, 30, 'rgba(255,200,120,.45)'], [300, 950, 150, 34, 'rgba(255,90,190,.35)'], [840, 800, 30, 120, 'rgba(255,70,180,.5)']]) {
    g.globalAlpha = 1;
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(px * u, py * u, rx * u, ry * u, 0, 0, Math.PI * 2);
    g.fill();
  }
  if (canFilter) g.filter = 'none';
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';

  for (const lx of [380, 470, 560]) {
    g.fillStyle = '#0c0618';
    g.fillRect((lx - 1.5) * u, 652 * u, 3 * u, 62 * u);
    g.fillRect((lx - 7) * u, 650 * u, 14 * u, 3 * u);
    const lg = g.createRadialGradient(lx * u, 654 * u, 0, lx * u, 654 * u, 26 * u);
    lg.addColorStop(0, 'rgba(255,214,140,.95)');
    lg.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = lg;
    g.fillRect((lx - 26) * u, 628 * u, 52 * u, 52 * u);
  }

  palm(g, r, u, 470 * u, 703 * u, 92 * u, 0.06);
  palm(g, r, u, 528 * u, 703 * u, 70 * u, -0.04);
  palm(g, r, u, 618 * u, 708 * u, 232 * u, 0.05);
  palm(g, r, u, 748 * u, 711 * u, 300 * u, -0.04);
  palm(g, r, u, 902 * u, 716 * u, 272 * u, 0.06);
  palm(g, r, u, 228 * u, 738 * u, 410 * u, 0.05);
  palm(g, r, u, 128 * u, 742 * u, 565 * u, -0.07);

  g.lineCap = 'butt';
  g.lineJoin = 'round';
  g.shadowColor = '#ff2f9e';
  g.shadowBlur = 30 * u;
  g.strokeStyle = '#ff3fae';
  g.lineWidth = 9 * u;
  g.beginPath();
  g.moveTo(1004 * u, 392 * u);
  g.lineTo(842 * u, 392 * u);
  g.lineTo(842 * u, 560 * u);
  g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = '#ffd3ef';
  g.lineWidth = 2.6 * u;
  g.stroke();

  gr = g.createRadialGradient(500 * u, 520 * u, 330 * u, 500 * u, 520 * u, 780 * u);
  gr.addColorStop(0, 'rgba(6,0,16,0)');
  gr.addColorStop(1, 'rgba(6,0,16,.6)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);

  for (let i = 0; i < 70000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)';
    g.fillRect(r() * W, r() * H, u, u);
  }
  return c;
}

/* ------------------------------------------------------------------ */
/* small textures                                                      */
/* ------------------------------------------------------------------ */
function dotsTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 4;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, '#e4e4e4');
  gr.addColorStop(0.5, '#ffffff');
  gr.addColorStop(1, '#e4e4e4');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 4);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function blindsTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, '#fff');
  gr.addColorStop(1, '#000');
  for (let y = 18; y < 240; y += 22) {
    g.fillStyle = gr;
    g.fillRect(0, y, 256, 13);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function plasterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = rng(4);
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + r() * 40;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 6);
  return t;
}

/* ------------------------------------------------------------------ */
/* geometry                                                            */
/* ------------------------------------------------------------------ */
function rrect(w, h, rad, Ctor = THREE.Shape) {
  const s = new Ctor();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + rad, y);
  s.lineTo(x + w - rad, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rad);
  s.lineTo(x + w, y + h - rad);
  s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  s.lineTo(x + rad, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rad);
  s.lineTo(x, y + rad);
  s.quadraticCurveTo(x, y, x + rad, y);
  return s;
}

function star(R, r, rot, Ctor = THREE.Shape) {
  const s = new Ctor();
  for (let i = 0; i < 10; i++) {
    const a = rot + Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r : R;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return s;
}

// Bold oblique R, drawn for this page (shear applied to every point).
const SHEAR = 0.22;
function letterR() {
  const p = (x, y) => [x + SHEAR * y, y];
  const s = new THREE.Shape();
  s.moveTo(...p(0, 0));
  s.lineTo(...p(0.36, 0));
  s.lineTo(...p(0.36, 0.5));
  s.lineTo(...p(0.5, 0.5));
  s.lineTo(...p(0.7, 0));
  s.lineTo(...p(1.08, 0));
  s.lineTo(...p(0.84, 0.6));
  s.bezierCurveTo(...p(1.02, 0.7), ...p(1.1, 0.86), ...p(1.1, 1.0));
  s.bezierCurveTo(...p(1.1, 1.26), ...p(0.92, 1.4), ...p(0.62, 1.4));
  s.lineTo(...p(0, 1.4));
  s.closePath();
  const h = new THREE.Path();
  h.moveTo(...p(0.36, 0.8));
  h.lineTo(...p(0.6, 0.8));
  h.bezierCurveTo(...p(0.72, 0.8), ...p(0.76, 0.88), ...p(0.76, 0.98));
  h.bezierCurveTo(...p(0.76, 1.08), ...p(0.7, 1.13), ...p(0.6, 1.13));
  h.lineTo(...p(0.36, 1.13));
  h.closePath();
  s.holes.push(h);
  return s;
}

function tubeAlong(path, z, radius, mat, spacing = 0.045) {
  const n = Math.max(24, Math.round(path.getLength() / spacing));
  const pts = path.getSpacedPoints(n);
  pts.pop();
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, z)), true, 'catmullrom', 0.5);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, n * 6, radius, 10, true), mat);
}

function fixUV(geo, w, h) {
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
}

/* ------------------------------------------------------------------ */
/* WebGL scene                                                         */
/* ------------------------------------------------------------------ */
const GL = { ok: false };

function buildScene() {
  const canvas = $('#stage');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch (e) {
    document.body.classList.add('no-gl');
    return;
  }
  const lite = coarse || Math.min(screen.width, screen.height) < 700;
  const dpr = Math.min(devicePixelRatio || 1, lite ? 1.3 : 1.6);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050406');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.14;

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.05, 80);

  /* room ------------------------------------------------------------ */
  const plaster = plasterTexture();
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 26),
    new THREE.MeshStandardMaterial({ color: '#1a161d', roughness: 0.94, bumpMap: plaster, bumpScale: 0.6 })
  );
  wall.position.z = -0.46;
  wall.receiveShadow = true;
  scene.add(wall);

  const wireMat = new THREE.MeshStandardMaterial({ color: '#0d0d10', metalness: 0.55, roughness: 0.42 });
  const wires = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wireMat, 64);
  const m4 = new THREE.Matrix4();
  let wi = 0;
  for (let x = -14.5; x <= 14.5; x += 1) m4.compose(new THREE.Vector3(x, 0, -0.33), new THREE.Quaternion(), new THREE.Vector3(0.02, 26, 0.02)), wires.setMatrixAt(wi++, m4);
  for (let y = -8.5; y <= 8.5; y += 1) m4.compose(new THREE.Vector3(0, y, -0.31), new THREE.Quaternion(), new THREE.Vector3(44, 0.02, 0.02)), wires.setMatrixAt(wi++, m4);
  wires.count = wi;
  wires.castShadow = wires.receiveShadow = true;
  scene.add(wires);

  scene.add(new THREE.HemisphereLight('#3a2a52', '#060408', 0.38));

  /* sign ------------------------------------------------------------ */
  const sign = new THREE.Group();
  scene.add(sign);
  const L = { plate: new THREE.Group(), print: new THREE.Group(), frame: new THREE.Group(), glyph: new THREE.Group(), chain: new THREE.Group() };
  Object.values(L).forEach((g) => sign.add(g));

  const col = COLORS[S.color];
  const M = {
    face: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.06, transparent: true, opacity: 0.07, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
    edge: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color(col.tube), emissiveIntensity: 0, roughness: 0.1, transparent: true, opacity: 0.7 }),
    print: null,
    body: new THREE.MeshStandardMaterial({ color: new THREE.Color(col.body), roughness: 0.48 }),
    frameTube: new THREE.MeshStandardMaterial({ color: new THREE.Color(col.tube), emissive: new THREE.Color(col.tube), emissiveIntensity: 0, roughness: 0.4 }),
    channel: new THREE.MeshStandardMaterial({ color: '#dcd8d1', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.55 }),
    tube: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff2e4', emissiveIntensity: 0, roughness: 0.35 }),
    cable: new THREE.MeshStandardMaterial({ color: '#e9e6e0', roughness: 0.6 }),
    chain: new THREE.MeshStandardMaterial({ color: '#c9c9d0', metalness: 1, roughness: 0.28 }),
  };
  const dots = dotsTexture();
  dots.repeat.set(118, 1);
  M.frameTube.emissiveMap = dots;

  // acrylic plate, 300 mm overall, two hanging holes along the top
  const plateShape = rrect(3.0, 3.0, 0.42);
  for (const hx of [-1.1, 1.1]) plateShape.holes.push(new THREE.Path().absarc(hx, 1.44, 0.032, 0, Math.PI * 2, true));
  const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 28 });
  plateGeo.translate(0, 0, -0.02);
  L.plate.add(new THREE.Mesh(plateGeo, [M.face, M.edge]));

  // printed panel
  const printCanvas = paintPrint(lite ? 1536 : 2048);
  const printTex = new THREE.CanvasTexture(printCanvas);
  printTex.colorSpace = THREE.SRGBColorSpace;
  printTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  M.print = new THREE.MeshStandardMaterial({ map: printTex, emissiveMap: printTex, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.62 });
  const printGeo = new THREE.ShapeGeometry(rrect(2.26, 2.26, 0.16), 24);
  fixUV(printGeo, 2.26, 2.26);
  const printMesh = new THREE.Mesh(printGeo, M.print);
  printMesh.position.z = 0.03;
  printMesh.receiveShadow = true;
  L.print.add(printMesh);

  // lit frame: ABS body + LED flex on the face
  const ring = rrect(2.76, 2.76, 0.38);
  ring.holes.push(rrect(2.26, 2.26, 0.16, THREE.Path));
  const frameMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 28 }), M.body);
  frameMesh.position.z = 0.025;
  frameMesh.castShadow = true;
  L.frame.add(frameMesh);
  const frameTube = tubeAlong(rrect(2.51, 2.51, 0.27), 0.19, 0.052, M.frameTube, 0.03);
  L.frame.add(frameTube);

  // R + star
  const k = 0.87;
  const glyph = new THREE.Group();
  glyph.scale.setScalar(k);
  glyph.position.set(-0.845 * k, -0.51 * k + 0.04, 0.05);
  L.glyph.add(glyph);
  const rShape = letterR();
  const rFace = new THREE.Mesh(new THREE.ExtrudeGeometry(rShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 24 }), M.channel);
  rFace.castShadow = true;
  glyph.add(rFace);
  glyph.add(tubeAlong(rShape, 0.13, 0.046, M.tube));
  glyph.add(tubeAlong(rShape.holes[0], 0.13, 0.046, M.tube));

  const starG = new THREE.Group();
  starG.position.set(1.22, 0.12, 0.03);
  starG.rotation.z = -0.12;
  glyph.add(starG);
  const sOuter = star(0.5, 0.215, 0);
  const sRim = star(0.5, 0.215, 0);
  sRim.holes.push(star(0.34, 0.15, 0, THREE.Path));
  const starRim = new THREE.Mesh(new THREE.ExtrudeGeometry(sRim, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), M.channel);
  starRim.castShadow = true;
  starG.add(starRim);
  const starTube = tubeAlong(sOuter, 0.13, 0.046, M.tube, 0.04);
  starG.add(starTube);
  const starHit = [starRim, starTube];

  // power lead leaving the bottom edge
  const lead = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.02, -1.5, -0.05),
    new THREE.Vector3(1.05, -1.9, -0.1),
    new THREE.Vector3(1.3, -2.8, -0.2),
    new THREE.Vector3(1.9, -4.4, -0.25),
    new THREE.Vector3(2.2, -7, -0.25),
  ]);
  const leadMesh = new THREE.Mesh(new THREE.TubeGeometry(lead, 80, 0.022, 8, false), M.cable);
  leadMesh.castShadow = true;
  L.plate.add(leadMesh);

  // chains for the hanging shot
  const link = new THREE.TorusGeometry(0.05, 0.012, 6, 14);
  link.scale(1, 1.5, 1);
  const links = new THREE.InstancedMesh(link, M.chain, 140);
  let li = 0;
  for (const hx of [-1.1, 1.1]) {
    for (let j = 0; j < 70; j++) {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), j % 2 ? Math.PI / 2 : 0);
      m4.compose(new THREE.Vector3(hx, 1.5 + j * 0.115, 0), q, new THREE.Vector3(1, 1, 1));
      links.setMatrixAt(li++, m4);
    }
  }
  L.chain.add(links);
  L.chain.visible = false;

  /* lights tied to the sign ------------------------------------------ */
  const spill = new THREE.RectAreaLight(new THREE.Color(col.spill), 0, 2.8, 2.8);
  spill.position.set(0, 0, -0.06);
  sign.add(spill);
  spill.lookAt(0, 0, -5);
  const fill = new THREE.PointLight('#ffeedd', 0, 4, 2);
  fill.position.set(0, 0, 0.9);
  sign.add(fill);

  /* passing headlights through blinds -------------------------------- */
  const spot = new THREE.SpotLight('#ffdcae', 0, 40, 0.38, 0.75, 1.2);
  spot.position.set(-12, 1.2, 10);
  spot.target.position.set(0, 0, -0.4);
  scene.add(spot, spot.target);
  if (!lite) {
    spot.castShadow = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0004;
    spot.map = blindsTexture();
  }
  sign.traverse((o) => { if (o.isMesh && o !== printMesh && o.material !== M.face) o.castShadow = true; });

  /* post ------------------------------------------------------------- */
  const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: lite ? 0 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.34, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // pins: named points that HTML labels follow
  const pins = {
    tube: [L.glyph, new THREE.Vector3(-0.55, 0.47, 0.165)],
    dots: [L.frame, new THREE.Vector3(-1.255, -0.05, 0.245)],
    plate: [L.plate, new THREE.Vector3(-0.7, 1.47, 0)],
    print: [L.print, new THREE.Vector3(-0.95, -1.05, 0.04)],
    frame: [L.frame, new THREE.Vector3(1.2, 1.12, 0.2)],
    glyph: [L.glyph, new THREE.Vector3(0.62, -0.5, 0.17)],
  };

  Object.assign(GL, { ok: true, renderer, scene, camera, composer, bloom, sign, L, M, spill, fill, spot, starG, starHit, pins, wall, wires, lite, target });
  resize();
}

/* ------------------------------------------------------------------ */
/* camera shots, driven by scroll                                      */
/* ------------------------------------------------------------------ */
// az = orbit around the sign, el = elevation, d = distance, sx/sy = where the sign sits on screen
const SHOTS = [
  { sel: '#hero', at: 0, d: { az: -0.34, el: 0.06, dist: 9.0, sx: 0.15, sy: 0.02, tx: 0, ty: 0, ex: 0, h: 0 }, m: { sx: 0, sy: 0.17, az: -0.22 } },
  { sel: '#truth', at: 0, d: { az: 0.5, el: 0.14, dist: 2.3, sx: 0.16, sy: 0.0, tx: -0.92, ty: 0.42, ex: 0, h: 0 }, m: { sx: 0, sy: 0.22, dist: 3.4, tx: -1.02, az: 0.42 } },
  { sel: '#dimmer', at: 0, d: { az: 0.28, el: -0.02, dist: 8.4, sx: -0.22, sy: 0, tx: 0, ty: 0, ex: 0, h: 0 }, m: { sx: 0, sy: 0.2, az: 0.2 } },
  { sel: '#colour', at: 0, d: { az: -0.2, el: 0.1, dist: 7.6, sx: 0.21, sy: 0, tx: 0, ty: 0, ex: 0, h: 0 }, m: { sx: 0, sy: 0.2 } },
  { sel: '#anatomy', at: 0, d: { az: -0.55, el: 0.12, dist: 9.2, sx: 0.15, sy: 0, tx: 0, ty: 0, ex: 0, h: 0 }, m: { sx: 0, sy: 0.18 } },
  { sel: '#anatomy', at: 0.32, d: { az: -1.0, el: 0.2, dist: 10.4, sx: 0.13, sy: 0, tx: 0, ty: 0, ex: 1, h: 0 }, m: { sx: 0, sy: 0.2, az: -0.8, dist: 19 } },
  { sel: '#anatomy', at: 0.72, d: { az: -1.12, el: 0.26, dist: 10.6, sx: 0.13, sy: 0, tx: 0, ty: 0, ex: 1, h: 0 }, m: { sx: 0, sy: 0.2, az: -0.9, dist: 19 } },
  { sel: '#hang', at: 0, d: { az: 0.42, el: -0.05, dist: 10.2, sx: -0.2, sy: -0.03, tx: 0, ty: 0.2, ex: 0, h: 1 }, m: { sx: 0, sy: 0.16 } },
  { sel: '#before', at: 0.5, d: { az: 0.3, el: 0.04, dist: 8.0, sx: -0.22, sy: 0, tx: 0, ty: 0, ex: 0, h: 0 }, m: { sx: 0, sy: 0.2 } },
  { sel: '#buy', at: 0, d: { az: 0.3, el: 0.04, dist: 8.0, sx: -0.22, sy: 0, tx: 0, ty: 0, ex: 0, h: 0 }, m: { sx: 0, sy: 0.24 } },
];
const KEYS = ['az', 'el', 'dist', 'sx', 'sy', 'tx', 'ty', 'ex', 'h'];
const cam = { ...SHOTS[0].d };
const pointer = { x: 0, y: 0, sx: 0, sy: 0, cx: -1, cy: -1 };
let anchors = [];
let covers = [];
let vw = innerWidth, vh = innerHeight;

function shotState(i) {
  const s = SHOTS[i];
  const portrait = vw / vh < 0.9;
  const st = { ...s.d, ...(portrait ? s.m : {}) };
  if (st.dist > 4) {
    const fit = (portrait ? 1.75 : 1.9) / (Math.tan(THREE.MathUtils.degToRad(15)) * (vw / vh));
    st.dist = Math.max(st.dist, fit);
  }
  return st;
}

function measure() {
  vw = innerWidth;
  vh = innerHeight;
  anchors = SHOTS.map((s) => {
    const el = $(s.sel);
    const top = el.getBoundingClientRect().top + scrollY;
    return top + s.at * el.offsetHeight;
  });
  covers = $$('.opaque').map((el) => {
    const top = el.getBoundingClientRect().top + scrollY;
    return [top, top + el.offsetHeight];
  });
  covers.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const c of covers) {
    const last = merged[merged.length - 1];
    if (last && c[0] <= last[1] + 2) last[1] = Math.max(last[1], c[1]);
    else merged.push([...c]);
  }
  covers = merged;
}

function targetShot(y) {
  if (y <= anchors[0]) return shotState(0);
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y < anchors[i + 1]) {
      const t = ease(clamp((y - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]), 0, 1));
      const a = shotState(i), b = shotState(i + 1), o = {};
      KEYS.forEach((k) => (o[k] = lerp(a[k], b[k], t)));
      return o;
    }
  }
  return shotState(anchors.length - 1);
}

function resize() {
  vw = innerWidth;
  vh = innerHeight;
  measure();
  if (!GL.ok) return;
  GL.renderer.setSize(vw, vh, false);
  GL.composer.setSize(vw, vh);
  GL.camera.aspect = vw / vh;
  GL.camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------------ */
/* light level, colour, page lighting                                  */
/* ------------------------------------------------------------------ */
const FLICKER = [[0, 1], [0.05, 0], [0.13, 0.8], [0.17, 0], [0.34, 1], [0.4, 0.15], [0.47, 1], [0.52, 0.4], [0.6, 1]];
const colNow = { tube: new THREE.Color(COLORS.red.tube), body: new THREE.Color(COLORS.red.body), spill: new THREE.Color(COLORS.red.spill), css: [...COLORS.red.css] };
let lastCss = '';

function setLevel(idx, opts = {}) {
  const prev = S.idx;
  S.idx = clamp(idx, 0, 3);
  if (S.idx > 0) S.lastIdx = S.idx;
  document.body.classList.toggle('is-off', S.idx === 0 && S.powered);
  updateReadouts();
  $$('[data-pct]').forEach((el) => (el.textContent = PCT[S.idx]));
  $$('.levels i').forEach((el, i) => el.classList.toggle('on', i < S.idx));
  if (S.powered && prev > 0 && S.idx === 0 && !opts.quiet) toast(coarse ? 'Off. 0 W. Touch the screen to look around.' : "Off. 0 W. Your cursor's a torch now.");
}

function act(a) {
  click(a === 'power' ? 1300 : 2100);
  if (!S.powered) return powerOn();
  if (a === 'up') setLevel(S.idx + 1);
  if (a === 'down') setLevel(S.idx - 1);
  if (a === 'power') setLevel(S.idx ? 0 : S.lastIdx || 3);
  $$(`[data-act="${a}"]`).forEach((b) => {
    b.classList.remove('press');
    void b.offsetWidth;
    b.classList.add('press');
  });
}

function powerOn() {
  if (S.powered) return;
  S.powered = true;
  S.flickerT = reduced || STILL ? -1 : 0;
  setLevel(3, { quiet: true });
  document.body.classList.add('on');
  document.body.classList.remove('locked');
  const intro = $('#intro');
  intro.classList.add('gone');
  setTimeout(() => intro.remove(), 1400);
  $$('.split .ch').forEach((ch, i) => (ch.style.animationDelay = `${0.25 + i * 0.07 + Math.random() * 0.12}s`));
}

function setColor(name) {
  S.color = name;
  $$('[data-color]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.color === name)));
  $$('[data-colorname]').forEach((el) => (el.textContent = COLORS[name].name));
}

function updateLevel(dt, t) {
  let target = LEVELS[S.idx];
  if (S.flickerT >= 0) {
    S.flickerT += dt;
    let v = 1;
    for (const [time, val] of FLICKER) if (S.flickerT >= time) v = val;
    target *= v;
    if (S.flickerT > 0.7) S.flickerT = -1;
    S.shown = target;
  } else {
    S.shown = STILL ? target : damp(S.shown, target, 12, dt);
  }
  const c = COLORS[S.color];
  const k = 1 - Math.exp(-6 * dt);
  colNow.tube.lerp(new THREE.Color(c.tube), k);
  colNow.body.lerp(new THREE.Color(c.body), k);
  colNow.spill.lerp(new THREE.Color(c.spill), k);
  colNow.css = colNow.css.map((v, i) => lerp(v, c.css[i], k));

  const g = S.shown;
  const css = `${g.toFixed(3)}|${colNow.css.map((v) => v | 0).join(' ')}`;
  if (css !== lastCss) {
    lastCss = css;
    root.style.setProperty('--glow', g.toFixed(3));
    root.style.setProperty('--ink-a', (0.26 + 0.74 * Math.sqrt(g)).toFixed(3));
    root.style.setProperty('--lit', colNow.css.map((v) => v | 0).join(' '));
  }

  if (!GL.ok) return;
  const { M, spill, fill } = GL;
  M.tube.emissiveIntensity = 2.3 * g;
  M.frameTube.emissiveIntensity = 2.1 * g;
  M.frameTube.color.copy(colNow.tube);
  M.frameTube.emissive.copy(colNow.tube);
  M.body.color.copy(colNow.body);
  M.channel.emissiveIntensity = 0.16 * g;
  M.print.emissiveIntensity = 0.72 * g;
  M.edge.emissive.copy(colNow.tube);
  M.edge.emissiveIntensity = 0.7 * g;
  spill.color.copy(colNow.spill);
  spill.intensity = 3.2 * g;
  fill.intensity = 0.45 * g;
  GL.bloom.strength = (0.28 + 0.2 * g) * clamp(cam.dist / 7, 0.45, 1);
}

/* ------------------------------------------------------------------ */
/* readouts                                                            */
/* ------------------------------------------------------------------ */
function hm(h) {
  const H = Math.floor(h), m = Math.round((h - H) * 60);
  return `${H} h ${String(m).padStart(2, '0')} m`;
}
function updateReadouts() {
  const lvl = LEVELS[S.idx];
  const w = 6 * lvl;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('roPct', `${PCT[S.idx]}%`);
  set('roW', w ? `≈ ${w.toFixed(1)} W` : '0 W');
  set('roBank', w ? `≈ ${hm(31.45 / w)}` : 'forever');
  set('roYear', `≈ $${((w * 6 * 365) / 1000 * 0.17).toFixed(2)}`);
}

/* ------------------------------------------------------------------ */
/* sound: a tiny plastic click, only after a press                     */
/* ------------------------------------------------------------------ */
let actx;
function click(freq) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain(), f = actx.createBiquadFilter();
    o.type = 'square';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.03);
    f.type = 'bandpass';
    f.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(f).connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + 0.06);
  } catch (e) { /* no audio, no problem */ }
}

/* ------------------------------------------------------------------ */
/* toast                                                               */
/* ------------------------------------------------------------------ */
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ------------------------------------------------------------------ */
/* star easter egg                                                     */
/* ------------------------------------------------------------------ */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let starSpin = 0;
function hitStar(cx, cy) {
  if (!GL.ok || isCovered()) return false;
  ndc.set((cx / vw) * 2 - 1, -(cy / vh) * 2 + 1);
  ray.setFromCamera(ndc, GL.camera);
  return ray.intersectObjects(GL.starHit, false).length > 0;
}
const STAR_LINES = ['', 'One star. Keep going.', 'Two.', 'Three. Someone noticed.', 'Four.', 'Five stars. You can stop now.'];
function bumpStars() {
  S.stars = S.stars >= 5 ? 0 : S.stars + 1;
  $$('.wanted i').forEach((el, i) => el.classList.toggle('on', i < S.stars));
  $('.wanted').setAttribute('aria-label', `Stars: ${S.stars} of 5`);
  toast(S.stars === 0 ? 'Lost them. Back to zero.' : STAR_LINES[S.stars]);
  starSpin = 1;
  click(2600);
}

/* ------------------------------------------------------------------ */
/* frame loop                                                          */
/* ------------------------------------------------------------------ */
const clock = new THREE.Clock();
let lastY = scrollY, vel = 0, marquee;
const headlight = { next: STILL ? Infinity : 6, t: -1, dir: 1 };
const v3 = new THREE.Vector3();
const pinEls = $$('[data-pin]');

function isCovered() {
  const y = scrollY;
  return covers.some(([a, b]) => y >= a && y + vh <= b);
}

function activeSection() {
  const mid = scrollY + vh * 0.5;
  for (const el of $$('[data-scene]')) {
    const top = el.offsetTop, h = el.offsetHeight;
    if (mid >= top && mid < top + h) return el.id;
  }
  return '';
}

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  updateLevel(dt, t);

  const y = scrollY;
  vel = damp(vel, (y - lastY) / Math.max(dt, 0.001), 6, dt);
  lastY = y;
  if (marquee) marquee.playbackRate = (vel < -20 ? -1 : 1) * (1 + Math.min(5, Math.abs(vel) / 450));

  pointer.sx = damp(pointer.sx, pointer.x, 4, dt);
  pointer.sy = damp(pointer.sy, pointer.y, 4, dt);

  if (!GL.ok) return;
  const covered = isCovered();
  GL.renderer.domElement.style.visibility = covered ? 'hidden' : 'visible';
  if (covered) {
    pinEls.forEach((elx) => elx.classList.remove('show'));
    return;
  }

  const tgt = targetShot(y);
  const kk = reduced || STILL ? 1 : 1 - Math.exp(-5 * dt);
  KEYS.forEach((key) => (cam[key] = lerp(cam[key], tgt[key], kk)));

  const { camera, sign, L, spot, starG } = GL;
  const drift = coarse ? Math.sin(t * 0.35) * 0.06 : 0;
  const az = cam.az + pointer.sx * 0.14 + drift;
  const el = cam.el + pointer.sy * 0.07;
  const tz = 0.1 + cam.ex * 1.0 + cam.h * 1.5;
  camera.position.set(cam.tx + Math.sin(az) * Math.cos(el) * cam.dist, cam.ty + Math.sin(el) * cam.dist, tz + Math.cos(az) * Math.cos(el) * cam.dist);
  camera.lookAt(cam.tx, cam.ty, tz);
  camera.setViewOffset(vw, vh, -cam.sx * vw, cam.sy * vh, vw, vh);

  const hang = cam.h * S.hangMode;
  sign.position.z = cam.ex * 1.0 + hang * 1.5;
  sign.position.y = hang * 0.1;
  sign.rotation.z = reduced ? 0 : Math.sin(t * 0.9) * 0.022 * hang;
  sign.rotation.y = reduced ? 0 : Math.sin(t * 0.45) * 0.2 * hang;
  L.chain.visible = hang > 0.01;
  L.chain.position.y = (1 - hang) * 7;
  L.plate.position.z = -0.9 * cam.ex;
  L.print.position.z = -0.3 * cam.ex;
  L.frame.position.z = 0.4 * cam.ex;
  L.glyph.position.z = 1.15 * cam.ex;

  if (starSpin > 0) {
    starSpin = Math.max(0, starSpin - dt * 1.4);
    starG.rotation.z = -0.12 - ease(1 - starSpin) * Math.PI * 2;
  }

  // a car goes past outside every so often
  if (headlight.t < 0 && t > headlight.next) {
    headlight.t = 0;
    headlight.dir = Math.random() < 0.5 ? 1 : -1;
  }
  if (headlight.t >= 0) {
    headlight.t += dt / 3.4;
    const p = headlight.t;
    const x = lerp(-15, 15, p) * headlight.dir;
    spot.position.set(x, 1.4, 10);
    spot.target.position.set(x * 0.35, 0, -0.4);
    spot.intensity = Math.sin(Math.PI * clamp(p, 0, 1)) * 55;
    GL.renderer.shadowMap.needsUpdate = true;
    if (p >= 1) {
      headlight.t = -1;
      spot.intensity = 0;
      headlight.next = t + 9 + Math.random() * 8;
    }
  }

  GL.composer.render();

  // labels that follow points on the model
  const sec = activeSection();
  for (const elx of pinEls) {
    const [obj, local] = GL.pins[elx.dataset.pin];
    let show = elx.dataset.sec === sec;
    if (elx.dataset.sec === 'anatomy') show = show && cam.ex > 0.8;
    if (elx.dataset.sec === 'truth') show = show && cam.dist < 4;
    elx.classList.toggle('show', show);
    if (!show) continue;
    v3.copy(local);
    obj.localToWorld(v3);
    v3.project(camera);
    const px = ((v3.x + 1) / 2) * vw, py = ((1 - v3.y) / 2) * vh;
    if (vw < 900 && (py > vh * 0.5 || px < 12 || px > vw - 12)) { elx.classList.remove('show'); continue; }
    elx.classList.toggle('pin--l', px > vw - 250);
    elx.style.transform = `translate3d(${px}px, ${py}px, 0)`;
  }
}

/* ------------------------------------------------------------------ */
/* DOM wiring                                                          */
/* ------------------------------------------------------------------ */
function splitChars() {
  $$('.split').forEach((el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((line) => `<span class="row">${[...line.trim()].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`)
      .join('');
  });
}

function reveals() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );
  $$('.rv-group, .h2, .count-wrap').forEach((el) => io.observe(el));
}

function counters() {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const t0 = performance.now(), D = reduced ? 1 : 1400;
    const step = (now) => {
      const p = clamp((now - t0) / D, 0, 1);
      el.textContent = (to * ease(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => io.observe(el));
}

function sizeStage() {
  const svg = $('#sizeSvg');
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  const top = $('#rulerTop'), left = $('#rulerLeft');
  for (let mm = 0; mm <= 300; mm += 10) {
    const major = mm % 50 === 0;
    const l1 = document.createElementNS(ns, 'line');
    l1.setAttribute('x1', mm); l1.setAttribute('x2', mm); l1.setAttribute('y1', -24); l1.setAttribute('y2', major ? -40 : -31);
    l1.style.setProperty('--d', `${mm * 2}ms`);
    top.appendChild(l1);
    const l2 = document.createElementNS(ns, 'line');
    l2.setAttribute('y1', mm); l2.setAttribute('y2', mm); l2.setAttribute('x1', -24); l2.setAttribute('x2', major ? -40 : -31);
    l2.style.setProperty('--d', `${mm * 2}ms`);
    left.appendChild(l2);
    if (major) {
      const t1 = document.createElementNS(ns, 'text');
      t1.setAttribute('x', mm); t1.setAttribute('y', -48); t1.textContent = mm;
      top.appendChild(t1);
      const t2 = document.createElementNS(ns, 'text');
      t2.setAttribute('x', -48); t2.setAttribute('y', mm + 4); t2.setAttribute('text-anchor', 'end'); t2.textContent = mm;
      left.appendChild(t2);
    }
  }
  const groups = $$('.cmp', svg);
  const pos = new Map(groups.map((g) => [g, { x: 0, y: 0 }]));
  const narrow = matchMedia('(max-width: 640px)');
  const home = (g) => (narrow.matches ? Number(g.dataset.mx || 0) : 0);
  const place = (g) => {
    const o = pos.get(g);
    g.style.transform = `translate(${home(g) + o.x}px, ${o.y}px)`;
  };
  let current = 'lp';
  const frameView = () => {
    svg.classList.toggle('ovl', narrow.matches);
    svg.setAttribute('viewBox', narrow.matches ? (current === 'monitor' ? '-190 -160 680 480' : '-70 -80 420 400') : current === 'monitor' ? '-190 -150 880 470' : '-100 -90 800 420');
    groups.forEach(place);
  };
  narrow.addEventListener('change', frameView);
  const pick = (name) => {
    current = name;
    groups.forEach((g) => {
      const on = g.dataset.cmp === name;
      g.classList.toggle('on', on);
      if (!on) pos.set(g, { x: 0, y: 0 });
    });
    frameView();
    $$('[data-pick]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.pick === name)));
    const g = groups.find((x) => x.dataset.cmp === name);
    $('#sizeNote').textContent = g ? g.dataset.note : '';
  };
  $$('[data-pick]').forEach((b) => b.addEventListener('click', () => { pick(b.dataset.pick); click(1800); }));
  pick('lp');

  let drag = null;
  const toSvg = (e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  groups.forEach((g) => {
    g.addEventListener('pointerdown', (e) => {
      if (!g.classList.contains('on')) return;
      const p = toSvg(e), o = pos.get(g);
      drag = { g, sx: p.x - o.x, sy: p.y - o.y };
      g.setPointerCapture(e.pointerId);
      g.classList.add('dragging');
    });
    g.addEventListener('pointermove', (e) => {
      if (!drag || drag.g !== g) return;
      const p = toSvg(e);
      const o = { x: clamp(p.x - drag.sx, -560, 340), y: clamp(p.y - drag.sy, -140, 80) };
      pos.set(g, o);
      place(g);
    });
    const end = () => { if (drag && drag.g === g) { drag = null; g.classList.remove('dragging'); } };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
    g.addEventListener('dblclick', () => { pos.set(g, { x: 0, y: 0 }); place(g); });
  });
}

function loupes() {
  $$('.ph').forEach((fig) => {
    const img = $('img', fig), lens = $('.loupe', fig);
    const ZOOM = 2.6;
    const move = (e) => {
      const r = img.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return fig.classList.remove('looking');
      fig.classList.add('looking');
      lens.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      lens.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
      lens.style.backgroundPosition = `${-(x * ZOOM - 80)}px ${-(y * ZOOM - 80)}px`;
      const rx = (y / r.height - 0.5) * -6, ry = (x / r.width - 0.5) * 8;
      fig.style.setProperty('--rx', `${rx}deg`);
      fig.style.setProperty('--ry', `${ry}deg`);
    };
    fig.addEventListener('pointermove', move);
    fig.addEventListener('pointerdown', move);
    fig.addEventListener('pointerleave', () => { fig.classList.remove('looking'); fig.style.setProperty('--rx', '0deg'); fig.style.setProperty('--ry', '0deg'); });
  });
}

function countdown() {
  const el = $('#tdays');
  if (!el) return;
  const now = new Date();
  const day = new Date(2026, 10, 19);
  const d = Math.ceil((day - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  if (d < 0) el.closest('.tminus').remove();
  else el.textContent = d === 0 ? 'today' : d;
}

function wire() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (a) { e.preventDefault(); return act(a.dataset.act); }
    const c = e.target.closest('[data-color]');
    if (c) { setColor(c.dataset.color); click(1700); return; }
    const h = e.target.closest('[data-hang]');
    if (h) {
      S.hangMode = Number(h.dataset.hang);
      $$('[data-hang]').forEach((b) => b.setAttribute('aria-checked', String(b === h)));
      click(1600);
      return;
    }
    if (!e.target.closest('a, button, input, label, .ph, .size-stage') && hitStar(e.clientX, e.clientY)) bumpStars();
  });

  $('#qtyMinus').addEventListener('click', () => { S.qty = Math.max(1, S.qty - 1); $('#qty').textContent = S.qty; click(1900); });
  $('#qtyPlus').addEventListener('click', () => { S.qty = Math.min(9, S.qty + 1); $('#qty').textContent = S.qty; click(2100); });
  $('#addCart').addEventListener('click', (e) => {
    const b = e.currentTarget;
    S.cart += S.qty;
    $('#cartCount').textContent = S.cart;
    b.classList.add('added');
    b.querySelector('span').textContent = 'Added';
    setTimeout(() => { b.classList.remove('added'); b.querySelector('span').textContent = 'Add to cart'; }, 1800);
    toast(`In the cart: ${S.qty} × Ocean Drive, ${COLORS[S.color].name.toLowerCase()} frame.`);
    click(1500);
  });

  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / vw) * 2 - 1;
    pointer.y = -((e.clientY / vh) * 2 - 1);
    root.style.setProperty('--mx', `${e.clientX}px`);
    root.style.setProperty('--my', `${e.clientY}px`);
    root.style.setProperty('--fx', `${((e.clientX / vw) * 100).toFixed(1)}%`);
    if (!coarse && GL.ok) {
      const over = !e.target.closest('a, button, input, label') && hitStar(e.clientX, e.clientY);
      document.body.classList.toggle('over-star', over);
    }
  }, { passive: true });

  const wake = (e) => {
    if (S.powered) return;
    if (e.type === 'keydown' && !['ArrowDown', 'PageDown', ' ', 'Enter', 'ArrowUp'].includes(e.key)) return;
    powerOn();
  };
  addEventListener('wheel', wake, { passive: true });
  addEventListener('touchmove', wake, { passive: true });
  addEventListener('keydown', wake);

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (coarse && Math.abs(innerWidth - vw) < 2 && Math.abs(innerHeight - vh) < 140) { measure(); return; }
      resize();
    }, 120);
  });
  addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
}

/* ------------------------------------------------------------------ */
/* boot                                                                */
/* ------------------------------------------------------------------ */
splitChars();
buildScene();
wire();
reveals();
counters();
sizeStage();
loupes();
countdown();
setColor('red');
setLevel(0, { quiet: true });
updateReadouts();
measure();
const track = $('.mq-track');
if (track && !reduced) marquee = track.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 38000, iterations: Infinity });
requestAnimationFrame(frame);
if (reduced) setTimeout(() => { if (!S.powered) powerOn(); }, 600);
