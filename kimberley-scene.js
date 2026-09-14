import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const astroCanvas = document.getElementById('kimberleyAstroGL');
const renderer = new THREE.WebGLRenderer({ canvas: astroCanvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
window.kimberleyScene = scene;
window.kimberleyRenderer = renderer;
const present = () => (window.kimberleyPresent || renderer.render.bind(renderer))(scene, camera);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
window.kimberleyCamera = camera;
camera.position.set(0, 0, 6);

scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x0a0a12, 1.15));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.7); keyLight.position.set(2.5, 4, 4); scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8fb4ff, 0.9); rimLight.position.set(-3, 1.5, -4); scene.add(rimLight);

const holder = new THREE.Group();
scene.add(holder);

let astro = null;
let mats = [];
let kimShoulder = null, kimElbow = null;
const ctrlAstro = { size: 0.78, face: 3.83 };
const ctrlArm = { shoulder: 0.35, shoulderSign: 1, elbowUp: 1.7, elbowSign: 1, swing: 0.5, speed: 7.5, palmYaw: 0.6, palmRoll: -0.4, leftDown: -0.8, leftOut: 1.0 };
const KIM_UPPERARM = [
  'group1907831520', 'group139908371', 'group1310595050', 'group1369611446', 'group450518597'
];
const KIM_FOREARM = [
  'group1138436095', 'group734772326', 'group1167954657', 'group2060591166',
  'group1934812181', 'group828877529', 'group1572698854', 'group1042580755',
  'group925645544', 'group1217407763', 'group1163682321', 'group1423311402',
  'group104451256', 'group1188494358', 'group1921399779', 'group584895319',
  'group11481041', 'group1679735649'
];
const KIM_SHOULDER = new THREE.Vector3(0.06, 0.25, 0.19);
const KIM_ELBOW = new THREE.Vector3(0.16, 0.12, 0.21);
let kimLeftArm = null, kimLeftLeg = null, kimRightLeg = null;
const ctrlLimb = { float: 0.20, speed: 2.0 };
const ctrlTumble = { spin: 1.0, drift: 1.0 };
const ctrlHead = { amt: 0.09 };
const KIM_LEFTARM = [
  'group282412729', 'group1707873932', 'group1506934965',
  'group762855551', 'group1514672780', 'group1203591074',
  'group276692338', 'group505957385', 'group2143627782', 'group279303741',
  'group1564631837', 'group2056735301', 'group1015039822', 'group1437890092',
  'group2057329393', 'group1585682906', 'group986243464', 'group790332696',
  'group456711604', 'group654761556', 'group1852607879', 'group1614853819',
  'group332540088'
];
const KIM_LEFTLEG = [
  'group1440063915', 'group503988050', 'group332686008', 'group797940765',
  'group989277149', 'group255140077', 'group1808813520', 'group524469484',
  'group279101508', 'group954316612', 'group724382726', 'group1277767469'
];
const KIM_RIGHTLEG = [
  'group42438703', 'group247475039', 'group1602554113', 'group1896148415',
  'group991616414', 'group314405485', 'group1481515652', 'group1830018461',
  'group2129567275', 'group373555577', 'group781958242', 'group1596727529'
];
const KIM_LSHOULDER = new THREE.Vector3(-0.20, 0.24, -0.10);
const KIM_LHIP = new THREE.Vector3(-0.25, -0.20, 0.05);
const KIM_RHIP = new THREE.Vector3(0.11, -0.18, 0.12);
let kimHead = null;
const KIM_HEAD = ['group666895494', 'group1307457211', 'group638132290'];
const KIM_NECK = new THREE.Vector3(-0.05, 0.32, -0.02);

