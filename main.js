const heroVideo = document.querySelector(".hero-film");
const introTrack = document.querySelector(".intro-track");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const phone = matchMedia("(max-aspect-ratio: 11 / 10)");
const onScreen = new Set();

function wake(film) {
    if (film.preload !== "none") return false;
    if (phone.matches) film.src = film.src.replace("/video/", "/video/small/");
    film.preload = "auto";
    film.load();
    return true;
}
function clampScroll(move) {
    const cap = innerHeight * 0.9;
    const slack = innerHeight * 1.6;
    const lead = lenis.targetScroll - lenis.animatedScroll;
    let step = Math.max(-cap, Math.min(cap, move.deltaY));
    if (lead + step > slack) step = Math.max(0, slack - lead);
    if (lead + step < -slack) step = Math.min(0, -slack - lead);
    move.deltaY = step;
    return true;
}

const touch = matchMedia("(pointer: coarse)");
const lenis = reduceMotion.matches || touch.matches ? null : new Lenis({
    lerp: 0.055,
    wheelMultiplier: 0.75,
    touchMultiplier: 1.4,
    anchors: false,
    syncTouch: false,
    autoRaf: true,
    virtualScroll: clampScroll
});

function clamp(value) {
    return Math.min(Math.max(value, 0), 1);
}
function trackProgress(track, empty) {
    const box = track.getBoundingClientRect();
    const run = box.height - innerHeight;
    return run > 0 ? clamp(-box.top / run) : empty;
}
function introProgress() {
    return trackProgress(introTrack, 1);
}

function syncHero() {
    if (phone.matches) return;
    const share = introProgress();
    const run = share > 0.072 && !reduceMotion.matches && !navigator.connection?.saveData;
    if (run && heroVideo.paused) heroVideo.play().catch(() => {});
    if (!run && !heroVideo.paused) heroVideo.pause();
}
addEventListener("load", () => {
    const net = navigator.connection;
    const thin = net?.saveData || /2g|3g/.test(net?.effectiveType ?? "");
    if (reduceMotion.matches || thin) return;
    wake(heroVideo);
});
const navLinks = [...document.querySelectorAll(".chapters a")];
const navTargets = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
function markCurrent() {
    let at = 0;
    navTargets.forEach((mark, i) => {
        if (mark.getBoundingClientRect().top <= innerHeight * 0.5) at = i;
    });
    navLinks.forEach((a, i) => {
        if (i === at) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
    });
}
navLinks.forEach((a, i) => a.addEventListener("click", (event) => {
    const mark = navTargets[i];
    if (!mark) return;
    event.preventDefault();
    document.body.classList.add("is-jumping");
    setTimeout(() => {
        const to = scrollY + mark.getBoundingClientRect().top;
        if (lenis) lenis.scrollTo(to, { immediate: true });
        else scrollTo({ top: to, behavior: "instant" });
        markCurrent();
        requestAnimationFrame(() => requestAnimationFrame(
            () => document.body.classList.remove("is-jumping")));
    }, 380);
}));
addEventListener("scroll", () => { syncHero(); markCurrent(); }, { passive: true });
markCurrent();
const tutorialVideo = document.querySelector(".tutorial-film");
const soundButton = document.querySelector(".tutorial-sound");
const playButton = document.querySelector(".tutorial-play");
let tutorialLoaded = false;
let tutorialWanted = null;
function syncTutorial() {
    const share = introProgress();
    const near = phone.matches
        ? onScreen.has(tutorialVideo)
        : share > 0.633 && share < 0.773;
    if (!near) tutorialWanted = null;
    const on = tutorialWanted === null ? near && !reduceMotion.matches : tutorialWanted;
    if (on && !tutorialLoaded) {
        tutorialLoaded = true;
        wake(tutorialVideo);
    }
    if (on && tutorialVideo.paused) tutorialVideo.play().catch(() => {});
    if (!on && !tutorialVideo.paused) tutorialVideo.pause();
}
soundButton.addEventListener("click", () => {
    tutorialVideo.muted = !tutorialVideo.muted;
    soundButton.textContent = tutorialVideo.muted ? "Lyd til" : "Lyd fra";
});

