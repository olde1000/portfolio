(function () {
    var root = document.getElementById('kimberleyIntro');
    if (!root) return;

    var START_DELAY = 900;
    var CHAR_MS = 26, CHAR_JITTER = 14;
    var PAUSE_PUNCT = 190, PAUSE_LINE = 340;
    var FADE_AT = 0.05, HOLD_CAP = 16000;

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var lines = Array.prototype.slice.call(root.querySelectorAll('[data-kimberley-type]'));
    var texts = lines.map(function (el) { return el.textContent.trim(); });

    var spoken = document.createElement('p');
    spoken.className = 'kimberley-sr-only';
    spoken.lang = 'da';
    spoken.textContent = texts.join(' ');
    root.appendChild(spoken);

    var glyphs = lines.map(function (el, i) {
        var frag = document.createDocumentFragment();
        var spans = texts[i].split('').map(function (ch) {
            var s = document.createElement('span');
            s.className = 'kimberley-intro-glyph';
            s.textContent = ch;
            frag.appendChild(s);
            return s;
        });
        el.setAttribute('aria-hidden', 'true');
        el.textContent = '';
        el.appendChild(frag);
        return spans;
    });

    var gone = false;
    var cursor = null;
    var held = true;

    var release = function () {
        if (!held) return;
        held = false;
        document.body.classList.remove('kimberley-is-locked');
    };

    setTimeout(release, HOLD_CAP);

    var setCursor = function (span) {
        if (cursor) cursor.classList.remove('kimberley-intro-cursor');
        cursor = span;
        if (cursor) cursor.classList.add('kimberley-intro-cursor');
    };

    var fadeWatcher = function () {
        if ((window.kimberleyScrollP || 0) < FADE_AT) return requestAnimationFrame(fadeWatcher);
        gone = true;
        root.classList.add('kimberley-intro-gone');
    };

    requestAnimationFrame(fadeWatcher);

    if (calm.matches) {
        glyphs.forEach(function (spans) {
            spans.forEach(function (s) { s.classList.add('kimberley-intro-lit'); });
        });
        setCursor(glyphs[glyphs.length - 1][glyphs[glyphs.length - 1].length - 1]);
        release();
        return;
    }

    var li = 0, ci = 0;

    var typeStep = function () {
        if (gone) return;
        var spans = glyphs[li], text = texts[li];

        spans[ci].classList.add('kimberley-intro-lit');
        setCursor(spans[ci]);
        ci++;

        if (ci >= spans.length) {
            if (++li >= glyphs.length) return release();
            ci = 0;
            return setTimeout(typeStep, PAUSE_LINE);
        }

        var ch = text.charAt(ci - 1);
        var wait = CHAR_MS + Math.random() * CHAR_JITTER;
        if (ch === ',' || ch === ':') wait += PAUSE_PUNCT * 0.6;
        else if (ch === '.') wait += PAUSE_PUNCT;
        setTimeout(typeStep, wait);
    };

    var waitForBoot = function () {
        if (!window.kimberleyBooted) return requestAnimationFrame(waitForBoot);
        setTimeout(typeStep, START_DELAY);
    };

    waitForBoot();
})();