window.kimberleyLoadAstronaut = () => {
window.kimberleyLoadAstronaut = () => {};
new GLTFLoader().load('assets/models/astronaut.glb', (gltf) => {
  const obj = gltf.scene;
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  obj.position.sub(center);
  const wrap = new THREE.Group();
  wrap.add(obj);
  wrap.scale.setScalar(2.6 / (size.y || 1));
  holder.add(wrap);
  astro = wrap;
  window.kimberleyAstro = wrap;
  obj.traverse((n) => {
    if (n.isMesh && n.material) {
      const arr = Array.isArray(n.material) ? n.material : [n.material];
      arr.forEach((m) => { m.transparent = true; if (mats.indexOf(m) === -1) mats.push(m); });
    }
  });
  obj.updateMatrixWorld(true);
  const makePivot = (worldPos) => { const g = new THREE.Group(); g.position.copy(worldPos); obj.add(g); return g; };
  const shoulder = makePivot(KIM_SHOULDER);
  const elbow = makePivot(KIM_ELBOW);
  const larm = makePivot(KIM_LSHOULDER);
  const lleg = makePivot(KIM_LHIP);
  const rleg = makePivot(KIM_RHIP);
  const head = makePivot(KIM_NECK);
  obj.updateMatrixWorld(true);
  const attachTo = (pivot, names) => names.forEach((nm) => { const m = obj.getObjectByName(nm); if (m) pivot.attach(m); });
  attachTo(elbow, KIM_FOREARM);
  attachTo(shoulder, KIM_UPPERARM);
  shoulder.attach(elbow);
  attachTo(larm, KIM_LEFTARM);
  attachTo(lleg, KIM_LEFTLEG);
  attachTo(rleg, KIM_RIGHTLEG);
  attachTo(head, KIM_HEAD);
  kimShoulder = shoulder; kimElbow = elbow;
  kimLeftArm = larm; kimLeftLeg = lleg; kimRightLeg = rleg; kimHead = head;
}, (e) => { if (window.kimberleyLabsBytes) window.kimberleyLabsBytes('astronaut', e.loaded, e.total); },
   (err) => { console.warn('astronaut load failed', err); if (window.kimberleyLabsBytes) window.kimberleyLabsBytes('astronaut', 1, 1); });
};

const setOpacity = (o) => { for (let i = 0; i < mats.length; i++) mats[i].opacity = o; };
const smooth = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
const smoothstep = (a, b, x) => { let t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const earthPivot = new THREE.Group(); scene.add(earthPivot);
const marsPivot = new THREE.Group(); scene.add(marsPivot);
const rocketPivot = new THREE.Group(); rocketPivot.visible = false; scene.add(rocketPivot);
let earthObj = null, marsObj = null, rocketObj = null, earthMats = [];
const kimberleyLoadPlanet = (url, pivot, onDone) => {
  new GLTFLoader().load(url, (gltf) => {
    const o = gltf.scene;
    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    o.position.sub(center);
    o.scale.setScalar(1.0 / (Math.max(size.x, size.y, size.z) || 1));
    pivot.add(o);
    if (window.kimberleyLabsBytes) window.kimberleyLabsBytes(url, 1, 1);
    onDone(o);
  }, (e) => { if (window.kimberleyLabsBytes) window.kimberleyLabsBytes(url, e.loaded, e.total); },
     (err) => { console.warn('planet load failed', url, err); if (window.kimberleyLabsBytes) window.kimberleyLabsBytes(url, 1, 1); });
};
window.kimberleyLoadPlanets = () => {
  window.kimberleyLoadPlanets = () => {};
  kimberleyLoadPlanet('assets/models/earth.glb', earthPivot, (o) => {
    earthObj = o;
    o.traverse((n) => { if (n.isMesh && n.material) { const ms = Array.isArray(n.material) ? n.material : [n.material]; for (let k = 0; k < ms.length; k++) earthMats.push(ms[k]); } });
  });
  setTimeout(() => kimberleyLoadPlanet('assets/models/mars.glb', marsPivot, (o) => { marsObj = o; }), 700);
};
const KIMBERLEY_ROCKET = false;
if (KIMBERLEY_ROCKET) kimberleyLoadPlanet('assets/models/Rocket.glb', rocketPivot, (o) => {
  rocketObj = o;
  o.rotation.set(-Math.PI / 2, 0, 0);
});

const asteroidGeo = new THREE.IcosahedronGeometry(1.0, 1);
{ const ap = asteroidGeo.attributes.position, av = new THREE.Vector3(); for (let i = 0; i < ap.count; i++) { av.fromBufferAttribute(ap, i); av.multiplyScalar(0.72 + Math.random() * 0.5); ap.setXYZ(i, av.x, av.y, av.z); } asteroidGeo.computeVertexNormals(); }
const asteroid = new THREE.Mesh(asteroidGeo, new THREE.MeshStandardMaterial({ color: 0x7a4a34, emissive: 0x2a0d05, emissiveIntensity: 0.5, roughness: 1.0, metalness: 0.0, flatShading: true }));
asteroid.visible = false; scene.add(asteroid);

const shardGroup = new THREE.Group(); shardGroup.visible = false; scene.add(shardGroup);
const shardGeo = new THREE.TetrahedronGeometry(0.28);
const shards = [];
for (let i = 0; i < 40; i++) {
  const m = new THREE.Mesh(shardGeo, new THREE.MeshStandardMaterial({ color: 0x2f6ea6, emissive: 0xff2a08, emissiveIntensity: 0, roughness: 0.7, metalness: 0.1, transparent: true, opacity: 1 }));
  m.visible = false; shardGroup.add(m);
  const th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1);
  shards.push({ mesh: m, dx: Math.sin(ph) * Math.cos(th), dy: Math.sin(ph) * Math.sin(th) * 0.8, dz: Math.abs(Math.cos(ph)) * 0.7 + 0.5, sp: 3.5 + Math.random() * 5.5, sz: Math.random() * 0.7, rx: Math.random() * 2 - 1, ry: Math.random() * 2 - 1, rz: Math.random() * 2 - 1 });
}
const shockRing = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 56), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
shockRing.visible = false; scene.add(shockRing);