playButton.addEventListener("click", () => {
    tutorialWanted = tutorialVideo.paused;
    syncTutorial();
});
tutorialVideo.addEventListener("play", () => { playButton.textContent = "Pause"; });
tutorialVideo.addEventListener("pause", () => { playButton.textContent = "Afspil"; });
addEventListener("scroll", syncTutorial, { passive: true });
syncTutorial();
heroVideo.addEventListener("playing", () => document.body.classList.add("is-playing"));
heroVideo.addEventListener("pause", () => document.body.classList.remove("is-playing"));
syncHero();

const todaySection = document.querySelector(".today");
const todayTrack = document.querySelector(".today-track");
const casesSection = document.querySelector(".cases");
const casesTrack = document.querySelector(".cases-track");
const sampoSection = document.querySelector(".sampo");
const sampoTrack = document.querySelector(".sampo-track");
const embedSection = document.querySelector(".embed");
const embedTrack = document.querySelector(".embed-track");
const embedFrame = document.querySelector(".embed-frame");
const thanksSection = document.querySelector(".thanks");
const thanksTrack = document.querySelector(".thanks-track");
const studioSection = document.querySelector(".studio");
const studioTrack = document.querySelector(".studio-track");
const studioBlocks = [...document.querySelectorAll(".studio-copy")];
const typedLines = [...document.querySelectorAll(".statement-line")];
const typedChars = [];
const typedSwaps = [];
const scrollKeys = new Set([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);
let hasTyped = reduceMotion.matches || phone.matches;

if (!hasTyped) {
    const heard = document.createElement("span");
    heard.className = "visually-hidden";
    heard.textContent = typedLines.map((line) => line.textContent).join(" ");
    typedLines.forEach((line) => {
        const parts = [...line.childNodes];
        line.setAttribute("aria-hidden", "true");
        line.textContent = "";
        parts.forEach((part) => {
            let host = line;
            if (part.nodeType === Node.ELEMENT_NODE) {
                const cut = part.cloneNode(false);
                cut.classList.add("statement-split");
                const fill = document.createElement("span");
                fill.className = "statement-fill";
                fill.setAttribute("aria-hidden", "true");
                fill.textContent = part.textContent;
                host = document.createElement("span");
                host.className = "statement-thin";
                cut.append(host, fill);
                line.append(cut);
                typedSwaps.push(cut);
            }
            for (const letter of part.textContent) {
                const cell = document.createElement("span");
                cell.className = "statement-char";
                cell.textContent = letter;
                host.append(cell);
                typedChars.push(cell);
            }
        });
    });
    typedLines[typedLines.length - 1].after(heard);
}

function blockKeys(event) {
    if (scrollKeys.has(event.key)) event.preventDefault();
}

const rodglodBeat = 0.37;
const carryGlide = 2.4;

function unlockScroll() {
    removeEventListener("keydown", blockKeys);
    lenis?.start();
}
function carryOn() {
    unlockScroll();
    if (!lenis) return;
    const box = studioTrack.getBoundingClientRect();
    const run = box.height - innerHeight;
    const to = scrollY + box.top + run * rodglodBeat;
    if (run <= 0 || to <= scrollY) return;
    lenis.scrollTo(to, {
        duration: carryGlide,
        easing: (t) => t * t * t * (t * (t * 6 - 15) + 10)
    });
}
function runTypewriter() {
    if (hasTyped) return;
    hasTyped = true;
    lenis?.stop();
    addEventListener("keydown", blockKeys, { passive: false });
    let at = 0;
    const tick = () => {
        const cell = typedChars[at];
        cell.classList.add("is-typed");
        at += 1;
        const next = typedChars[at];
        if (!next) {
            setTimeout(() => {
                typedSwaps.forEach((cut) => {
                    cut.classList.add("is-swapped");
                });
            }, 240);
            setTimeout(carryOn, 1760);
            return;
        }
        setTimeout(tick, next.parentNode !== cell.parentNode ? 280
            : cell.textContent === " " ? 22 : 38);
    };
    tick();
}
const studioFilms = [...document.querySelectorAll(".studio-film")];
const printSection = document.querySelector(".print");
const printTrack = document.querySelector(".print-track");
const printLines = [...document.querySelectorAll(".print-rise")];
const printBlocks = [...document.querySelectorAll(".print-words p")];
const sampoBlocks = [...document.querySelectorAll(".sampo-words > *, .brochure-controls")];
const sampoExit = [...document.querySelectorAll(".sampo-words, .brochure")];
const pages = [...document.querySelectorAll(".brochure-page")];
const prevButton = document.querySelector(".brochure-prev");
const nextButton = document.querySelector(".brochure-next");
const pageLabel = document.querySelector(".brochure-count");
let pageAt = 0;

function showPage(to) {
    pageAt = Math.max(0, Math.min(pages.length - 1, to));
    pages.forEach((leaf, i) => {
        const deep = i - pageAt;
        leaf.classList.toggle("is-turned", deep < 0);
        leaf.style.setProperty("--deep", Math.min(Math.max(deep, 0), 3));
        leaf.style.zIndex = String(pages.length - i);
    });
    pageLabel.textContent = `Side ${pageAt + 1} af ${pages.length}`;
    prevButton.disabled = pageAt === 0;
    nextButton.disabled = pageAt === pages.length - 1;
}

prevButton.addEventListener("click", () => showPage(pageAt - 1));
nextButton.addEventListener("click", () => showPage(pageAt + 1));
pages.forEach((leaf, i) => leaf.addEventListener("click", () => {
    showPage(i === pageAt ? pageAt + 1 : i);
}));
showPage(0);
const caseFilms = [...document.querySelectorAll(".case-film")];
const caseBlocks = [...document.querySelectorAll(".case-copy")];

const casesMerge = { from: 0.26, to: 0.32 };
const heroTileWidth = 100;
const caseReel = [
    { fanIn: { from: 0.109, to: 0.15 }, wipeIn: { from: 0.109, to: 0.15 },
      tile: { left: 0, top: 0, width: 66, height: 100 } },
    { fanIn: { from: 0.122, to: 0.163 }, wipeIn: { from: 0.421, to: 0.455 },
      tile: { left: 68, top: 0, width: 32, height: 48.5 } },
    { fanIn: { from: 0.135, to: 0.176 }, wipeIn: { from: 0.578, to: 0.613 },
      tile: { left: 68, top: 51.5, width: 32, height: 48.5 } }
];
const caseCopy = [
    { enter: { from: 0.144, to: 0.184 }, leave: { from: 0.226, to: 0.26 } },
    { enter: { from: 0.301, to: 0.342 }, leave: { from: 0.383, to: 0.417 } },
    { enter: { from: 0.458, to: 0.499 }, leave: { from: 0.54, to: 0.574 } },
    { enter: { from: 0.616, to: 0.65 }, leave: { from: 0.74, to: 0.82 } }
];

function lowData() {
    const net = navigator.connection;
    return Boolean(net?.saveData) || /2g|3g/.test(net?.effectiveType ?? "");
}
function drawCases(progress, awake) {
    const merge = over(progress, casesMerge);
    const merged = merge >= 1;
    casesSection.style.setProperty("--merge", merge);
    caseFilms.forEach((film, i) => {
        const beat = caseReel[i];
        const tile = beat.tile;
        const stacked = i > 0 && merged;
        const lift = over(progress, stacked ? beat.wipeIn : beat.fanIn);
        const width = i === 0 ? between(tile.width, heroTileWidth, merge) : tile.width;
        film.style.setProperty("--lift", lift);
        film.style.setProperty("--tile", stacked ? 0 : tile.left);
        film.style.setProperty("--rise", stacked ? 0 : tile.top);
        film.style.setProperty("--wide", stacked ? 100 : width);
        film.style.setProperty("--tall", stacked ? 100 : tile.height);
        film.style.setProperty("--stack", i ? i + 1 : merged ? 1 : 4);
        const next = caseReel[i + 1];
        const ready = awake && lift > 0;
        const on = ready && merged && (!next || progress < next.wipeIn.to);
        if (ready) wake(film);
        if (on) {
            if (film.paused) film.play().catch(() => {});
        } else if (!film.paused) {
            film.pause();
            film.currentTime = 0;
        }
    });
    caseBlocks.forEach((block, i) => {
        const beat = caseCopy[i];
        block.style.setProperty("--note",
            over(progress, beat.enter) * (1 - over(progress, beat.leave)));
    });
}

function playStudio(awake) {
    studioFilms.forEach((film) => {
        if (awake) wake(film);
        if (awake) {
            if (film.paused) film.play().catch(() => {});
        } else if (!film.paused) {
            film.pause();
        }
    });
}

function ease(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}
function span(value, from, to) {
    return ease((value - from) / (to - from));
}
function over(value, beat) {
    return span(value, beat.from, beat.to);
}
function between(from, to, t) {
    return from + (to - from) * t;
}

let queued = false;
let watching = false;

const embedFrames = [...document.querySelectorAll(".embed-live")];
embedFrames.forEach((pane) => {
    pane.addEventListener("load", () => pane.classList.add("is-loaded"));
});

function setFrameScale() {
    embedFrame.style.setProperty("--shell", embedFrame.clientWidth / 1440);
}

function draw(today, handoff, cases, sampo, printed, studio, embed, thanks) {
    const cover = span(today, 0, 0.11);
    const say = span(today, 0.11, 0.2);
    const leave = span(today, 0.52, 0.62);
    const swap = span(today, 0.6, 0.72);
    const grow = span(today, 0.74, 0.92);
    const creep = span(today, 0.9, 1);

    todaySection.style.setProperty("--cover", cover);
    todaySection.style.setProperty("--swap", swap);
    todaySection.style.setProperty("--grow", grow);
    todaySection.style.setProperty("--creep", creep * 0.15 + ease(handoff) * 0.1);
    todaySection.classList.toggle("today-shown", cover > 0);

    todaySection.style.setProperty("--say", say * (1 - leave));
    todaySection.style.setProperty("--go", leave);
    todaySection.classList.toggle("today-closing", say > 0 && leave < 1);
    casesSection.style.setProperty("--push", handoff);
    casesSection.classList.toggle("cases-ready", handoff >= 1);

    drawCases(cases, handoff >= 1 && printed < 0.3 && !reduceMotion.matches && !lowData());
    casesSection.style.setProperty("--gone", span(cases, 0.7, 0.82));
    casesSection.style.setProperty("--open", span(cases, 0.7, 0.874));
    sampoSection.style.setProperty("--lid", span(sampo, 0.04, 0.26));
    sampoSection.style.setProperty("--fan", span(sampo, 0.34, 0.54));
    sampoExit.forEach((block, i) => {
        block.style.setProperty("--hush", span(sampo, 0.7 + i * 0.04, 0.86 + i * 0.04));
    });
    studioSection.style.setProperty("--shut", span(studio, 0.018, 0.122));
    studioSection.style.setProperty("--own", 1 - span(studio, 0.208, 0.284));
    studioSection.style.setProperty("--drift", span(studio, 0.048, 0.207));
    if (studio > 0.142 && studio < 0.424) runTypewriter();
    studioSection.style.setProperty("--lens", span(studio, 0.235, 0.33));
    studioSection.style.setProperty("--turn", span(studio, 0.424, 0.518));
    studioSection.style.setProperty("--veer", span(studio, 0.612, 0.707));
    studioBlocks.forEach((block, i) => {
        const show = span(studio, i ? 0.641 : 0.254, i ? 0.735 : 0.349);
        const hide = span(studio, i ? 0.825 : 0.602, i ? 0.891 : 0.669);
        block.style.setProperty("--glow", show * (1 - hide));
    });
    embedSection.style.setProperty("--pane", span(embed, 0.1, 0.423));
    embedSection.style.setProperty("--read", span(embed, 0.197, 0.517));
    embedSection.style.setProperty("--dim", span(embed, 0.45, 0.62));
    thanksSection.style.setProperty("--curtain", span(thanks, 0.04, 0.28));
    thanksSection.style.setProperty("--fade", span(thanks, 0.48, 0.68));
    thanksSection.style.setProperty("--greet", span(thanks, 0.58, 0.76));
    playStudio(studio > 0.2 && studio < 0.99 && !reduceMotion.matches && !lowData());
    sampoBlocks.forEach((block, i) => {
        block.style.setProperty("--read", span(sampo, 0.28 + i * 0.05, 0.46 + i * 0.05));
    });
    printSection.style.setProperty("--slide", span(printed, 0.04, 0.20));
    printSection.style.setProperty("--lay", span(printed, 0.56, 0.73));
    printSection.style.setProperty("--away", span(printed, 0.72, 0.84));
    printLines.forEach((line, i) => {
        line.style.setProperty("--tell", span(printed, 0.22 + i * 0.045, 0.38 + i * 0.045));
    });
    printBlocks.forEach((block, i) => {
        block.style.setProperty("--tale", span(printed, 0.34 + i * 0.1, 0.5 + i * 0.1));
    });
}

function measure() {
    if (phone.matches) return;
    const box = todayTrack.getBoundingClientRect();
    const nextBox = casesTrack.getBoundingClientRect();
    const run = box.height - innerHeight;
    const scrolled = -box.top;
    const soloRun = nextBox.top - box.top;
    const today = soloRun > 0 ? clamp(scrolled / soloRun) : 0;
    const handoff = run > soloRun ? clamp((scrolled - soloRun) / (run - soloRun)) : 0;
    draw(today, handoff, trackProgress(casesTrack, 0), trackProgress(sampoTrack, 0),
        trackProgress(printTrack, 0), trackProgress(studioTrack, 0),
        trackProgress(embedTrack, 0), trackProgress(thanksTrack, 0));
}
function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
        queued = false;
        measure();
    });
}


