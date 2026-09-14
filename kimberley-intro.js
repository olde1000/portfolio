(function () {
    var root = document.getElementById('kimberleyIntro');
    if (!root) return;

    var START_DELAY = 900;
    var CHAR_MS = 26, CHAR_JITTER = 14;
    var PAUSE_PUNCT = 190, PAUSE_LINE = 340;
    var FADE_AT = 0.05;

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var lines = Array.prototype.slice.call(root.querySelectorAll('[data-kimberley-type]'));
    var texts = lines.map(function (el) { return el.textContent.trim(); });

    var spoken = document.createElement('p');
    spoken.className = 'kimberley-sr-only';
    spoken.lang = 'da';
    spoken.textContent = texts.join(' ');
    root.appendChild(spoken);

    lines.forEach(function (el) {
        el.style.minHeight = el.getBoundingClientRect().height + 'px';
        el.setAttribute('aria-hidden', 'true');
        el.textContent = '';
    });

    var gone = false;

    var fadeWatcher = function () {
        if ((window.kimberleyScrollP || 0) < FADE_AT) return requestAnimationFrame(fadeWatcher);
        gone = true;
        root.classList.add('kimberley-intro-gone');
    };

    var finish = function () {
        lines.forEach(function (el) { el.style.minHeight = ''; });
        lines[lines.length - 1].classList.add('kimberley-intro-caret');
    };

    requestAnimationFrame(fadeWatcher);

    if (calm.matches) {
        lines.forEach(function (el, i) { el.textContent = texts[i]; });
        finish();
        return;
    }

    var li = 0, ci = 0;

    var typeStep = function () {
        if (gone) return;
        var el = lines[li], text = texts[li];

        if (ci === 0) el.classList.add('kimberley-intro-caret');

        el.textContent = text.slice(0, ++ci);

        if (ci >= text.length) {
            el.classList.remove('kimberley-intro-caret');
            if (++li >= lines.length) return finish();
            ci = 0;
            return setTimeout(typeStep, PAUSE_LINE);
        }

        var ch = text.charAt(ci - 1);
        var wait = CHAR_MS + Math.random() * CHAR_JITTER;
        if (ch === ',' || ch === '—') wait += PAUSE_PUNCT * 0.6;
        else if (ch === '.') wait += PAUSE_PUNCT;
        setTimeout(typeStep, wait);
    };

    setTimeout(typeStep, START_DELAY);
})();