const dustGeo = new THREE.BufferGeometry();
const dustN = 220, dustPos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() * 2 - 1) * 14; dustPos[i * 3 + 1] = (Math.random() * 2 - 1) * 9; dustPos[i * 3 + 2] = -18 + Math.random() * 22; }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xbcd0ff, size: 0.05, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
scene.add(dust);
const camEase = new THREE.Vector3(0, 0, 6), lookEase = new THREE.Vector3(0, 0, 0);

const resizeAstro = () => {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener('resize', resizeAstro);
resizeAstro();

let dragging = false, lastX = 0, lastY = 0;
let userYaw = 0, userPitch = 0, canOrbit = false, idleAmt = 1;
let kickX = 0, kickY = 0, kickVX = 0, kickVY = 0, kickPulse = 0;
let astroHover = 0, earthHover = 0;
const _projV = new THREE.Vector3();
const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
let overAstro = false;
const hitAstro = (e) => {
  if (!astro) return false;
  _ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
  _ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
  _ray.setFromCamera(_ndc, camera);
  return _ray.intersectObject(astro, true).length > 0;
};
astroCanvas.addEventListener('pointerdown', (e) => {
  if (!canOrbit || !hitAstro(e)) return;
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  try { astroCanvas.setPointerCapture(e.pointerId); } catch (err) {}
});
window.addEventListener('pointermove', (e) => {
  if (!dragging) {
    overAstro = canOrbit && hitAstro(e);
    return;
  }
  userYaw += (e.clientX - lastX) * 0.0016;
  userPitch += (e.clientY - lastY) * 0.0016;
  userPitch = Math.max(-1.1, Math.min(1.1, userPitch));
  lastX = e.clientX; lastY = e.clientY;
});
const endDrag = () => { dragging = false; };
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

let t0 = null, lastNow = null;
const tick = (now) => {
  if (t0 === null) t0 = now;
  const t = (now - t0) / 1000;
  const dt = lastNow === null ? 0.016 : Math.min((now - lastNow) / 1000, 0.05);
  lastNow = now;
  requestAnimationFrame(tick);
  if (!astro) { if ((window.kimberleyJp || 0) >= 0.08) present(); return; }

  const pos = window.kimberleyJp || 0;
  if (pos < 0.08) { renderer.clear(); return; }
  const mx = (window.kimberleyMouseX ?? 0.5) - 0.5;
  const my = (window.kimberleyMouseY ?? 0.5) - 0.5;
  const outro = window.kimberleyOutro || 0;
  const toCam = outro > 0 ? (function (a) { a = a < 0 ? 0 : a > 1 ? 1 : a; return a * a; })((outro - 0.10) / 0.52) : 0;
  const astroVanish = outro > 0 ? Math.max(0, Math.min(1, (outro - 0.55) / 0.09)) : 0;

  const fly      = smooth((pos - 0.28) / 0.24);
  const flyE     = 1 - (1 - fly) * (1 - fly);
  const flyBack  = 1 - smooth((fly - 0.65) / 0.35);
  const flyMove  = smooth(fly / 0.5) * flyBack;
  const enter    = smoothstep(0.50, 0.64, pos);
  const traverse = smoothstep(0.62, 0.80, pos);
  const settle   = smoothstep(0.79, 0.89, pos);
  const turb     = traverse * (1 - settle);

  const pulseNow = window.kimberleyKickPulse || 0;
  if (pulseNow !== kickPulse) {
    kickPulse = pulseNow;
    if (settle > 0.3) {
      const cnx = window.kimberleyKickNX == null ? 0.5 : window.kimberleyKickNX;
      const cny = window.kimberleyKickNY == null ? 0.5 : window.kimberleyKickNY;
      let dxk = 0.30 - cnx, dyk = 0.35 - cny;
      const lk = Math.hypot(dxk, dyk) + 1e-3;
      const kickAmp = 0.55 + smoothstep(1.0, 1.2, pos) * 1.1;
      kickVX += (dxk / lk) * kickAmp;
      kickVY += (dyk / lk) * kickAmp;
    }
  }
  kickVX += (-14.0 * kickX - 4.0 * kickVX) * dt;
  kickVY += (-14.0 * kickY - 4.0 * kickVY) * dt;
  kickX += kickVX * dt;
  kickY += kickVY * dt;

  canOrbit = settle > 0.5 && (window.kimberleyEnd || 0) < 0.001;
  if (!canOrbit) dragging = false;
  astroCanvas.style.pointerEvents = canOrbit ? 'auto' : 'none';
  astroCanvas.style.cursor = dragging ? 'grabbing' : (canOrbit && overAstro ? 'grab' : 'default');
  if (!dragging) {
    const back = Math.min(1, dt * 0.7);
    userYaw += (0 - userYaw) * back;
    userPitch += (0 - userPitch) * back;
  }
  idleAmt += ((dragging ? 0.3 : 1.0) - idleAmt) * Math.min(1, dt * 2.5);
  const idle = settle * idleAmt;
  const wRoll = window.wormWindRoll || 0;
  const wBendX = window.wormWindBendX || 0;
  const wBendY = window.wormWindBendY || 0;

  const flightZ = -4.0;
  const flyXk = smooth(fly / 0.55), flyZk = smooth((fly - 0.35) / 0.65);
  const flyX = 3.0 * (1 - flyXk), flyY = 0.5 * (1 - flyZk), flyZ = 4.8 * (1 - flyZk);
  const drift = turb * ctrlTumble.drift;
  const spin = turb * ctrlTumble.spin;
  const spaceX = settle * -1.6;
  holder.position.z = flyZ + flightZ * enter + (1.0 - flightZ) * settle + (Math.sin(t * 2.0) * 0.5 + Math.sin(t * 1.3 + 1.0) * 0.3) * drift;
  holder.position.y = flyY + Math.sin(t * 3.2 + 1.0) * 0.22 * flyMove + (Math.sin(t * 1.8) * 0.45 + Math.sin(t * 1.1 + 0.6) * 0.25) * drift + (Math.sin(t * 0.6) * 0.10 + Math.sin(t * 0.23 + 1.3) * 0.05) * idle + wBendY * 0.30;
  holder.position.x = flyX + Math.sin(t * 4.0) * 0.30 * flyMove + (Math.sin(t * 2.6) * 1.1 + Math.sin(t * 1.5 + 2.0) * 0.5) * drift + Math.sin(t * 0.4 + 1.0) * 0.10 * idle + wBendX * 0.5 + spaceX;
  holder.position.x += kickX;
  holder.position.y += kickY;

  const backAmt = enter * (1 - settle);
  const baseYaw = ctrlAstro.face + Math.PI * (backAmt + flyBack);
  holder.rotation.y = baseYaw + flyMove * Math.sin(t * 2.2) * 0.30 + spin * (Math.sin(t * 2.4) * 1.1 + Math.sin(t * 1.25) * 0.6) + userYaw * settle + Math.sin(t * 0.35) * 0.06 * idle + wBendX * 0.12;
  holder.rotation.x = Math.sin(t * 0.8) * 0.03 + flyMove * Math.sin(t * 2.8) * 0.38 + spin * (Math.sin(t * 3.2) * 1.5 + Math.sin(t * 2.1 + 0.7) * 0.6) + userPitch * settle + Math.sin(t * 0.5 + 2.0) * 0.05 * idle;
  holder.rotation.z = Math.sin(t * 0.55) * 0.02 + flyMove * (Math.sin(t * 3.5) * 0.5 + 0.35) + spin * (Math.sin(t * 1.8) * 2.2 + Math.cos(t * 2.9) * 1.1) + Math.sin(t * 0.28) * 0.07 * idle + wRoll * 0.5 + (1 - flyE) * 0.5;

  const cu = window.kimberleyCloseIn || 0;
  const endSwap = window.kimberleyEndSwap || 0;
  const aliveAmt = settle * (1 - outro) * (1 - cu * 0.85) * (1 - endSwap);
  holder.rotation.y += (Math.sin(t * 0.16) * 0.20 + Math.sin(t * 0.093 + 1.3) * 0.11) * aliveAmt;
  holder.rotation.x += (Math.sin(t * 0.12 + 0.7) * 0.13 + Math.cos(t * 0.20) * 0.05) * aliveAmt;
  holder.rotation.z += (Math.sin(t * 0.10 + 2.0) * 0.10) * aliveAmt;
  if (endSwap > 0.001) {
    holder.rotation.y += (4.55 - holder.rotation.y) * endSwap;
    holder.rotation.x += (0 - holder.rotation.x) * endSwap * 0.7;
    holder.rotation.z += (0 - holder.rotation.z) * endSwap * 0.7;
  }
  holder.position.x += Math.sin(t * 0.14 + 0.5) * 0.14 * aliveAmt;
  holder.position.y += Math.cos(t * 0.11 + 1.0) * 0.11 * aliveAmt;

  const sceneOut = window.kimberleyEnd || 0;
  const dEarth = window.kimberleyRocket || 0;
  holder.scale.setScalar(ctrlAstro.size * (1 + astroHover * 0.06) * (1 + toCam * 3.0) * (1 - dEarth * 0.4 * (1 - outro)));

  const camArc = Math.sin(cu * Math.PI);
  let camX = (-0.35 + camArc * 0.60) * cu;
  let camY = (0.30 + camArc * 0.22) * cu;
  let camZ = (6.0 + (2.9 - 6.0) * cu) - endSwap * 1.1 * cu;
  let lookX = -1.20 * cu, lookY = (0.30 + endSwap * 0.32) * cu, lookZ = 1.0 * cu;
  camX += Math.sin(t * 0.5) * 0.06 * cu;
  camY += Math.sin(t * 0.4 + 1.0) * 0.05 * cu;
  const spaceHold = settle * (1 - cu) * (1 - sceneOut);
  if (spaceHold > 0.001) {
    const az = Math.sin(t * 0.13) * 0.55 + Math.sin(t * 0.071 + 1.0) * 0.28 + (window.kimberleyScrollAz || 0);
    const el = Math.sin(t * 0.09 + 0.5) * 0.16;
    const ce = Math.cos(el), rad = 6.0;
    camX += (Math.sin(az) * ce * rad) * spaceHold;
    camY += (Math.sin(el) * rad) * spaceHold;
    camZ += (Math.cos(az) * ce * rad - 6.0) * spaceHold;
    lookX += Math.sin(t * 0.06) * 0.25 * spaceHold;
    lookY += Math.sin(t * 0.05 + 1.0) * 0.15 * spaceHold;
  }
  if (sceneOut > 0.0001) {
    camX += (1.6 - camX) * sceneOut;
    camY += (0.4 - camY) * sceneOut;
    camZ += (15.0 - camZ) * sceneOut;
    lookX += (1.6 - lookX) * sceneOut;
    lookY += (0.4 - lookY) * sceneOut;
    lookZ += (1.0 - lookZ) * sceneOut;
    const camSweep = Math.sin(sceneOut * Math.PI);
    camX += camSweep * -2.6;
    camY += camSweep * 1.3;
    lookX += camSweep * 0.4;
  }
  const endDrift = sceneOut * (1 - outro);
  if (endDrift > 0.001) {
    camX += Math.sin(t * 0.08) * 0.5 * endDrift;
    camY += Math.sin(t * 0.061 + 1.0) * 0.3 * endDrift;
    lookX += Math.sin(t * 0.05) * 0.15 * endDrift;
  }
  if (outro > 0.001) camZ += toCam * -1.0;
  const camLerp = Math.min(1, dt * 3.0);
  camEase.x += (camX - camEase.x) * camLerp;
  camEase.y += (camY - camEase.y) * camLerp;
  camEase.z += (camZ - camEase.z) * camLerp;
  lookEase.x += (lookX - lookEase.x) * camLerp;
  lookEase.y += (lookY - lookEase.y) * camLerp;
  lookEase.z += (lookZ - lookEase.z) * camLerp;
  let camShX = 0, camShY = 0;
  if (outro > 0.001) {
    const shake = Math.max(0, 1 - Math.abs(outro - 0.31) / 0.07);
    camShX = shake * 0.18 * Math.sin(t * 77.0);
    camShY = shake * 0.14 * Math.cos(t * 83.0);
  }
  camera.position.set(camEase.x + camShX, camEase.y + camShY, camEase.z);
  camera.lookAt(lookEase.x, lookEase.y, lookEase.z);
  camera.updateMatrixWorld();
  if (cu > 0.0001) { holder.position.x -= mx * 0.5 * cu; holder.position.x -= cu * 0.35; }
  holder.position.x += dEarth * 4.5;
  holder.position.y += dEarth * -0.3;
  holder.position.z += dEarth * -2.5;
  if (sceneOut > 0.0001) {
    const faceUs = smoothstep(0.04, 0.30, outro);
    holder.rotation.y += Math.PI * dEarth * (1 - faceUs);
    holder.rotation.x += 0.35 * dEarth * (1 - faceUs);
  }

  const mNdcX = mx * 2, mNdcY = my * 2;
  let aLeanX = 0, aLeanY = 0, aTarget = 0;
  if (sceneOut > 0.001) {
    _projV.set(holder.position.x, holder.position.y, holder.position.z).project(camera);
    aLeanX = mNdcX - _projV.x; aLeanY = mNdcY - _projV.y;
    aTarget = Math.max(0, 1 - Math.hypot(aLeanX, aLeanY) / 0.6) * sceneOut;
  }
  astroHover += (aTarget - astroHover) * Math.min(1, dt * 4.0);
  holder.position.x += aLeanX * 0.5 * astroHover;
  holder.position.y += aLeanY * 0.5 * astroHover;
  if (outro > 0.001) {
    holder.position.x += (1.2 - holder.position.x) * toCam;
    holder.position.y += (0.3 - holder.position.y) * toCam;
    holder.position.z += (13.0 - holder.position.z) * toCam;
  }

  if (earthObj) {
    const ek = sceneOut;
    earthPivot.position.set(6.6 + (1 - sceneOut) * 5.0, -0.3, 0.0);
    _projV.set(earthPivot.position.x, earthPivot.position.y, earthPivot.position.z).project(camera);
    const eTarget = ek > 0.001 ? Math.max(0, 1 - Math.hypot(mNdcX - _projV.x, mNdcY - _projV.y) / 0.6) * ek : 0;
    earthHover += (eTarget - earthHover) * Math.min(1, dt * 4.0);
    earthPivot.scale.setScalar(ek * 1.0 * (1 + earthHover * 0.14));
    earthPivot.rotation.y += dt * 0.05 * (1 + earthHover * 2.5);
    const heat = outro > 0 ? Math.max(0, Math.min(1, (outro - 0.12) / 0.18)) : 0;
    for (let i = 0; i < earthMats.length; i++) { const em = earthMats[i]; if (em.emissive) { em.emissive.setRGB(heat, heat * 0.12, 0.0); em.emissiveIntensity = heat * 1.8; } }
    earthObj.visible = outro < 0.30;
  }
  if (marsObj) {
    const mk = sceneOut;
    marsPivot.position.set(7.4 + (1 - sceneOut) * 5.0, 3.5, -9.0);
    marsPivot.scale.setScalar(0.6 * mk);
    marsPivot.rotation.y += dt * 0.06;
  }
  if (rocketObj) {
    const rk = window.kimberleyRocket || 0;
    rocketPivot.visible = rk > 0.001 && outro < 0.14;
    if (rocketPivot.visible) {
      const tx = holder.position.x, ty = holder.position.y, tz = holder.position.z;
      const ease = rk;
      const SX = 9.0, SY = 5.0, SZ = -26.0;
      rocketPivot.position.set(
        SX + ((tx + 1.3) - SX) * ease,
        SY + ((ty + 0.7) - SY) * ease,
        SZ + ((tz - 1.0) - SZ) * ease
      );
      rocketPivot.scale.setScalar(0.10 + 0.42 * ease);
      rocketPivot.lookAt(tx, ty, tz);
      rocketPivot.rotateZ(Math.sin(t * 0.6) * 0.06);
    }
  }

  const EPX = 6.6, EPY = -0.3, EPZ = 0.0;
  if (outro > 0.001) {
    const appr = Math.max(0, Math.min(1, outro / 0.30)), apprE = appr * appr;
    asteroid.visible = outro < 0.32;
    asteroid.position.set(12.0 + (EPX - 12.0) * apprE, 7.5 + (EPY - 7.5) * apprE, -3.0 + (EPZ + 3.0) * apprE);
    asteroid.scale.setScalar(0.35 + 0.28 * apprE);
    asteroid.rotation.x += dt * 3.0; asteroid.rotation.y += dt * 2.2;

    const burst = Math.max(0, Math.min(1, (outro - 0.30) / 0.40)), be = 1 - (1 - burst) * (1 - burst);
    shardGroup.visible = burst > 0;
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i], m = s.mesh;
      m.visible = burst > 0;
      m.position.set(EPX + s.dx * be * s.sp, EPY + s.dy * be * s.sp, EPZ + s.dz * be * s.sp);
      m.rotation.set(s.rx * be * 6, s.ry * be * 6, s.rz * be * 6);
      m.scale.setScalar(Math.max(0.01, (0.6 + s.sz) * (1 - burst * 0.5)));
      const glow = 1 - burst;
      if (m.material.emissive) { m.material.emissive.setRGB(glow, glow * 0.18, glow * 0.05); m.material.emissiveIntensity = 0.4 + glow * 2.2; }
      m.material.opacity = 1 - Math.max(0, (burst - 0.7) / 0.3);
    }

    const ringP = Math.max(0, Math.min(1, (outro - 0.30) / 0.32));
    shockRing.visible = ringP > 0 && ringP < 1;
    if (shockRing.visible) {
      shockRing.position.set(EPX, EPY, EPZ + 0.2);
      shockRing.lookAt(camera.position);
      shockRing.scale.setScalar(0.3 + ringP * 9.0);
      shockRing.material.opacity = (1 - ringP) * 0.85;
    }
  } else {
    asteroid.visible = false; shardGroup.visible = false; shockRing.visible = false;
  }

  if (kimShoulder) {
    const lf = ctrlLimb.float;
    const sp = ctrlLimb.speed;
    const restCut = 1 - settle * 0.4;
    const outroFlail = outro > 0 ? Math.max(0, Math.min(1, (outro - 0.26) / 0.12)) * (1 - astroVanish) : 0;
    const postWave = smoothstep(0.64, 0.74, pos) * (1 - settle);
    const flail = Math.max(postWave, outroFlail);
    const swimAway = sceneOut * (1 - outro);
    const fA = Math.sin(t * 7.0) * 0.8 + Math.sin(t * 4.3 + 1.1) * 0.4;
    const fB = Math.sin(t * 6.2 + 2.0) * 0.8 + Math.cos(t * 4.9 + 0.5) * 0.4;
    const fC = Math.sin(t * 7.6 + 0.7) * 0.75 + Math.sin(t * 4.1 + 3.0) * 0.35;
    const fD = Math.cos(t * 6.7 + 1.4) * 0.8 + Math.sin(t * 5.2 + 2.2) * 0.35;
    const drive = 1 + turb * 2.2 + flyMove * 2.0 + outroFlail * 1.5;
    const legAmp = lf * restCut * drive;
    const greet = smoothstep(0.45, 0.50, pos) * (1 - smoothstep(0.72, 0.80, pos));
    const rock = greet * ctrlArm.swing * Math.sin(t * ctrlArm.speed);
    const swimZ = turb * (Math.sin(t * 3.0) * 0.7 + Math.sin(t * 1.7 + 1.0) * 0.4);
    const swimY = turb * (Math.sin(t * 2.4 + 0.5) * 0.6 + Math.cos(t * 3.6) * 0.35);
    const swimX = turb * (Math.sin(t * 3.4) * 0.6 + Math.sin(t * 1.9 + 2.0) * 0.35);
    const flyArm = flyMove * Math.sin(t * 3.2) * 0.5;
    const flyKick = flyMove * (Math.sin(t * 8.0) * 0.7 + Math.sin(t * 5.0 + 0.6) * 0.35);
    const armFloat = lf * restCut * (1 + turb * 1.0) * (Math.sin(t * sp * 1.2 + 0.9) + 0.4 * Math.sin(t * sp * 2.1 + 2.2));

    kimShoulder.rotation.z = ctrlArm.shoulderSign * greet * ctrlArm.shoulder + swimZ * 0.7 + flyArm + armFloat * 0.6 + flail * fA * 0.5;
    kimShoulder.rotation.x = swimX * 0.7 + flyMove * Math.sin(t * 2.4) * 0.4 + armFloat + flail * fB * 0.45;
    kimShoulder.rotation.y = swimY * 0.6 + lf * 0.5 * Math.sin(t * sp * 0.9 + 1.2) + flail * fC * 0.3;
    kimElbow.rotation.z = ctrlArm.elbowSign * greet * ctrlArm.elbowUp + swimZ * 0.6 + armFloat * 0.4 + flail * fC * 0.55;
    kimElbow.rotation.y = greet * ctrlArm.palmYaw + rock + swimY * 0.6 + flail * fD * 0.4;
    kimElbow.rotation.x = greet * ctrlArm.palmRoll + swimX * 0.6 + armFloat * 0.5 + flail * fA * 0.45;

    kimLeftArm.rotation.x = settle * ctrlArm.leftDown + legAmp * (Math.sin(t * sp * 1.3 + 0.4) + 0.5 * Math.sin(t * sp * 2.4 + 1.1)) + flail * fB * 0.5;
    kimLeftArm.rotation.z = legAmp * 0.7 * Math.sin(t * sp * 1.0 + 1.7) + swimX * 0.5 + flail * fA * 0.45;
    kimLeftArm.rotation.y = settle * ctrlArm.leftOut + swimY * 0.5 + flail * fD * 0.3;
    kimLeftLeg.rotation.x = legAmp * (Math.sin(t * sp * 1.1 + 2.1) + 0.4 * Math.sin(t * sp * 2.0 + 0.3)) + flail * fC * 0.55 + flyKick;
    kimLeftLeg.rotation.z = legAmp * 0.5 * Math.sin(t * sp * 1.3 + 0.6) + flail * fD * 0.35 + flyMove * Math.sin(t * 6.0 + 0.5) * 0.3;
    kimRightLeg.rotation.x = legAmp * (Math.sin(t * sp * 1.2 + 3.4) + 0.4 * Math.sin(t * sp * 2.2 + 1.5)) + flail * fD * 0.55 - flyKick;
    kimRightLeg.rotation.z = legAmp * 0.5 * Math.sin(t * sp * 1.25 + 2.8) + flail * fC * 0.35 - flyMove * Math.sin(t * 6.0 + 0.5) * 0.3;

    const ha = ctrlHead.amt;
    kimHead.rotation.y = ha * Math.sin(t * 0.7 + 0.3) + mx * 0.15 * settle + swimY * 0.25 + flail * fB * 0.2;
    kimHead.rotation.x = ha * 0.8 * Math.sin(t * 0.9 + 1.1) + my * 0.12 * settle + swimX * 0.25 + flail * fA * 0.18;
    kimHead.rotation.z = ha * 0.5 * Math.sin(t * 0.5 + 2.0) + wRoll * 0.1 + flail * fC * 0.15;

    if (swimAway > 0.001) {
      const kick = Math.sin(t * 3.0);
      kimShoulder.rotation.z += swimAway * (Math.sin(t * 2.2) * 0.5 + 0.35);
      kimShoulder.rotation.x += swimAway * Math.sin(t * 1.9 + 1.0) * 0.4;
      kimElbow.rotation.z += swimAway * (Math.sin(t * 2.2 + 0.8) * 0.45 + 0.4);
      kimLeftArm.rotation.x += swimAway * (Math.sin(t * 2.0 + 1.5) * 0.45 - 0.3);
      kimLeftArm.rotation.z += swimAway * Math.sin(t * 1.8 + 0.5) * 0.4;
      kimLeftLeg.rotation.x += swimAway * kick * 0.7;
      kimRightLeg.rotation.x += swimAway * -kick * 0.7;
      kimLeftLeg.rotation.z += swimAway * Math.sin(t * 3.0 + 0.5) * 0.22;
      kimRightLeg.rotation.z += swimAway * -Math.sin(t * 3.0 + 0.5) * 0.22;
      kimHead.rotation.x += swimAway * 0.2;
    }
  }

  const spaceVis = smoothstep(0.80, 0.92, pos) * (1 - Math.min(1, outro * 3.0));
  dust.visible = spaceVis > 0.001;
  dust.material.opacity = 0.32 * spaceVis;
  dust.rotation.y += dt * 0.012;
  dust.rotation.x += dt * 0.005;

  const arrFlashHide = Math.pow(Math.sin(Math.max(0, Math.min(1, (pos - 0.80) / 0.10)) * Math.PI), 2.0);
  const op = smoothstep(0.26, 0.34, pos) * (1 - astroVanish) * (1 - arrFlashHide);
  setOpacity(op);
  astro.visible = op > 0.001;

  present();
};
requestAnimationFrame(tick);
