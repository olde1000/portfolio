(function () {
    var gl = document.getElementById('kimberleyAstroGL');
    if (!gl) return;

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var IMPULSE = 82, SPRING = 190, DAMP = 17, CAP = 7;
    var PUNCH = 0.10, PUNCH_K = 210, PUNCH_C = 19, PUNCH_CAP = 0.012;

    var x = 0, y = 0, vx = 0, vy = 0, punch = 0, punchV = 0;
    var live = false, seenPulse = 0, last = null;

    var strike = function () {
        var pulse = window.kimberleyKickPulse || 0;
        if (pulse === seenPulse) return;
        seenPulse = pulse;
        if (calm.matches || (window.kimberleyEnd || 0) >= 0.001) return;

        var dx = (window.kimberleyKickNX == null ? 0.5 : window.kimberleyKickNX) - 0.30;
        var dy = (window.kimberleyKickNY == null ? 0.5 : window.kimberleyKickNY) - 0.35;
        var len = Math.hypot(dx, dy) + 1e-3;
        vx += (dx / len) * IMPULSE;
        vy += (dy / len) * IMPULSE;
        punchV += PUNCH;
    };

    var frame = function (now) {
        requestAnimationFrame(frame);
        if (last === null) { last = now; return; }
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        strike();

        vx += (-SPRING * x - DAMP * vx) * dt;
        vy += (-SPRING * y - DAMP * vy) * dt;
        x += vx * dt;
        y += vy * dt;
        punchV += (-PUNCH_K * punch - PUNCH_C * punchV) * dt;
        punch += punchV * dt;

        var mag = Math.hypot(x, y);
        if (mag > CAP) { x *= CAP / mag; y *= CAP / mag; }
        if (punch > PUNCH_CAP) punch = PUNCH_CAP;

        if (Math.abs(x) < 0.02 && Math.abs(y) < 0.02 &&
            Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5 &&
            Math.abs(punch) < 0.0002 && Math.abs(punchV) < 0.004) {
            x = y = vx = vy = punch = punchV = 0;
            if (live) { gl.style.transform = ''; live = false; }
            return;
        }

        gl.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' +
                             (1 + punch).toFixed(4) + ')';
        live = true;
    };

    requestAnimationFrame(frame);
})();
