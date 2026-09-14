(function () {
    var root = document.getElementById('kimberleyBoot');
    var cv = document.getElementById('kimberleyBootStars');
    var mark = document.getElementById('kimberleyBootMark');
    if (!root || !cv || !mark) return;

    var COUNT = 380, TRAIL = 4;
    var MIN_SHOW = 1400, HOLD = 1300, DRAW_IN = 380, BLOOM = 1150, GIVE_UP = 9000;
    var CHARGE_R = 0.42, FLY_R = 2.6, REVEAL = 0.82, HANDOVER = 0.42;
    var NEAR = 0.42, DEEP = 1.30;
    var WEIGHT_LO = 120, WEIGHT_HI = 600;
    var TRACK_LO = 0.52, TRACK_HI = 0.18;

    var ASSETS = {
        'astronaut': 1211932,
        'assets/models/earth.glb': 94712,
        'assets/models/rocket.glb': 1175156
    };

    var ctx = cv.getContext('2d');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (calm.matches) { MIN_SHOW = 300; HOLD = 260; DRAW_IN = 120; BLOOM = 420; }

    var W = 0, H = 0, DPR = 1, CX = 0, CY = 0, REACH = 0;
    var stars = [];
    var got = {}, total = 0;
    for (var key in ASSETS) total += ASSETS[key];

    var born = performance.now(), readyAt = 0, bloomAt = 0;
    var shown = 0, lastTravel = 0, handed = false;

    document.body.classList.add('kimberley-is-locked');

    var sprite = (function () {
        var S = 64, C = S / 2;
        var c = document.createElement('canvas');
        c.width = c.height = S;
        var g = c.getContext('2d');
        var grd = g.createRadialGradient(C, C, 0, C, C, C);
        grd.addColorStop(0.00, 'rgba(255,255,255,1)');
        grd.addColorStop(0.14, 'rgba(255,255,255,0.88)');
        grd.addColorStop(0.36, 'rgba(255,255,255,0.22)');
        grd.addColorStop(1.00, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, S, S);
        return c;
    })();

    for (var i = 0; i < COUNT; i++) {
        var a = Math.random() * 6.2832;
        stars.push({
            cos: Math.cos(a),
            sin: Math.sin(a),
            rn: 0.06 + Math.pow(Math.random(), 0.62) * 0.94,
            speed: 1 / (NEAR + Math.random() * (DEEP - NEAR)),
            sz: 1.1 + Math.random() * 2.6,
            at: Math.pow(i / COUNT, 0.85) * REVEAL,
            warm: Math.random() < 0.15,
            ph: Math.random() * 6.2832
        });
    }

    var resize = function () {
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        W = window.innerWidth; H = window.innerHeight;
        CX = W * 0.5; CY = H * 0.5;
        REACH = Math.hypot(W, H) * 0.5;
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

    var streak = function (s, from, to, alpha, size) {
        var gap = Math.abs(to - from) * s.speed;
        var hops = gap < 7 ? 1 : Math.min(TRAIL, 1 + (gap / 7) | 0);
        var tint = s.warm ? 'rgba(255,216,176,' : 'rgba(208,226,255,';

        for (var h = 0; h < hops; h++) {
            var k = hops === 1 ? 1 : h / (hops - 1);
            var d = from + (to - from) * k;
            var x = CX + s.cos * d;
            var y = CY + s.sin * d;
            if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
            var a = alpha * (0.34 + 0.66 * k) / hops * (hops > 1 ? 1.7 : 1);
            if (a < 0.004) continue;
            var r = size * (0.7 + 0.3 * k);
            ctx.globalAlpha = a > 1 ? 1 : a;
            ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
        }
    };

    var vignette = null;
    var buildVignette = function () {
        vignette = ctx.createRadialGradient(CX, CY, REACH * 0.25, CX, CY, REACH * 1.15);
        vignette.addColorStop(0, 'rgba(5,7,13,0)');
        vignette.addColorStop(1, 'rgba(5,7,13,0.85)');
    };

    var paint = function (p, bloom, draw) {
        var veil = bloom <= 0 ? 1 : 1 - sstep((bloom - HANDOVER) / (1 - HANDOVER));
        root.style.setProperty('--kimberley-boot-veil', veil.toFixed(3));

        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        var pull = 1 - draw * 0.08;
        var travel = (CHARGE_R * Math.pow(p, 1.7) * pull) + FLY_R * Math.pow(bloom, 2.3);
        var glow = 1 - bloom * 0.35;

        for (var i = 0; i < COUNT; i++) {
            var s = stars[i];
            if (p < s.at) continue;
            var lit = Math.min(1, (p - s.at) / 0.10);
            var tw = 0.74 + 0.26 * Math.sin(performance.now() * 0.0015 + s.ph);
            var a = lit * tw * glow;
            if (a < 0.004) continue;
            var size = s.sz * (1 + travel * s.speed * 0.22);
            streak(s, REACH * s.rn * lastTravel * s.speed, REACH * s.rn * travel * s.speed, a, size);
        }

        var flare = bloom > 0 ? Math.sin(Math.min(1, bloom / 0.26) * Math.PI) : 0;
        var heat = (0.34 + p * 0.66) * (1 - sstep(bloom / 0.55)) + flare * 0.9 + draw * 0.35;
        var core = (3.0 + p * 4.5) * (1 + flare * 4.0 + draw * 0.5);
        var halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, core * 6);
        halo.addColorStop(0.00, 'rgba(255,255,255,' + Math.min(1, heat * 0.9).toFixed(3) + ')');
        halo.addColorStop(0.18, 'rgba(198,222,255,' + (heat * 0.40).toFixed(3) + ')');
        halo.addColorStop(0.50, 'rgba(120,164,255,' + (heat * 0.10).toFixed(3) + ')');
        halo.addColorStop(1.00, 'rgba(90,140,255,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = halo;
        ctx.fillRect(CX - core * 6, CY - core * 6, core * 12, core * 12);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        lastTravel = travel;

        var st = mark.style;
        st.setProperty('--kimberley-boot-wght', Math.round(WEIGHT_LO + (WEIGHT_HI - WEIGHT_LO) * p));
        st.setProperty('--kimberley-boot-track', (TRACK_LO + (TRACK_HI - TRACK_LO) * p).toFixed(3) + 'em');
        st.setProperty('--kimberley-boot-lit', (p * 118).toFixed(1) + '%');
        st.setProperty('--kimberley-boot-push', (1 + draw * 0.012 + bloom * 0.16).toFixed(4));
        st.setProperty('--kimberley-boot-soft', (2.6 * (1 - p) + bloom * 5).toFixed(2) + 'px');
        st.setProperty('--kimberley-boot-lift', Math.min(1, p * 2.2).toFixed(3));
    };

    var frame = function (now) {
        var p = progress();
        var age = now - born;

        if (!readyAt && p >= 0.999 && age >= MIN_SHOW) readyAt = now;
        if (!readyAt && age >= GIVE_UP) { p = 1; readyAt = now; }
        if (readyAt && !bloomAt && now - readyAt >= HOLD) bloomAt = now;

        var draw = readyAt && !bloomAt ? sstep((now - readyAt - (HOLD - DRAW_IN)) / DRAW_IN) : 0;
        var bloom = bloomAt ? Math.min(1, expoOut((now - bloomAt) / BLOOM)) : 0;
        shown += (Math.max(shown, p) - shown) * 0.1;

        paint(shown, bloom, draw);

        if (bloom >= HANDOVER && !handed) { handed = true; window.kimberleyBooted = true; }
        if (bloom >= 1) { root.remove(); return; }
        requestAnimationFrame(frame);
    };

    resize();
    buildVignette();
    window.addEventListener('resize', function () { resize(); buildVignette(); });
    requestAnimationFrame(frame);
})();
