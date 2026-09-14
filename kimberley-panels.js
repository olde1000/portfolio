(function () {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-kimberley-panel]'));
    if (!panels.length) return;

    var SWING = 44, SLIDE = 180, BLUR = 4, PLATEAU = 0.52, EASE = 5.0;
    var RADIUS = 620, MAX_TILT = 34;

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    var sstep = function (a, b, x) {
        var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
    };

    var carve = function (el) {
        var lines = Array.prototype.slice.call(el.querySelectorAll('p'));
        var spoken = document.createElement('p');
        spoken.className = 'kimberley-sr-only';
        spoken.lang = 'da';
        spoken.textContent = lines.map(function (p) { return p.textContent.trim(); }).join(' ');

        var stage = document.createElement('div');
        stage.className = 'kimberley-panel-stage';

        var glyphs = [];
        lines.forEach(function (p) {
            var text = p.textContent;
            var frag = document.createDocumentFragment();
            for (var i = 0; i < text.length; i++) {
                var ch = text.charAt(i);
                if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
                var s = document.createElement('span');
                s.className = 'kimberley-panel-glyph';
                s.textContent = ch;
                frag.appendChild(s);
                glyphs.push(s);
            }
            p.textContent = '';
            p.appendChild(frag);
            p.setAttribute('aria-hidden', 'true');
            stage.appendChild(p);
        });

        el.appendChild(stage);
        el.appendChild(spoken);
        return { stage: stage, glyphs: glyphs };
    };

    var bend = function (track) {
        var mid = track.stage.offsetWidth / 2;
        for (var i = 0; i < track.glyphs.length; i++) {
            var g = track.glyphs[i];
            var u = g.offsetLeft + g.offsetWidth / 2 - mid;
            var a = Math.max(-MAX_TILT, Math.min(MAX_TILT, (u / RADIUS) * (180 / Math.PI)));
            var z = -RADIUS * (1 - Math.cos(u / RADIUS));
            g.style.transform = 'translateZ(' + z.toFixed(1) + 'px) rotateY(' + a.toFixed(2) + 'deg)';
        }
    };

    var tracks = panels.map(function (el) {
        var built = carve(el);
        return {
            el: el,
            stage: built.stage,
            glyphs: built.glyphs,
            from: parseFloat(el.dataset.from),
            span: parseFloat(el.dataset.to) - parseFloat(el.dataset.from),
            shown: null
        };
    });

    var reflow = function () { tracks.forEach(bend); };

    var render = function (track, p) {
        var away = Math.abs(p);
        var o = sstep(1, PLATEAU, away);

        if (o <= 0.002) {
            if (track.shown !== 0) {
                track.el.style.opacity = '0';
                track.el.style.filter = '';
                track.stage.style.transform = '';
                track.shown = 0;
            }
            return;
        }

        track.el.style.opacity = o.toFixed(3);
        track.shown = o;

        if (calm.matches) {
            track.el.style.filter = '';
            track.stage.style.transform = '';
            return;
        }

        track.stage.style.transform = 'rotateY(' + (p * -SWING).toFixed(2) +
            'deg) translateX(' + (p * -SLIDE).toFixed(1) + 'px)';
        track.el.style.filter = 'blur(' + (away * away * BLUR).toFixed(2) + 'px)';
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
    reflow();
    window.addEventListener('resize', reflow);
    document.fonts.ready.then(reflow);
    requestAnimationFrame(frame);
})();
