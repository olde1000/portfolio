import * as THREE from 'three';

const SHELLS = [
  { n: 900,  near: 20, far: 40, size: 0.380, opacity: 0.95, spin: 0.011, sway: 1.00 },
  { n: 1150, near: 40, far: 66, size: 0.440, opacity: 0.72, spin: 0.006, sway: 0.58 },
  { n: 2900, near: 66, far: 95, size: 0.460, opacity: 0.52, spin: 0.003, sway: 0.28 }
];
const SWAY_YAW = 0.24, SWAY_PITCH = 0.15, SWAY_EASE = 2.4;
const COOL = new THREE.Color(0xcfe0ff);
const WARM = new THREE.Color(0xffd6aa);
const WARM_ODDS = 0.17;

const sprite = (() => {
  const S = 64, C = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(C, C, 0, C, C, C);
  grd.addColorStop(0.00, 'rgba(255,255,255,1)');
  grd.addColorStop(0.16, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.42, 'rgba(255,255,255,0.28)');
  grd.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
})();

const buildShell = (spec) => {
  const pos = new Float32Array(spec.n * 3);
  const col = new Float32Array(spec.n * 3);
  const c = new THREE.Color();

  for (let i = 0; i < spec.n; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = spec.near + Math.cbrt(Math.random()) * (spec.far - spec.near);
    pos[i * 3] = s * Math.cos(th) * r;
    pos[i * 3 + 1] = u * r;
    pos[i * 3 + 2] = s * Math.sin(th) * r;

    c.copy(Math.random() < WARM_ODDS ? WARM : COOL);
    c.multiplyScalar(0.55 + Math.random() * 0.45);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    map: sprite,
    size: spec.size,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  return { points, spec, spinY: points.rotation.y, spinX: points.rotation.x };
};

const scene = window.kimberleyScene;
if (scene) {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shells = SHELLS.map((spec) => {
    const shell = buildShell(spec);
    scene.add(shell.points);
    return shell;
  });

  let last = null, mx = 0, my = 0;

  const tick = (now) => {
    requestAnimationFrame(tick);
    if (last === null) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const out = Math.max(0, Math.min(1, window.kimberleyEnd || 0));
    const fade = 1 - out;
    const still = calm.matches;

    if (!still) {
      const k = Math.min(1, dt * SWAY_EASE);
      mx += (((window.kimberleyMouseX == null ? 0.5 : window.kimberleyMouseX) - 0.5) - mx) * k;
      my += (((window.kimberleyMouseY == null ? 0.5 : window.kimberleyMouseY) - 0.5) - my) * k;
    }

    for (const shell of shells) {
      const { points, spec } = shell;
      points.visible = fade > 0.002;
      points.material.opacity = spec.opacity * fade;
      if (still) continue;
      shell.spinY += dt * spec.spin;
      shell.spinX += dt * spec.spin * 0.35;
      points.rotation.y = shell.spinY - mx * SWAY_YAW * spec.sway;
      points.rotation.x = shell.spinX + my * SWAY_PITCH * spec.sway;
    }
  };

  requestAnimationFrame(tick);
}
