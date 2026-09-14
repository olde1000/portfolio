(function () {
    var cv = document.getElementById('kimberleyStarfield');
    if (!cv) return;

    var ctx = cv.getContext('2d');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    var COUNT = 620, MARGIN = 60, FOCAL = 620;
    var Z_NEAR = 26, Z_FAR = 700;
    var TRAVEL = 2.0, DRIFT = 0.045;
    var MOUSE_SHIFT = 3.0, MOUSE_EASE = 3.2;
    var SIZE_K = 62, SIZE_MIN = 0.4, SIZE_MAX = 2.3;
    var ALPHA_K = 34, ALPHA_MIN = 0.14, ALPHA_MAX = 0.95;
    var WARM = 0.16;

    var W = 0, H = 0, DPR = 1, FW = 0, FH = 0;
    var stars = [];
    var t0 = null, last = null;
    var mx = 0, my = 0, shown = -1;

    var build = function () {
        FW = W + MARGIN * 2;
        FH = H + MARGIN * 2;
        stars = [];
        for (var i = 0; i < COUNT; i++) {
            var z = Z_NEAR * Math.pow(Z_FAR / Z_NEAR, Math.random());
            stars.push({
                x: Math.random() * FW,
                y: Math.random() * FH,
                rate: FOCAL / z,
                r: Math.min(SIZE_MAX, Math.max(SIZE_MIN, SIZE_K / z)),
                a: Math.min(ALPHA_MAX, Math.max(ALPHA_MIN, ALPHA_K / z)),
                warm: Math.random() < WARM,
                ph: Math.random() * 6.2832,
                tw: 0.5 + Math.random() * 1.6
            });
        }
    };

    var resize = function () {
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        build();
    };

    var wrap = function (v, span) {
        v %= span;
        return v < 0 ? v + span : v;
    };

    var frame = function (now) {
        requestAnimationFrame(frame);
        if (t0 === null) { t0 = now; last = now; }
        var t = (now - t0) / 1000;
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        var vis = 1 - Math.max(0, Math.min(1, window.kimberleyEnd || 0));
        if (vis !== shown) { cv.style.opacity = vis.toFixed(3); shown = vis; }
        if (vis <= 0.001) return;

        var still = calm.matches;

        if (!still) {
            var k = Math.min(1, dt * MOUSE_EASE);
            mx += (((window.kimberleyMouseX == null ? 0.5 : window.kimberleyMouseX) - 0.5) - mx) * k;
            my += (((window.kimberleyMouseY == null ? 0.5 : window.kimberleyMouseY) - 0.5) - my) * k;
        }

        var camX = still ? 0 : (window.kimberleyScrollAz || 0) * TRAVEL + t * DRIFT + mx * MOUSE_SHIFT;
        var camY = still ? 0 : my * MOUSE_SHIFT;

        ctx.clearRect(0, 0, W, H);

        for (var i = 0; i < COUNT; i++) {
            var s = stars[i];
            var px = wrap(s.x - camX * s.rate, FW) - MARGIN;
            if (px < -3 || px > W + 3) continue;
            var py = wrap(s.y - camY * s.rate, FH) - MARGIN;
            if (py < -3 || py > H + 3) continue;

            var a = still ? s.a : s.a * (0.72 + 0.28 * Math.sin(t * s.tw + s.ph));
            ctx.fillStyle = s.warm
                ? 'rgba(255,214,170,' + a.toFixed(3) + ')'
                : 'rgba(206,224,255,' + a.toFixed(3) + ')';

            if (s.r < 1.1) {
                ctx.fillRect(px - s.r, py - s.r, s.r * 2, s.r * 2);
            } else {
                ctx.beginPath();
                ctx.arc(px, py, s.r, 0, 6.2832);
                ctx.fill();
            }
        }
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
})();
