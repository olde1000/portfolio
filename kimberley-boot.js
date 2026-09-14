(function () {
    var root = document.getElementById('kimberleyBoot');
    var cv = document.getElementById('kimberleyBootStars');
    var mark = document.getElementById('kimberleyBootMark');
    if (!root || !cv || !mark) return;

    var COUNT = 460, MIN_SHOW = 1100, HOLD = 1200, BLOOM = 1000, GIVE_UP = 9000;
    var SEED_R = 0.55, FLY_R = 1.9, REVEAL = 0.85, HANDOVER = 0.45;
    var WEIGHT_LO = 100, WEIGHT_HI = 620;
    var TRACK_LO = 0.46, TRACK_HI = 0.17;

    var ASSETS = {
        'astronaut': 1211932,
        'assets/models/earth.glb': 94712,
        'assets/models/rocket.glb': 1175156
    };

    var ctx = cv.getContext('2d');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    var W = 0, H = 0, DPR = 1, CX = 0, CY = 0, REACH = 0;
    var stars = [];
    var got = {}, total = 0;
    for (var key in ASSETS) total += ASSETS[key];

    var born = performance.now(), readyAt = 0, bloomAt = 0;
    var shown = 0, handed = false;

    document.body.classList.add('kimberley-is-locked');

    for (var i = 0; i < COUNT; i++) {
        var a = Math.random() * 6.2832;
        stars.push({
            cos: Math.cos(a),
            sin: Math.sin(a),
            rn: 0.08 + Math.pow(Math.random(), 0.55) * 0.92,
            sz: 0.6 + Math.random() * 1.9,
            at: (i / COUNT) * REVEAL,
            warm: Math.random() < 0.17,
            ph: Math.random() * 6.2832
        });
    }

    var resize = function () {
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        W = window.innerWidth; H = window.innerHeight;
        CX = W * 0.5; CY = H * 0.5;
        REACH = Math.hypot(W, H) * 0.62;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    window.kimberleyLabsBytes = function (name, loaded, done) {
        if (!(name in ASSETS)) return;
        got[name] = Math.min(ASSETS[name], done ? (loaded / Math.max(done, 1)) * ASSETS[name] : loaded);
    };

    var loaded = function () {
        var sum = 0;
        for (var k in got) sum += got[k];
        return Math.min(1, sum / total);
    };

    var ease = function (v) { return 1 - Math.pow(1 - v, 3); };

    var paint = function (p, bloom) {
        var fade = bloom <= 0 ? 1 : 1 - Math.max(0, (bloom - HANDOVER) / (1 - HANDOVER));
        root.style.setProperty('--kimberley-boot-veil', fade.toFixed(3));

        ctx.clearRect(0, 0, W, H);

        var spread = REACH * (SEED_R * Math.pow(p, 1.7) + FLY_R * Math.pow(bloom, 2.2));
        var grow = 1 + bloom * 1.6;

        for (var i = 0; i < COUNT; i++) {
            var s = stars[i];
            if (p < s.at) continue;
            var born01 = Math.min(1, (p - s.at) / 0.12);
            var d = s.rn * spread;
            var x = CX + s.cos * d;
            var y = CY + s.sin * d;
            if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;

            var tw = 0.72 + 0.28 * Math.sin(performance.now() * 0.0016 + s.ph);
            var a = born01 * tw * (1 - bloom * 0.45);
            if (a < 0.004) continue;

            ctx.fillStyle = s.warm
                ? 'rgba(255,214,170,' + a.toFixed(3) + ')'
                : 'rgba(206,224,255,' + a.toFixed(3) + ')';
            var r = s.sz * grow;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 6.2832);
            ctx.fill();
        }

        var flare = bloom > 0 ? Math.sin(Math.min(1, bloom / 0.3) * Math.PI) : 0;
        var core = (2.2 + p * 3.4) * (1 + flare * 5.5);
        var halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, core * 7);
        var lift = (0.30 + p * 0.70) * (1 - bloom);
        halo.addColorStop(0, 'rgba(226,238,255,' + (lift * 0.95).toFixed(3) + ')');
        halo.addColorStop(0.22, 'rgba(150,186,255,' + (lift * 0.30).toFixed(3) + ')');
        halo.addColorStop(1, 'rgba(90,140,255,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(CX - core * 7, CY - core * 7, core * 14, core * 14);

        mark.style.setProperty('--kimberley-boot-wght', Math.round(WEIGHT_LO + (WEIGHT_HI - WEIGHT_LO) * p));
        mark.style.setProperty('--kimberley-boot-track', (TRACK_LO + (TRACK_HI - TRACK_LO) * p).toFixed(3) + 'em');
        mark.style.setProperty('--kimberley-boot-lift', (0.12 + p * 0.88).toFixed(3));
        mark.style.setProperty('--kimberley-boot-push', (1 + bloom * 0.14).toFixed(3));
    };

    var handOver = function () {
        if (handed) return;
        handed = true;
        window.kimberleyBooted = true;
    };

    var frame = function (now) {
        var p = loaded();
        var age = now - born;

        if (!readyAt && p >= 0.999 && age >= MIN_SHOW) readyAt = now;
        if (!readyAt && age >= GIVE_UP) { p = 1; readyAt = now; }
        if (readyAt && !bloomAt && now - readyAt >= HOLD) bloomAt = now;

        var bloom = bloomAt ? Math.min(1, ease((now - bloomAt) / BLOOM)) : 0;
        shown += (Math.max(shown, p) - shown) * 0.12;

        paint(shown, bloom);

        if (bloom >= HANDOVER) handOver();
        if (bloom >= 1) {
            root.remove();
            return;
        }
        requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);

    if (calm.matches) {
        MIN_SHOW = 300; HOLD = 300; BLOOM = 400;
    }

    requestAnimationFrame(frame);
})();
