(function () {
    var HOLD = 2.5, END_DUR = 6.0, ROCKET_DUR = 10.0, OUTRO_DUR = 6.0;

    var holdT = 0, endT = 0, rocketT = 0, outroT = -1, last = null;

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

    window.addEventListener('pointermove', function (e) {
        window.kimberleyMouseX = e.clientX / window.innerWidth;
        window.kimberleyMouseY = e.clientY / window.innerHeight;
    });

    window.addEventListener('pointerdown', function (e) {
        window.kimberleyClickNX = e.clientX / window.innerWidth;
        window.kimberleyClickNY = e.clientY / window.innerHeight;
        window.kimberleyClickPulse = (window.kimberleyClickPulse || 0) + 1;
    });

    function tick(now) {
        requestAnimationFrame(tick);
        if (last === null) { last = now; return; }
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        holdT += dt;
        if (holdT >= HOLD) {
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
