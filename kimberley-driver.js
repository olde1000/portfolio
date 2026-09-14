(function () {
    var ORBIT_TURNS = 0.5, END_DUR = 6.0, ROCKET_DUR = 10.0, OUTRO_DUR = 6.0;

    var endT = 0, rocketT = 0, outroT = -1, last = null;
    var launched = false, engaged = false, scrollAz = 0;

    window.kimberleyScrollAz = 0;
    window.kimberleyScrollP = 0;

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    window.addEventListener('load', function () { window.scrollTo(0, 0); });

    function engage() {
        if (engaged) return;
        engaged = true;
    }

    ['wheel', 'touchmove', 'scroll'].forEach(function (name) {
        window.addEventListener(name, engage, { passive: true });
    });
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') engage();
    });

    window.kimberleyJp = 1.0;
    window.kimberleyMouseX = 0.5;
    window.kimberleyMouseY = 0.5;
    window.kimberleyEnd = 0;
    window.kimberleyRocket = 0;
    window.kimberleyOutro = 0;
    window.kimberleyCloseIn = 0;
    window.kimberleyEndSwap = 0;
    window.kimberleyClickPulse = 0;
    window.kimberleyClickNX = 0.5;
    window.kimberleyClickNY = 0.5;
    window.wormWindRoll = 0;
    window.wormWindBendX = 0;
    window.wormWindBendY = 0;
    window.kimberleyLabsBytes = function () {};

    var aimX = 0.5, aimY = 0.5;

    window.addEventListener('pointermove', function (e) {
        aimX = e.clientX / window.innerWidth;
        aimY = e.clientY / window.innerHeight;
    });

    window.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        window.kimberleyClickNX = e.clientX / window.innerWidth;
        window.kimberleyClickNY = e.clientY / window.innerHeight;
        window.kimberleyClickPulse = (window.kimberleyClickPulse || 0) + 1;
    });

    function tick(now) {
        requestAnimationFrame(tick);
        if (last === null) { last = now; return; }
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        var tx = launched ? 0.5 : aimX;
        var ty = launched ? 0.5 : aimY;
        var k = launched ? Math.min(1, dt * 2.0) : 1;
        window.kimberleyMouseX += (tx - window.kimberleyMouseX) * k;
        window.kimberleyMouseY += (ty - window.kimberleyMouseY) * k;

        if (!launched && engaged) {
            var span = document.documentElement.scrollHeight - window.innerHeight;
            if (span > 4) {
                var sp = Math.min(1, Math.max(0, window.scrollY / span));
                scrollAz += (sp * Math.PI * 2 * ORBIT_TURNS - scrollAz) * Math.min(1, dt * 4.0);
                window.kimberleyScrollP = sp;
                window.kimberleyScrollAz = scrollAz;
                if (sp >= 0.999) {
                    launched = true;
                    document.body.classList.add('kimberley-is-locked');
                }
            }
        }

        if (launched) {
            endT = Math.min(END_DUR, endT + dt);
            rocketT = Math.min(ROCKET_DUR, rocketT + dt);
        }

        var ep = END_DUR > 0 ? Math.min(1, endT / END_DUR) : 0;
        window.kimberleyEnd = ep * ep * (3 - 2 * ep);
        window.kimberleyRocket = ROCKET_DUR > 0 ? Math.min(1, rocketT / ROCKET_DUR) : 0;

        if (window.kimberleyRocket >= 1 && outroT < 0) outroT = 0;

        if (outroT >= 0) {
            outroT += dt;
            window.kimberleyOutro = Math.min(1, outroT / OUTRO_DUR);
        }
    }

    requestAnimationFrame(tick);

    window.addEventListener('load', function () {
        if (window.kimberleyLoadAstronaut) window.kimberleyLoadAstronaut();
        if (window.kimberleyLoadPlanets) window.kimberleyLoadPlanets();
    });
})();
