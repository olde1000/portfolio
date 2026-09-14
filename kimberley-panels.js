(function () {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-kimberley-panel]'));
    if (!panels.length) return;

    var SWING = 44, SLIDE = 180, BLUR = 4, PLATEAU = 0.52, EASE = 5.0;

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    var tracks = panels.map(function (el) {
        var from = parseFloat(el.dataset.from);
        var to = parseFloat(el.dataset.to);
        return { el: el, from: from, span: to - from, shown: null };
    });

    var sstep = function (a, b, x) {
        var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
    };

    var render = function (track, p) {
        var el = track.el;
        var away = Math.abs(p);
        var o = sstep(1, PLATEAU, away);

        if (o <= 0.002) {
            if (track.shown !== 0) {
                el.style.opacity = '0';
                el.style.transform = '';
                el.style.filter = '';
                track.shown = 0;
            }
            return;
        }

        el.style.opacity = o.toFixed(3);
        track.shown = o;

        if (calm.matches) {
            el.style.transform = '';
            el.style.filter = '';
            return;
        }

        el.style.transform = 'perspective(1100px) rotateY(' +
            (p * -SWING).toFixed(2) + 'deg) translateX(' +
            (p * -SLIDE).toFixed(1) + 'px)';
        el.style.filter = 'blur(' + (away * away * BLUR).toFixed(2) + 'px)';
    };

    var eased = 0, last = null;

    var frame = function (now) {
        requestAnimationFrame(frame);
        if (last === null) { last = now; return; }
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        var raw = window.kimberleyScrollP || 0;
        eased += (raw - eased) * Math.min(1, dt * EASE);

        for (var i = 0; i < tracks.length; i++) {
            var t = tracks[i];
            render(t, ((eased - t.from) / t.span) * 2 - 1);
        }
    };

    panels.forEach(function (el) { el.style.opacity = '0'; });
    requestAnimationFrame(frame);
})();
