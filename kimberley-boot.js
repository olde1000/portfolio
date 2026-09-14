import * as THREE from 'three';

const CARD = 1.6, MARK_OUT = 2.4;
const VEIL_FROM = 1.9, VEIL_TO = 3.2;
const FLY_FROM = 2.9, FLY_TO = 7.6;
const GATE = 0.86, BLEND = 0.80, GIVE_UP = 13.0;
const FAR_R = 62, NEAR_R = 6.2, SWING = 0.40;
const FAR_EL = 0.34, NEAR_EL = 0.015;
const STREAKS = 700, TUNNEL_R = 17, TUNNEL_Z = 86;
const STREAK_K = 0.22, STREAK_CAP = 13, LIGHT_AT = 26;
const WEIGHT_LO = 150, WEIGHT_HI = 520;
const TRACK_LO = 0.26, TRACK_HI = 0.62;

const ASSETS = {
  'astronaut': 1211932,
  'assets/models/earth.glb': 94712,
  'assets/models/rocket.glb': 1175156
};

const root = document.getElementById('kimberleyBoot');
const mark = document.getElementById('kimberleyBootMark');
const renderer = window.kimberleyRenderer;
const scene = window.kimberleyScene;

if (root && mark && renderer && scene) {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pace = calm.matches ? 4.0 : 1.0;

  let total = 0;
  const got = {};
  for (const k in ASSETS) total += ASSETS[k];

  window.kimberleyLabsBytes = (name, loaded, done) => {
    if (!(name in ASSETS)) return;
    got[name] = Math.min(ASSETS[name], done ? (loaded / Math.max(done, 1)) * ASSETS[name] : loaded);
  };

  const progress = () => {
    let sum = 0;
    for (const k in got) sum += got[k];
    return Math.min(1, sum / total);
  };

  document.body.classList.add('kimberley-is-locked');

  const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  const band = (v, a, b) => smooth((v - a) / (b - a));
  const mix = (a, b, v) => a + (b - a) * v;
  const ROLL = (() => {
    const N = 256, out = new Float32Array(N + 1);
    let acc = 0;
    for (let i = 0; i <= N; i++) {
      const v = i / N;
      acc += smooth(v / 0.24) * (1 - smooth((v - 0.58) / 0.42));
      out[i] = acc;
    }
    for (let i = 0; i <= N; i++) out[i] /= acc;
    return out;
  })();

  const surge = (v) => {
    const x = Math.max(0, Math.min(1, v)) * 256;
    const i = Math.min(255, x | 0);
    return ROLL[i] + (ROLL[i + 1] - ROLL[i]) * (x - i);
  };

  const eye = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const aim = new THREE.Vector3();

  const line = new Float32Array(STREAKS * 6);
  const dust = [];
  for (let i = 0; i < STREAKS; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.sqrt(Math.random()) * TUNNEL_R;
    dust.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -1 - Math.random() * TUNNEL_Z });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(line, 3));
  const warp = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: 0xd6e6ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  warp.frustumCulled = false;
  warp.visible = false;
  scene.add(warp);

  let clock = 0, run = 0, held = 0, wasR = FAR_R, done = false;

  const fly = (dt, cam) => {
    clock += dt * pace;
    held += dt;

    const ready = progress() >= 0.999;
    const want = band(clock, FLY_FROM, FLY_TO);
    if (run < GATE || ready || held >= GIVE_UP) run = Math.max(run, want);

    const e = surge(run);
    const radius = mix(FAR_R, NEAR_R, e);
    const el = mix(FAR_EL, NEAR_EL, e);

    cam.updateMatrixWorld();
    const lane = Math.atan2(cam.position.x, cam.position.z) + SWING * (1 - e);
    const ce = Math.cos(el);

    eye.fov = cam.fov;
    eye.aspect = cam.aspect;
    eye.near = cam.near;
    eye.far = cam.far;
    eye.updateProjectionMatrix();
    eye.position.set(Math.sin(lane) * ce * radius, Math.sin(el) * radius, Math.cos(lane) * ce * radius);
    aim.set(0, mix(0.7, 0, e), 0);
    eye.lookAt(aim);

    const merge = band(run, BLEND, 1);
    if (merge > 0) {
      eye.position.lerp(cam.position, merge);
      eye.quaternion.slerp(cam.quaternion, merge);
    }
    eye.updateMatrixWorld();

    const rate = dt > 0 ? Math.abs(wasR - radius) / dt : 0;
    wasR = radius;
    const lit = Math.min(1, rate / LIGHT_AT);
    const reach = Math.min(STREAK_CAP, rate * STREAK_K);

    warp.visible = lit > 0.01;
    if (warp.visible) {
      warp.position.copy(eye.position);
      warp.quaternion.copy(eye.quaternion);
      warp.material.opacity = lit * lit * 0.9;
      for (let i = 0; i < STREAKS; i++) {
        const d = dust[i];
        d.z += rate * dt;
        if (d.z > -0.8) {
          const a = Math.random() * Math.PI * 2;
          const r = 0.5 + Math.sqrt(Math.random()) * TUNNEL_R;
          d.x = Math.cos(a) * r; d.y = Math.sin(a) * r; d.z = -TUNNEL_Z;
        }
        const k = i * 6;
        line[k] = d.x; line[k + 1] = d.y; line[k + 2] = d.z;
        line[k + 3] = d.x; line[k + 4] = d.y; line[k + 5] = d.z - reach;
      }
      geo.attributes.position.needsUpdate = true;
    }

    root.style.setProperty('--kimberley-boot-veil', (1 - band(clock, VEIL_FROM, VEIL_TO)).toFixed(3));

    const out = band(clock, CARD, MARK_OUT);
    const st = mark.style;
    st.setProperty('--kimberley-boot-wght', Math.round(mix(WEIGHT_LO, WEIGHT_HI, out)));
    st.setProperty('--kimberley-boot-track', mix(TRACK_LO, TRACK_HI, out).toFixed(3) + 'em');
    st.setProperty('--kimberley-boot-lift', (1 - out).toFixed(3));
    st.setProperty('--kimberley-boot-soft', (out * 9).toFixed(2) + 'px');

    if (run >= 1) {
      done = true;
      window.kimberleyBooted = true;
      warp.removeFromParent();
      geo.dispose();
      warp.material.dispose();
      root.remove();
      return cam;
    }
    return eye;
  };

  const prior = window.kimberleyPresent;
  const draw = prior || ((s, c) => renderer.render(s, c));
  let last = null;

  window.kimberleyPresent = (s, cam) => {
    const now = performance.now();
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    draw(s, done ? cam : fly(dt, cam));
  };
}
