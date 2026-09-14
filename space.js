import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CONFIG = {
    backdrop: 'assets/video/space-backdrop.mp4',
    model: 'assets/models/astronaut.glb',
    modelScale: 1.0,
    scrollVh: 540,
    beats: [],
    views: [
        { p: 0.00, az: 0.00, el: 0.05, dist: 5.0 },
        { p: 0.16, az: -0.55, el: 0.02, dist: 4.2 },
        { p: 0.40, az: 0.95, el: 0.30, dist: 3.6 },
        { p: 0.64, az: -1.05, el: -0.28, dist: 3.4 },
        { p: 0.88, az: 0.60, el: 0.14, dist: 4.4 },
        { p: 1.00, az: 0.00, el: 0.10, dist: 5.0 },
    ],
};

const RIG = {
    face: 3.83,
    float: 0.20,
    speed: 2.0,
    head: 0.09,
    leftArmDown: -0.8,
    leftArmOut: 1.0,
};

const JOINTS = {
    shoulder: [0.06, 0.25, 0.19],
    elbow: [0.16, 0.12, 0.21],
    leftArm: [-0.20, 0.24, -0.10],
    leftLeg: [-0.25, -0.20, 0.05],
    rightLeg: [0.11, -0.18, 0.12],
    head: [-0.05, 0.32, -0.02],
};

const GROUPS = {
    upperArm: ['group1907831520', 'group139908371', 'group1310595050', 'group1369611446', 'group450518597'],
    foreArm: [
        'group1138436095', 'group734772326', 'group1167954657', 'group2060591166',
        'group1934812181', 'group828877529', 'group1572698854', 'group1042580755',
        'group925645544', 'group1217407763', 'group1163682321', 'group1423311402',
        'group104451256', 'group1188494358', 'group1921399779', 'group584895319',
        'group11481041', 'group1679735649',
    ],
    leftArm: [
        'group282412729', 'group1707873932', 'group1506934965',
        'group762855551', 'group1514672780', 'group1203591074',
        'group276692338', 'group505957385', 'group2143627782', 'group279303741',
        'group1564631837', 'group2056735301', 'group1015039822', 'group1437890092',
        'group2057329393', 'group1585682906', 'group986243464', 'group790332696',
        'group456711604', 'group654761556', 'group1852607879', 'group1614853819',
        'group332540088',
    ],
    leftLeg: [
        'group1440063915', 'group503988050', 'group332686008', 'group797940765',
        'group989277149', 'group255140077', 'group1808813520', 'group524469484',
        'group279101508', 'group954316612', 'group724382726', 'group1277767469',
    ],
    rightLeg: [
        'group42438703', 'group247475039', 'group1602554113', 'group1896148415',
        'group991616414', 'group314405485', 'group1481515652', 'group1830018461',
        'group2129567275', 'group373555577', 'group781958242', 'group1596727529',
    ],
    head: ['group666895494', 'group1307457211', 'group638132290'],
};

const spaceEl = document.getElementById('space');
const glCanvas = document.getElementById('spaceGL');
const scrollEl = document.getElementById('spaceScroll');
const spacerEl = document.getElementById('spaceSpacer');
const captionsEl = document.getElementById('spaceCaptions');

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = () => window.matchMedia('(pointer: coarse)').matches;
const getLang = () => (document.documentElement.lang === 'en' ? 'en' : 'da');

let renderer, scene, camera, clock, composer, bloomPass;
let backdropVideo, backdropTexture, stars, astronaut = null, astronautHolder, rig = null;
let rafId = 0;
let entered = false, enterAmt = 0;
let progress = 0, progressEased = 0;
let mouse = { x: 0.5, y: 0.5 }, mouseTarget = { x: 0.5, y: 0.5 };
let dragging = false, dragPX = 0, dragPY = 0;
let manualAz = 0, manualEl = 0, manualAzE = 0, manualElE = 0;
let captionEls = [];

spacerEl.style.height = CONFIG.scrollVh + 'vh';

const buildStars = () => {
    const N = coarse() ? 600 : 1100;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 64;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 42;
        pos[i * 3 + 2] = -Math.random() * 122;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: 0.07, sizeAttenuation: true,
        transparent: true, opacity: 0.85, depthWrite: false,
    });
    return new THREE.Points(geo, mat);
};