const visible = new Set();
const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
    }
    watching = visible.size > 0;
    if (watching) schedule();
}, { rootMargin: "20% 0px" });
observer.observe(todayTrack);
observer.observe(casesTrack);
observer.observe(sampoTrack);
observer.observe(printTrack);
observer.observe(studioTrack);
observer.observe(embedTrack);
observer.observe(thanksTrack);
function playVisible() {
    const calm = reduceMotion.matches || lowData();
    [heroVideo, ...caseFilms, ...studioFilms].forEach((film) => {
        if (!calm && onScreen.has(film)) {
            wake(film);
            if (film.paused) film.play().catch(() => {});
        } else if (!film.paused) {
            film.pause();
        }
    });
    syncTutorial();
}

const inFrame = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
    }
    if (phone.matches) playVisible();
}, { threshold: 0.4 });
[heroVideo, tutorialVideo, ...caseFilms, ...studioFilms].forEach((film) => {
    inFrame.observe(film);
});

const railDecks = [
    { rail: document.querySelector(".panels"), label: "Mit jeg" },
    { rail: document.querySelector(".cases-stage"), label: "Mit arbejde" },
    { rail: document.querySelector(".sampo-stage"), label: "På tryk" },
    { rail: document.querySelector(".studio-stage"), label: "StudioKimberley" }
];
const folds = [
    { from: document.querySelector(".today-stage"), into: railDecks[1].rail, lead: true },
    { from: document.querySelector(".print-stage"), into: railDecks[2].rail, lead: true },
    { from: document.querySelector(".embed-stage"), into: railDecks[3].rail, lead: false }
].map((fold) => ({ ...fold, kids: [...fold.from.children] }));

