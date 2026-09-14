(function () {
    var root = document.getElementById('kimberleyBoot');
    var cv = document.getElementById('kimberleyBootStars');
    var mark = document.getElementById('kimberleyBootMark');
    if (!root || !cv || !mark) return;

    var STARS = 240;
    var MIN_SHOW = 1500, HOLD = 1250, BLOOM = 1300, GIVE_UP = 9000, HANDOVER = 0.40;
    var APEX_LOW = 0.86, APEX_HIGH = 0.62, APEX_GONE = 1.40;
    var CURVE_FLAT = 3.4, CURVE_NEAR = 1.15;
    var RIM_MIN = 18, RIM_MAX = 104;
    var DRIFT = 0.006, LIFT = 0.42;
    var WEIGHT_LO = 130, WEIGHT_HI = 560;
    var TRACK_LO = 0.54, TRACK_HI = 0.19;

    var ASSETS = {
        'astronaut': 1211932,
        'assets/models/earth.glb': 94712,
        'assets/models/rocket.glb': 1175156
    };

    var ctx = cv.getContext('2d');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (calm.matches) { MIN_SHOW = 300; HOLD = 250; BLOOM = 450; }

    var W = 0, H = 0, DPR = 1, CX = 0;
    var sky = [];
    var got = {}, total = 0;
    for (var key in ASSETS) total += ASSETS[key];

    var born = performance.now(), readyAt = 0, bloomAt = 0;
    var shown = 0, handed = false;

    document.body.classList.add('kimberley-is-locked');

    var sprite = (function () {
        var S = 32, C = S / 2;
        var c = document.createElement('canvas');
        c.width = c.height = S;
        var g = c.getContext('2d');
        var grd = g.createRadialGradient(C, C, 0, C, C, C);
        grd.addColorStop(0.00, 'rgba(255,255,255,1)');
        grd.addColorStop(0.20, 'rgba(255,255,255,0.75)');
        grd.addColorStop(0.50, 'rgba(255,255,255,0.14)');
        grd.addColorStop(1.00, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, S, S);
        return c;
    })();

    for (var i = 0; i < STARS; i++) {
        sky.push({
            x: Math.random(),
            y: Math.random(),
            sz: 0.7 + Math.pow(Math.random(), 2.2) * 2.4,
            at: Math.pow(i / STARS, 1.4) * 0.9,
            warm: Math.random() < 0.13,
            ph: Math.random() * 6.2832,
            tw: 0.4 + Math.random() * 1.3
        });
    }

    var resize = function () {
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        W = window.innerWidth; H = window.innerHeight;
        CX = W * 0.5;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    window.kimberleyLabsBytes = function (name, loaded, done) {
        if (!(name in ASSETS)) return;
        got[name] = Math.min(ASSETS[name], done ? (loaded / Math.max(done, 1)) * ASSETS[name] : loaded);
    };

    var progress = function () {
        var sum = 0;
        for (var k in got) sum += got[k];
        return Math.min(1, sum / total);
    };

    var expoOut = function (v) { return v >= 1 ? 1 : 1 - Math.pow(2, -10 * v); };
    var sstep = function (v) { v = v < 0 ? 0 : v > 1 ? 1 : v; return v * v * (3 - 2 * v); };
    var mix = function (a, b, v) { return a + (b - a) * v; };

    var paint = function (p, bloom, now) {
        var veil = bloom <= 0 ? 1 : 1 - sstep((bloom - HANDOVER) / (1 - HANDOVER));
        root.style.setProperty('--kimberley-boot-veil', veil.toFixed(3));

        var apex = H * (bloom > 0 ? mix(APEX_HIGH, APEX_GONE, bloom) : mix(APEX_LOW, APEX_HIGH, sstep(p)));
        var radius = W * mix(CURVE_FLAT, CURVE_NEAR, sstep(p));
        var cy = apex + radius;
        var rim = mix(RIM_MIN, RIM_MAX, sstep(p)) * (1 - bloom * 0.55);
        var heat = (0.22 + 0.78 * sstep(p)) * (1 - sstep(Math.max(0, (bloom - 0.25) / 0.75)));
        var climb = (LIFT * sstep(p) + 1.7 * Math.pow(bloom, 2.1)) * H;

        ctx.clearRect(0, 0, W, H);

        ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < STARS; i++) {
            var s = sky[i];
            if (p < s.at) continue;
            var y = (s.y * H - climb - now * DRIFT) % H;
            if (y < 0) y += H;
            if (y > apex - 4) continue;
            var a = Math.min(1, (p - s.at) / 0.12) * (0.55 + 0.45 * Math.sin(now * 0.001 * s.tw + s.ph));
            a *= sstep(Math.min(1, (apex - y) / 90));
            if (a < 0.005) continue;
            ctx.globalAlpha = a;
            var r = s.sz;
            ctx.drawImage(sprite, s.x * W - r, y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        ctx.beginPath();
        ctx.arc(CX, cy, radius, 0, 6.2832);
        ctx.fillStyle = '#01020a';
        ctx.fill();

        ctx.globalCompositeOperation = 'lighter';
        var band = ctx.createRadialGradient(CX, cy, Math.max(0, radius - rim * 0.55), CX, cy, radius + rim * 2.6);
        band.addColorStop(0.00, 'rgba(96,150,240,0)');
        band.addColorStop(0.40, 'rgba(150,196,255,' + (heat * 0.30).toFixed(3) + ')');
        band.addColorStop(0.52, 'rgba(226,240,255,' + (heat * 0.92).toFixed(3) + ')');
        band.addColorStop(0.62, 'rgba(120,175,255,' + (heat * 0.34).toFixed(3) + ')');
        band.addColorStop(1.00, 'rgba(58,110,230,0)');
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, W, H);

        ctx.beginPath();
        ctx.arc(CX, cy, radius, Math.PI * 1.18, Math.PI * 1.82);
        ctx.strokeStyle = 'rgba(236,246,255,' + (heat * 0.85).toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';

        var vig = ctx.createRadialGradient(CX, H * 0.52, H * 0.2, CX, H * 0.52, H * 1.05);
        vig.addColorStop(0, 'rgba(5,7,13,0)');
        vig.addColorStop(1, 'rgba(5,7,13,0.8)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        var st = mark.style;
        st.setProperty('--kimberley-boot-wght', Math.round(mix(WEIGHT_LO, WEIGHT_HI, p)));
        st.setProperty('--kimberley-boot-track', mix(TRACK_LO, TRACK_HI, p).toFixed(3) + 'em');
        st.setProperty('--kimberley-boot-lift', Math.min(1, p * 2.4).toFixed(3));
        st.setProperty('--kimberley-boot-soft', (2.4 * (1 - p) + bloom * 6).toFixed(2) + 'px');
        st.setProperty('--kimberley-boot-rise', (-bloom * H * 0.22).toFixed(1) + 'px');
    };

    var frame = function (now) {
        var p = progress();
        var age = now - born;

        if (!readyAt && p >= 0.999 && age >= MIN_SHOW) readyAt = now;
        if (!readyAt && age >= GIVE_UP) { p = 1; readyAt = now; }
        if (readyAt && !bloomAt && now - readyAt >= HOLD) bloomAt = now;

        var bloom = bloomAt ? Math.min(1, expoOut((now - bloomAt) / BLOOM)) : 0;
        shown += (Math.max(shown, p) - shown) * 0.09;

        paint(shown, bloom, now);

        if (bloom >= HANDOVER && !handed) { handed = true; window.kimberleyBooted = true; }
        if (bloom >= 1) { root.remove(); return; }
        requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
})();
