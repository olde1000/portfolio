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
    modelYaw: Math.PI,
    scrollVh: 540,
    beats: [
        { at: 0.14, side: 'left', y: '40%', da: 'PLACEHOLDER — beat 1', en: 'PLACEHOLDER — beat 1' },
        { at: 0.40, side: 'right', y: '58%', da: 'PLACEHOLDER — beat 2', en: 'PLACEHOLDER — beat 2' },
        { at: 0.66, side: 'left', y: '44%', da: 'PLACEHOLDER — beat 3', en: 'PLACEHOLDER — beat 3' },
        { at: 0.90, side: 'right', y: '56%', da: 'PLACEHOLDER — beat 4', en: 'PLACEHOLDER — beat 4' },
    ],
    views: [
        { p: 0.00, az: 0.00, el: 0.05, dist: 5.0 },
        { p: 0.16, az: -0.55, el: 0.02, dist: 4.2 },
        { p: 0.40, az: 0.95, el: 0.30, dist: 3.6 },
        { p: 0.64, az: -1.05, el: -0.28, dist: 3.4 },
        { p: 0.88, az: 0.60, el: 0.14, dist: 4.4 },
        { p: 1.00, az: 0.00, el: 0.10, dist: 5.0 },
    ],
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
let backdropVideo, backdropTexture, stars, astronaut = null, astronautHolder, mixer = null, hasAnim = false;
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
        const wrap = new THREE.Group();
        wrap.add(gltf.scene);
        const size = new THREE.Vector3();
        new THREE.Box3().setFromObject(gltf.scene).getSize(size);
        wrap.scale.setScalar((2.0 / (size.y || 1)) * CONFIG.modelScale);
        const centre = new THREE.Vector3();
        new THREE.Box3().setFromObject(wrap).getCenter(centre);
        wrap.position.sub(centre);
        astronaut = wrap;
        astronautHolder.add(wrap);

        if (gltf.animations && gltf.animations.length) {
            mixer = new THREE.AnimationMixer(gltf.scene);
            mixer.clipAction(gltf.animations[0]).play();
            hasAnim = true;
        }
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

// The container is masked from the bottom up as the camera flies in, so the scene
// rises into frame rather than cutting on.
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
        if (mixer) mixer.update(dt);
        if (hasAnim) {
            astronaut.rotation.y = CONFIG.modelYaw + Math.sin(p * Math.PI * 2.0) * 0.3;
            astronautHolder.rotation.z = Math.sin(p * Math.PI * 3.0 + 0.6) * 0.2;
            astronautHolder.rotation.x = 0;
            astronautHolder.position.y = reduced() ? 0 : Math.sin(t * 0.6) * 0.1;
            astronautHolder.position.z = 0;
        } else {
            const stroke = reduced() ? 0 : t * 1.9;
            const swim = Math.sin(stroke);
            const swim2 = Math.sin(stroke * 0.5);
            const swim3 = Math.sin(stroke * 0.5 + 1.2);
            astronaut.rotation.y = CONFIG.modelYaw + Math.sin(p * Math.PI * 2.0) * 0.35 + swim3 * 0.35;
            astronautHolder.rotation.x = -0.3 + Math.sin(p * Math.PI * 1.5 + 0.3) * 0.15 + swim * 0.42;
            astronautHolder.rotation.z = Math.sin(p * Math.PI * 3.0 + 0.6) * 0.26 + swim2 * 0.4;
            astronautHolder.position.y = swim * 0.28 + Math.sin(p * Math.PI) * 0.1;
            astronautHolder.position.z = Math.sin(stroke - 0.5) * 0.18;
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
