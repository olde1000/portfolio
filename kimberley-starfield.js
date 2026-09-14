(function () {
    var cv = document.getElementById('kimberleyStarfield');
    if (!cv) return;

    var ctx = cv.getContext('2d');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    var LAYERS = [
        { n: 170, rate: 0.10, size: 0.7, alpha: 0.34, drift: 0.9 },
        { n: 120, rate: 0.24, size: 1.0, alpha: 0.50, drift: 2.1 },
        { n: 74,  rate: 0.47, size: 1.5, alpha: 0.70, drift: 4.0 },
        { n: 34,  rate: 0.86, size: 2.3, alpha: 0.92, drift: 7.2 }
    ];
    var PAN_X = 96, PAN_Y = 46, MARGIN = 140;
    var MOUSE_X = 78, MOUSE_Y = 44, MOUSE_EASE = 3.2;
    var WARM = 0.16;

    var W = 0, H = 0, DPR = 1, FW = 0, FH = 0;
    var layers = [];
    var t0 = null, last = null;
    var mx = 0, my = 0, shown = -1;

    var build = function () {
        FW = W + MARGIN * 2;
        FH = H + MARGIN * 2;
        layers = LAYERS.map(function (spec) {
            var stars = [];
            for (var i = 0; i < spec.n; i++) {
                stars.push({
                    x: Math.random() * FW,
                    y: Math.random() * FH,
                    r: spec.size * (0.6 + Math.random() * 0.8),
                    a: spec.alpha * (0.5 + Math.random() * 0.5),
                    warm: Math.random() < WARM,
                    ph: Math.random() * 6.2832,
                    tw: 0.5 + Math.random() * 1.6
                });
            }
            return { spec: spec, stars: stars };
        });
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
        if (vis !== shown) {
            cv.style.opacity = vis.toFixed(3);
            shown = vis;
        }
        if (vis <= 0.001) return;

        var still = calm.matches;
        var az = still ? 0 : (window.kimberleyScrollAz || 0);
        var sp = still ? 0 : (window.kimberleyScrollP || 0);

        if (!still) {
            var k = Math.min(1, dt * MOUSE_EASE);
            mx += (((window.kimberleyMouseX == null ? 0.5 : window.kimberleyMouseX) - 0.5) - mx) * k;
            my += (((window.kimberleyMouseY == null ? 0.5 : window.kimberleyMouseY) - 0.5) - my) * k;
        }

        ctx.clearRect(0, 0, W, H);

        for (var l = 0; l < layers.length; l++) {
            var spec = layers[l].spec, stars = layers[l].stars;
            var ox = az * spec.rate * PAN_X + (still ? 0 : t * spec.drift) + mx * spec.rate * MOUSE_X;
            var oy = sp * spec.rate * PAN_Y + my * spec.rate * MOUSE_Y;

            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var x = wrap(s.x - ox, FW) - MARGIN;
                var y = wrap(s.y - oy, FH) - MARGIN;
                if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;

                var a = still ? s.a : s.a * (0.72 + 0.28 * Math.sin(t * s.tw + s.ph));
                ctx.fillStyle = s.warm
                    ? 'rgba(255,214,170,' + a.toFixed(3) + ')'
                    : 'rgba(206,224,255,' + a.toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(x, y, s.r, 0, 6.2832);
                ctx.fill();
            }
        }
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
})();
