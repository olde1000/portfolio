import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TRIGGER = 0.12, SCROLL_SPAN = 0.72;
const DIST = 72, LATERAL = 58, RISE = 9, DROP = -4;
const DURATION = 6.5, SCALE = 1.05;
const FADE_IN = 0.10, FADE_OUT = 0.86;
const SPIN = 0.24;

const scene = window.kimberleyScene;
const camera = window.kimberleyCamera;

if (scene && camera) {
  const rig = new THREE.Group();
  rig.visible = false;
  scene.add(rig);

  const body = new THREE.Group();
  body.rotation.x = -Math.PI / 2;
  rig.add(body);

  const glowTex = (() => {
    const S = 64, C = S / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(C, C, 0, C, C, C);
    grd.addColorStop(0.00, 'rgba(255,240,210,1)');
    grd.addColorStop(0.22, 'rgba(255,170,90,0.7)');
    grd.addColorStop(1.00, 'rgba(255,120,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(2.2);
  rig.add(glow);

  const parts = [];
  new GLTFLoader().load('assets/models/rocket.glb', (gltf) => {
    const o = gltf.scene;
    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3(); box.getSize(size);
    const centre = new THREE.Vector3(); box.getCenter(centre);
    o.position.sub(centre);
    o.scale.setScalar(SCALE / (Math.max(size.x, size.y, size.z) || 1));
    o.traverse((n) => {
      if (!n.isMesh || !n.material) return;
      const ms = Array.isArray(n.material) ? n.material : [n.material];
      ms.forEach((m) => { m.transparent = true; parts.push(m); });
    });
    body.add(o);
  }, undefined, (err) => console.warn('rocket load failed', err));

  const origin = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const heading = new THREE.Vector3();
  const Y_UP = new THREE.Vector3(0, 1, 0);

  const aim = () => {
    camera.updateMatrixWorld();
    camera.getWorldPosition(origin);
    camera.matrixWorld.extractBasis(right, up, forward);
    forward.negate();
  };

  const at = (p, out) => out.copy(origin)
    .addScaledVector(forward, DIST)
    .addScaledVector(right, LATERAL * (1 - 2 * p))
    .addScaledVector(up, DROP + RISE * p);

  const here = new THREE.Vector3();
  const ahead = new THREE.Vector3();

  let flight = -1, done = false, last = null;

  const launch = () => {
    flight = 0;
    rig.visible = true;
  };

  const tick = (now) => {
    requestAnimationFrame(tick);
    if (last === null) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (done) return;

    if (flight < 0) {
      if ((window.kimberleyScrollP || 0) >= TRIGGER) launch();
      return;
    }

    flight += dt;
    const swept = ((window.kimberleyScrollP || 0) - TRIGGER) / SCROLL_SPAN;
    const p = Math.max(flight / DURATION, swept);
    if (p >= 1 || (window.kimberleyEnd || 0) > 0.001) {
      rig.visible = false;
      done = true;
      return;
    }

    aim();
    at(p, here);
    at(Math.min(1, p + 0.02), ahead);
    rig.position.copy(here);
    heading.subVectors(ahead, here).normalize();
    rig.quaternion.setFromUnitVectors(Y_UP, heading);
    body.rotation.y += dt * SPIN;

    const fade = Math.min(1, p / FADE_IN) * Math.min(1, (1 - p) / (1 - FADE_OUT));
    for (const m of parts) m.opacity = fade;
    glow.position.copy(heading).multiplyScalar(-0.9);
    glowMat.opacity = fade * (0.55 + 0.2 * Math.sin(flight * 11));
  };

  requestAnimationFrame(tick);
}