function markCard(deck) {
    const at = Math.round(deck.rail.scrollLeft / deck.rail.clientWidth);
    [...deck.dots.children].forEach((dot, i) => dot.classList.toggle("is-at", i === at));
}
function addDots(deck) {
    const cards = getComputedStyle(deck.rail).gridTemplateColumns.split(" ").length;
    const strip = document.createElement("span");
    const pill = document.createElement("span");
    strip.className = "rail-dots";
    strip.setAttribute("aria-hidden", "true");
    for (let i = 0; i < cards; i += 1) pill.append(document.createElement("i"));
    strip.append(pill);
    deck.rail.prepend(strip);
    deck.dots = pill;
    deck.rail.addEventListener("scroll", () => markCard(deck), { passive: true });
    markCard(deck);
}

let folded = false;
function setDeck(on) {
    if (on === folded) return;
    folded = on;
    folds.forEach((fold) => {
        if (!on) fold.from.append(...fold.kids);
        else if (fold.lead) fold.into.prepend(...fold.kids);
        else fold.into.append(...fold.kids);
    });
    railDecks.forEach((deck) => {
        if (!on) {
            deck.rail.removeAttribute("tabindex");
            deck.rail.removeAttribute("role");
            deck.rail.removeAttribute("aria-label");
            return;
        }
        deck.rail.tabIndex = 0;
        deck.rail.setAttribute("role", "region");
        deck.rail.setAttribute("aria-label", deck.label);
        if (!deck.dots) addDots(deck);
    });
}
setDeck(phone.matches);
phone.addEventListener("change", (event) => setDeck(event.matches));

addEventListener("scroll", () => { if (watching) schedule(); }, { passive: true });
addEventListener("resize", () => { setFrameScale(); schedule(); }, { passive: true });
setFrameScale();
schedule();
