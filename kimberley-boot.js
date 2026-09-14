import * as THREE from 'three';

const FLIGHT = 6.0, GATE = 0.84, BLEND = 0.76, GIVE_UP = 11.0;
const FAR_R = 52, NEAR_R = 6.2;
const FAR_EL = 0.40, NEAR_EL = 0.02;
const SWEEP = 0.85, BANK = 0.16;
const VEIL_IN = 1.6;
const MARK_UP = 0.9, MARK_HOLD = 2.4, MARK_OUT = 4.3, MARK_GONE = 5.5;
const WEIGHT_LO = 140, WEIGHT_HI = 560;
const TRACK_LO = 0.58, TRACK_HI = 0.20;

const ASSETS = {
  'astronaut': 1211932,
  'assets/models/earth.glb': 94712,
  'assets/models/rocket.glb': 1175156
};

const root = document.getElementById('kimberleyBoot');
const mark = document.getElementById('kimberleyBootMark');
const renderer = window.kimberleyRenderer;

if (root && mark && renderer) {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const span = calm.matches ? 1.4 : FLIGHT;

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

  const eye = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const aim = new THREE.Vector3();
  const seat = new THREE.Vector3();
  const start = Math.random() * Math.PI * 2;

  const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  const glide = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  const band = (v, a, b) => smooth((v - a) / (b - a));
  const mix = (a, b, v) => a + (b - a) * v;

  let t = 0, held = 0, done = false, handed = false;

  const fly = (dt, cam) => {
    const ready = progress() >= 0.999;
    held += dt;
    if (t < GATE || ready || held >= GIVE_UP) t = Math.min(1, t + dt / span);

    const e = glide(t);
    const radius = mix(FAR_R, NEAR_R, e);
    const el = mix(FAR_EL, NEAR_EL, e);
    const az = start + SWEEP * e;
    const ce = Math.cos(el);

    seat.set(Math.sin(az) * ce * radius, Math.sin(el) * radius, Math.cos(az) * ce * radius);
    aim.set(0, mix(0.8, 0, e), 0);

    eye.fov = cam.fov;
    eye.aspect = cam.aspect;
    eye.near = cam.near;
    eye.far = cam.far;
    eye.updateProjectionMatrix();

    eye.position.copy(seat);
    eye.up.set(Math.sin(BANK * (1 - e)), Math.cos(BANK * (1 - e)), 0);
    eye.lookAt(aim);

    const merge = band(t, BLEND, 1);
    if (merge > 0) {
      cam.updateMatrixWorld();
      eye.position.lerp(cam.position, merge);
      eye.quaternion.slerp(cam.quaternion, merge);
    }
    eye.updateMatrixWorld();

    const secs = t * span;
    root.style.setProperty('--kimberley-boot-veil', (1 - band(secs, 0, VEIL_IN)).toFixed(3));

    const rise = band(secs, MARK_UP, MARK_HOLD);
    const gone = band(secs, MARK_OUT, MARK_GONE);
    const st = mark.style;
    st.setProperty('--kimberley-boot-wght', Math.round(mix(WEIGHT_LO, WEIGHT_HI, rise)));
    st.setProperty('--kimberley-boot-track', mix(TRACK_LO, TRACK_HI, rise).toFixed(3) + 'em');
    st.setProperty('--kimberley-boot-lift', (rise * (1 - gone)).toFixed(3));
    st.setProperty('--kimberley-boot-soft', (3.2 * (1 - rise) + gone * 7).toFixed(2) + 'px');
    st.setProperty('--kimberley-boot-slide', (mix(26, 0, rise) - gone * 34).toFixed(1) + 'px');

    if (t >= 1 && !handed) {
      handed = true;
      done = true;
      window.kimberleyBooted = true;
      root.remove();
    }
    return done ? cam : eye;
  };

  const prior = window.kimberleyPresent;
  const draw = prior || ((s, c) => renderer.render(s, c));
  let last = null;

  window.kimberleyPresent = (scene, cam) => {
    const now = performance.now();
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    draw(scene, done ? cam : fly(dt, cam));
  };
}
