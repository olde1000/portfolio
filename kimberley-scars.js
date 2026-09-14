import * as THREE from 'three';

const MAX_SCARS = 16;
const SCAR_WORLD = 0.14;
const FLARE_WORLD = 0.34;
const FLARE_DUR = 0.9;
const SPARK_COUNT = 14;
const SPARK_DUR = 0.72;
const SPARK_WORLD = 0.5;
const TEX_VARIANTS = 5;

const plane = new THREE.PlaneGeometry(1, 1);
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const worldScale = new THREE.Vector3();
const FORWARD = new THREE.Vector3(0, 0, 1);

const scarTextures = [];
let flareTexture = null;
let suitMaterial = null;
let seenPulse = 0;
let lastFrame = null;

const scars = [];
const flares = [];
const bursts = [];

const makeScarTexture = () => {
  const S = 128, C = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');

  const blob = (x, y, r, a) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(20,13,10,${a})`);
    grd.addColorStop(0.5, `rgba(96,58,38,${a * 0.6})`);
    grd.addColorStop(1, 'rgba(150,120,100,0)');
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };

  blob(C, C, S * 0.32, 0.9);
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * S * 0.18;
    blob(C + Math.cos(a) * d, C + Math.sin(a) * d, S * (0.06 + Math.random() * 0.12), 0.3 + Math.random() * 0.4);
  }

  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = S * 0.14, r1 = S * (0.24 + Math.random() * 0.16);
    g.strokeStyle = `rgba(38,24,18,${0.18 + Math.random() * 0.3})`;
    g.lineWidth = 1 + Math.random() * 2.2;
    g.beginPath();
    g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0);
    g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1);
    g.stroke();
  }

  g.globalCompositeOperation = 'destination-over';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const makeFlareTexture = () => {
  const S = 128, C = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(C, C, 0, C, C, C);
  grd.addColorStop(0.00, 'rgba(255,248,236,1)');
  grd.addColorStop(0.16, 'rgba(255,198,126,0.92)');
  grd.addColorStop(0.42, 'rgba(255,122,44,0.45)');
  grd.addColorStop(1.00, 'rgba(255,90,20,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const init = () => {
  for (let i = 0; i < TEX_VARIANTS; i++) scarTextures.push(makeScarTexture());
  flareTexture = makeFlareTexture();
};

const orient = (obj, localPoint, normal, invScale, size) => {
  obj.position.copy(localPoint).addScaledVector(normal, 0.01 * invScale);
  obj.quaternion.setFromUnitVectors(FORWARD, normal);
  obj.rotateZ(Math.random() * Math.PI * 2);
  obj.scale.setScalar(size * invScale);
};

const addScar = (host, localPoint, normal, invScale) => {
  const mat = new THREE.MeshBasicMaterial({
    map: scarTextures[(Math.random() * TEX_VARIANTS) | 0],
    transparent: true,
    blending: THREE.MultiplyBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  });
  const mesh = new THREE.Mesh(plane, mat);
  orient(mesh, localPoint, normal, invScale, SCAR_WORLD * (0.8 + Math.random() * 0.5));
  host.add(mesh);
  scars.push(mesh);

  while (scars.length > MAX_SCARS) {
    const old = scars.shift();
    old.removeFromParent();
    old.material.dispose();
  }
};

const addFlare = (host, localPoint, normal, invScale) => {
  const mat = new THREE.MeshBasicMaterial({
    map: flareTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(plane, mat);
  orient(mesh, localPoint, normal, invScale, FLARE_WORLD);
  mesh.position.addScaledVector(normal, 0.012 * invScale);
  host.add(mesh);
  flares.push({ mesh, t: 0, base: mesh.scale.x });
};

const addBurst = (host, localPoint, normal, invScale) => {
  const pos = new Float32Array(SPARK_COUNT * 3);
  const vel = new Float32Array(SPARK_COUNT * 3);
  const tangentA = new THREE.Vector3();
  const tangentB = new THREE.Vector3();
  tangentA.set(normal.y, -normal.z, normal.x).cross(normal).normalize();
  tangentB.crossVectors(normal, tangentA).normalize();

  const dir = new THREE.Vector3();
  for (let i = 0; i < SPARK_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const spread = 0.35 + Math.random() * 0.85;
    dir.copy(normal)
      .addScaledVector(tangentA, Math.cos(a) * spread)
      .addScaledVector(tangentB, Math.sin(a) * spread)
      .normalize()
      .multiplyScalar(SPARK_WORLD * (0.45 + Math.random()) * invScale);
    pos[i * 3] = localPoint.x; pos[i * 3 + 1] = localPoint.y; pos[i * 3 + 2] = localPoint.z;
    vel[i * 3] = dir.x; vel[i * 3 + 1] = dir.y; vel[i * 3 + 2] = dir.z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffb066,
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  host.add(points);
  bursts.push({ points, vel, t: 0 });
};

const strike = () => {
  const astro = window.kimberleyAstro;
  const camera = window.kimberleyCamera;
  if (!astro || !camera) return;
  if ((window.kimberleyEnd || 0) >= 0.001) return;

  ndc.x = (window.kimberleyClickNX == null ? 0.5 : window.kimberleyClickNX) * 2 - 1;
  ndc.y = -((window.kimberleyClickNY == null ? 0.5 : window.kimberleyClickNY) * 2 - 1);
  ray.setFromCamera(ndc, camera);

  const hit = ray.intersectObject(astro, true)[0];
  if (!hit || !hit.face) return;

  const host = hit.object;
  host.updateWorldMatrix(true, false);
  host.getWorldScale(worldScale);
  const invScale = 1 / (worldScale.x || 1);

  const localPoint = host.worldToLocal(hit.point.clone());
  const normal = hit.face.normal.clone().normalize();

  if (!suitMaterial) {
    suitMaterial = Array.isArray(host.material) ? host.material[0] : host.material;
  }

  addScar(host, localPoint, normal, invScale);
  addFlare(host, localPoint, normal, invScale);
  addBurst(host, localPoint, normal, invScale);
};

const step = (dt) => {
  const suit = suitMaterial ? suitMaterial.opacity : 1;

  for (let i = scars.length - 1; i >= 0; i--) {
    scars[i].material.opacity = suit;
  }

  for (let i = flares.length - 1; i >= 0; i--) {
    const f = flares[i];
    f.t += dt;
    const p = f.t / FLARE_DUR;
    if (p >= 1) {
      f.mesh.removeFromParent();
      f.mesh.material.dispose();
      flares.splice(i, 1);
      continue;
    }
    const fade = (1 - p) * (1 - p);
    f.mesh.material.opacity = fade * suit;
    f.mesh.scale.setScalar(f.base * (1.35 - 0.45 * p));
  }

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.t += dt;
    const p = b.t / SPARK_DUR;
    if (p >= 1) {
      b.points.removeFromParent();
      b.points.geometry.dispose();
      b.points.material.dispose();
      bursts.splice(i, 1);
      continue;
    }
    const drag = Math.exp(-3.4 * dt);
    const arr = b.points.geometry.attributes.position.array;
    for (let s = 0; s < SPARK_COUNT * 3; s++) {
      arr[s] += b.vel[s] * dt;
      b.vel[s] *= drag;
    }
    b.points.geometry.attributes.position.needsUpdate = true;
    b.points.material.opacity = (1 - p) * (1 - p) * suit;
  }
};

const frame = (now) => {
  requestAnimationFrame(frame);
  if (lastFrame === null) { lastFrame = now; return; }
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  const pulse = window.kimberleyClickPulse || 0;
  if (pulse !== seenPulse) { seenPulse = pulse; strike(); }

  step(dt);
};

init();
requestAnimationFrame(frame);