const buildScene = () => {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.013);

    backdropVideo = document.createElement('video');
    backdropVideo.src = CONFIG.backdrop;
    backdropVideo.muted = true;
    backdropVideo.loop = true;
    backdropVideo.playsInline = true;
    backdropVideo.preload = 'auto';
    backdropVideo.setAttribute('muted', '');
    backdropVideo.setAttribute('playsinline', '');
    backdropTexture = new THREE.VideoTexture(backdropVideo);
    backdropTexture.colorSpace = THREE.SRGBColorSpace;
    const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(84, 48),
        new THREE.MeshBasicMaterial({ map: backdropTexture, color: 0x2a3038, depthWrite: false })
    );
    backdrop.position.z = -28;
    scene.add(backdrop);

    stars = buildStars();
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0x8494a8, 0.14));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fa0ff, 0.85);
    rim.position.set(-4, 1, -3);
    scene.add(rim);

    astronautHolder = new THREE.Group();
    scene.add(astronautHolder);

    new GLTFLoader().load(CONFIG.model, (gltf) => {
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        const centre = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(centre);
        obj.position.sub(centre);

        const wrap = new THREE.Group();
        wrap.add(obj);
        wrap.scale.setScalar((2.0 / (size.y || 1)) * CONFIG.modelScale);
        wrap.rotation.y = RIG.face;
        astronaut = wrap;
        astronautHolder.add(wrap);

        obj.updateMatrixWorld(true);
        const joint = ([x, y, z]) => {
            const g = new THREE.Group();
            g.position.set(x, y, z);
            obj.add(g);
            return g;
        };
        const shoulder = joint(JOINTS.shoulder);
        const elbow = joint(JOINTS.elbow);
        const leftArm = joint(JOINTS.leftArm);
        const leftLeg = joint(JOINTS.leftLeg);
        const rightLeg = joint(JOINTS.rightLeg);
        const head = joint(JOINTS.head);
        obj.updateMatrixWorld(true);

        const attach = (pivot, names) => names.forEach((name) => {
            const mesh = obj.getObjectByName(name);
            if (mesh) pivot.attach(mesh);
        });
        attach(elbow, GROUPS.foreArm);
        attach(shoulder, GROUPS.upperArm);
        shoulder.attach(elbow);
        attach(leftArm, GROUPS.leftArm);
        attach(leftLeg, GROUPS.leftLeg);
        attach(rightLeg, GROUPS.rightLeg);
        attach(head, GROUPS.head);

        rig = { shoulder, elbow, leftArm, leftLeg, rightLeg, head };
    });
};

const buildCaptions = () => {
    const lang = getLang();
    captionsEl.innerHTML = '';
    captionEls = CONFIG.beats.map((b) => {
        const el = document.createElement('div');
        el.className = 'space-caption';
        el.style.top = b.y || '50%';
        el.style.transform = 'translateY(-50%)';
        if (b.side === 'right') {
            el.style.right = 'clamp(20px, 6vw, 120px)';
            el.style.textAlign = 'right';
        } else {
            el.style.left = 'clamp(20px, 6vw, 120px)';
            el.style.textAlign = 'left';
        }
        const line = document.createElement('div');
        line.className = 'space-caption-line';
        line.textContent = b[lang] || b.da;
        el.appendChild(line);
        captionsEl.appendChild(el);
        return { el, line };
    });
};

const viewAt = (p) => {
    const vs = CONFIG.views;
    if (p <= vs[0].p) return vs[0];
    const last = vs[vs.length - 1];
    if (p >= last.p) return last;
    for (let i = 0; i < vs.length - 1; i++) {
        if (p >= vs[i].p && p <= vs[i + 1].p) {
            const a = vs[i], b = vs[i + 1];
            const k0 = clamp01((p - a.p) / (b.p - a.p));
            const k = k0 * k0 * (3 - 2 * k0);
            return { az: lerp(a.az, b.az, k), el: lerp(a.el, b.el, k), dist: lerp(a.dist, b.dist, k) };
        }
    }
    return last;
};

