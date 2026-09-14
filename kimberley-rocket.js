import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TRIGGER = 0.22, LEAD = 1.2;
const DIST = 70, ELEV = 5;
const SCALE = 5.0, TAIL = 2.9;
const CRUISE = 3.0, CLIMB = 0.04;
const SPIN = 0.18, END_FADE = 1.1;
const BLAST_MATS = ['mat13', 'mat12', 'mat14'];
const PLUME_R = 0.17, PLUME_H = 1.05;

const scene = window.kimberleyScene;
const camera = window.kimberleyCamera;

if (scene && camera) {
  const rig = new THREE.Group();
  rig.visible = false;
  scene.add(rig);

  const body = new THREE.Group();
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
  glow.position.set(0, -SCALE * 0.5, 0);
  rig.add(glow);

  const plumeGeo = new THREE.ConeGeometry(PLUME_R * SCALE, PLUME_H * SCALE, 18, 1, true);
  {
    const pos = plumeGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const hot = new THREE.Color(0xfff0d2);
    const cool = new THREE.Color(0xff5a14);
    const c = new THREE.Color();
    const half = (PLUME_H * SCALE) / 2;
    for (let i = 0; i < pos.count; i++) {
      const u = (half - pos.getY(i)) / (half * 2);
      c.copy(cool).lerp(hot, 1 - u).multiplyScalar(Math.pow(1 - u, 1.6));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    plumeGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const plume = new THREE.Mesh(plumeGeo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  }));
  plume.rotation.x = Math.PI;
  plume.position.set(0, -SCALE * 0.5 - (PLUME_H * SCALE) / 2, 0);
  rig.add(plume);

  const parts = [];
  new GLTFLoader().load('assets/models/rocket.glb', (gltf) => {
    const o = gltf.scene;
    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3(); box.getSize(size);
    const centre = new THREE.Vector3(); box.getCenter(centre);
    o.position.sub(centre);
    o.scale.setScalar(SCALE / (Math.max(size.x, size.y, size.z) || 1));
    const blast = [];
    o.traverse((n) => {
      if (!n.isMesh || !n.material) return;
      const ms = Array.isArray(n.material) ? n.material : [n.material];
      if (ms.some((m) => BLAST_MATS.indexOf(m.name) !== -1)) { blast.push(n); return; }
      ms.forEach((m) => { m.transparent = true; parts.push(m); });
    });
    blast.forEach((n) => { n.removeFromParent(); n.geometry.dispose(); });
    body.add(o);
  }, (e) => {
    if (window.kimberleyLabsBytes) window.kimberleyLabsBytes('assets/models/rocket.glb', e.loaded, e.total);
  }, (err) => console.warn('rocket load failed', err));

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
    course.set(-Math.cos(phi), CLIMB, Math.sin(phi)).normalize();
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
    const burn = 0.78 + 0.22 * Math.sin(travel * 37) * Math.sin(travel * 14.3);
    glow.material.opacity = bow * 0.7 * burn;
    plume.material.opacity = bow * 0.85 * burn;
    plume.scale.set(1, 0.9 + 0.14 * burn, 1);
    rig.visible = true;
  };

  requestAnimationFrame(tick);
}
