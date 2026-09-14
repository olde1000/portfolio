import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TRIGGER = 0.22, LEAD = 1.2;
const DIST = 70, ELEV = 5;
const SCALE = 5.0, TAIL = 2.9;
const CRUISE = 0.9, CLIMB = 0.05;
const SPIN = 0.18, END_FADE = 1.1;

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

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  glow.scale.setScalar(TAIL);
  glow.position.set(0, -SCALE * 0.55, 0);
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

  const forward = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const course = new THREE.Vector3();
  const Y_UP = new THREE.Vector3(0, 1, 0);

  let travel = -1, done = false, last = null, leaving = 0;

  const park = () => {
    camera.updateMatrixWorld();
    camera.getWorldDirection(forward);
    const phi = Math.atan2(forward.x, forward.z) + LEAD;
    anchor.set(Math.sin(phi) * DIST, ELEV, Math.cos(phi) * DIST);
    course.set(Math.cos(phi), CLIMB, -Math.sin(phi)).normalize();
    rig.quaternion.setFromUnitVectors(Y_UP, course);
    travel = 0;
  };

  const tick = (now) => {
    requestAnimationFrame(tick);
    if (last === null) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (done) return;

    if (travel < 0) {
      if ((window.kimberleyScrollP || 0) < TRIGGER) return;
      park();
    }

    travel += dt * CRUISE;
    if ((window.kimberleyEnd || 0) > 0.001) leaving += dt;
    const bow = 1 - Math.min(1, leaving / END_FADE);
    if (bow <= 0) {
      rig.visible = false;
      done = true;
      return;
    }

    rig.position.copy(anchor).addScaledVector(course, travel);
    body.rotation.y += dt * SPIN;

    for (const m of parts) m.opacity = bow;
    glow.material.opacity = bow * (0.55 + 0.2 * Math.sin(travel * 9));
    rig.visible = true;
  };

  requestAnimationFrame(tick);
}