const resize = () => {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse() ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (composer) {
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(w, h);
    }
    if (bloomPass) bloomPass.setSize(w, h);
};

const setup = () => {
    renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.55;

    camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 400);
    camera.position.set(0, 0.9, 13.0);
    clock = new THREE.Clock();

    buildScene();

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    buildCaptions();

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.55, 0.9);
    composer.addPass(bloomPass);

    resize();
};

const applyReveal = (emerge) => {
    if (reduced()) return;
    if (emerge >= 0.999) {
        if (spaceEl.style.maskImage) {
            spaceEl.style.maskImage = '';
            spaceEl.style.webkitMaskImage = '';
        }
        return;
    }
    const feather = 0.16;
    const risen = emerge * (1 + feather);
    const solid = clamp01(risen - feather) * 100;
    const edge = clamp01(risen) * 100;
    const mask = 'linear-gradient(to top, #000 0%, #000 ' + solid.toFixed(1) + '%, rgba(0,0,0,0) ' + edge.toFixed(1) + '%, rgba(0,0,0,0) 100%)';
    spaceEl.style.maskImage = mask;
    spaceEl.style.webkitMaskImage = mask;
};

const draw = () => {
    rafId = requestAnimationFrame(draw);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    enterAmt += ((entered ? 1 : 0) - enterAmt) * (reduced() ? 1 : 0.022);
    const emerge = enterAmt * enterAmt * (3 - 2 * enterAmt);
    applyReveal(emerge);

    const range = scrollEl.scrollHeight - scrollEl.clientHeight;
    progress = clamp01(range > 0 ? scrollEl.scrollTop / range : 0);
    progressEased += (progress - progressEased) * (reduced() ? 1 : 0.08);
    const p = progressEased;

    mouse.x += (mouseTarget.x - mouse.x) * 0.06;
    mouse.y += (mouseTarget.y - mouse.y) * 0.06;
    const mx = reduced() ? 0 : mouse.x - 0.5;
    const my = reduced() ? 0 : mouse.y - 0.5;

    if (stars) {
        const speed = (reduced() ? 0 : 2.4 + p * 15 + (1 - emerge) * 46) * dt;
        const arr = stars.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
            arr[i + 2] += speed;
            if (arr[i + 2] > 6) arr[i + 2] -= 128;
        }
        stars.geometry.attributes.position.needsUpdate = true;
        stars.material.opacity = 0.35 + 0.5 * clamp01(enterAmt);
    }

    if (astronaut) {
        const at = reduced() ? 0 : t;

        astronautHolder.rotation.y = Math.sin(at * 0.16) * 0.20 + Math.sin(at * 0.093 + 1.3) * 0.11
            + Math.sin(at * 0.35) * 0.06 + mx * 0.30;
        astronautHolder.rotation.x = Math.sin(at * 0.12 + 0.7) * 0.13 + Math.cos(at * 0.20) * 0.05
            + Math.sin(at * 0.5 + 2.0) * 0.05 + my * 0.18;
        astronautHolder.rotation.z = Math.sin(at * 0.10 + 2.0) * 0.10 + Math.sin(at * 0.28) * 0.07;

        astronautHolder.position.x = Math.sin(at * 0.14 + 0.5) * 0.14 + Math.sin(at * 0.4 + 1.0) * 0.10;
        astronautHolder.position.y = Math.cos(at * 0.11 + 1.0) * 0.11 + Math.sin(at * 0.6) * 0.10
            + Math.sin(at * 0.23 + 1.3) * 0.05;

        if (rig) {
            const lf = RIG.float;
            const sp = RIG.speed;
            const limb = lf * 0.6;
            const armFloat = limb * (Math.sin(at * sp * 1.2 + 0.9) + 0.4 * Math.sin(at * sp * 2.1 + 2.2));

            rig.shoulder.rotation.z = armFloat * 0.6;
            rig.shoulder.rotation.x = armFloat;
            rig.shoulder.rotation.y = lf * 0.5 * Math.sin(at * sp * 0.9 + 1.2);
            rig.elbow.rotation.z = armFloat * 0.4;
            rig.elbow.rotation.x = armFloat * 0.5;

            rig.leftArm.rotation.x = RIG.leftArmDown
                + limb * (Math.sin(at * sp * 1.3 + 0.4) + 0.5 * Math.sin(at * sp * 2.4 + 1.1));
            rig.leftArm.rotation.z = limb * 0.7 * Math.sin(at * sp * 1.0 + 1.7);
            rig.leftArm.rotation.y = RIG.leftArmOut;

            rig.leftLeg.rotation.x = limb * (Math.sin(at * sp * 1.1 + 2.1) + 0.4 * Math.sin(at * sp * 2.0 + 0.3));
            rig.leftLeg.rotation.z = limb * 0.5 * Math.sin(at * sp * 1.3 + 0.6);
            rig.rightLeg.rotation.x = limb * (Math.sin(at * sp * 1.2 + 3.4) + 0.4 * Math.sin(at * sp * 2.2 + 1.5));
            rig.rightLeg.rotation.z = limb * 0.5 * Math.sin(at * sp * 1.25 + 2.8);

            rig.head.rotation.y = RIG.head * Math.sin(at * 0.7 + 0.3) + mx * 0.15;
            rig.head.rotation.x = RIG.head * 0.8 * Math.sin(at * 0.9 + 1.1) + my * 0.12;
            rig.head.rotation.z = RIG.head * 0.5 * Math.sin(at * 0.5 + 2.0);
        }
    }

    if (!dragging) { manualAz *= 0.98; manualEl *= 0.98; }
    manualAzE += (manualAz - manualAzE) * 0.12;
    manualElE += (manualEl - manualElE) * 0.12;

    const view = viewAt(p);
    const az = Math.max(-1.4, Math.min(1.4, view.az + manualAzE + mx * 0.15));
    const el = Math.max(-0.9, Math.min(0.9, view.el + manualElE + my * 0.12));
    const dist = view.dist * lerp(2.5, 1.0, emerge);
    const cx = Math.sin(az) * Math.cos(el) * dist;
    const cy = Math.sin(el) * dist + 0.12 + (1 - emerge) * 0.8;
    const cz = Math.cos(az) * Math.cos(el) * dist;
    camera.position.x += (cx - camera.position.x) * 0.07;
    camera.position.y += (cy - camera.position.y) * 0.07;
    camera.position.z += (cz - camera.position.z) * 0.07;
    camera.lookAt(0, 0.12, 0);

    if (backdropTexture) backdropTexture.needsUpdate = true;

    const capGate = clamp01((enterAmt - 0.45) / 0.4);
    captionEls.forEach((c, i) => {
        const at = CONFIG.beats[i].at;
        const vis = clamp01(1 - (Math.abs(p - at) - 0.05) / 0.10) * capGate;
        c.el.style.opacity = vis.toFixed(3);
        c.line.style.transform = 'translateY(' + ((1 - vis) * 14).toFixed(1) + 'px)';
    });

    composer.render();
};

const start = () => {
    try {
        setup();
    } catch (err) {
        console.warn('space scene unavailable', err);
        return;
    }
    if (backdropVideo) backdropVideo.play().catch(() => {});
    draw();
    requestAnimationFrame(() => { entered = true; });
};

window.addEventListener('pointermove', (e) => {
    mouseTarget = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    if (!dragging) return;
    manualAz -= ((e.clientX - dragPX) / window.innerWidth) * 1.3;
    manualEl -= ((e.clientY - dragPY) / window.innerHeight) * 0.8;
    manualAz = Math.max(-1.6, Math.min(1.6, manualAz));
    manualEl = Math.max(-0.6, Math.min(0.6, manualEl));
    dragPX = e.clientX;
    dragPY = e.clientY;
});

spaceEl.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragPX = e.clientX;
    dragPY = e.clientY;
    spaceEl.classList.add('is-grabbing');
});

window.addEventListener('pointerup', () => {
    dragging = false;
    spaceEl.classList.remove('is-grabbing');
});

window.addEventListener('resize', resize);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        if (backdropVideo) backdropVideo.pause();
    } else {
        if (backdropVideo) backdropVideo.play().catch(() => {});
        if (!rafId) draw();
    }
});

start();
