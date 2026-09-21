var k="1.1.18";function w(r,t,e){return Math.max(r,Math.min(t,e))}function W(r,t,e){return(1-e)*r+e*t}function z(r,t,e,i){return W(r,t,1-Math.exp(-e*i))}function x(r,t){return(r%t+t)%t}var y=class{isRunning=!1;value=0;from=0;to=0;currentTime=0;lerp;duration;easing;onUpdate;advance(t){if(!this.isRunning)return;let e=!1;if(this.duration&&this.easing){this.currentTime+=t;let i=w(0,this.currentTime/this.duration,1);e=i>=1;let s=e?1:this.easing(i);this.value=this.from+(this.to-this.from)*s}else this.lerp?(this.value=z(this.value,this.to,this.lerp*60,t),Math.round(this.value)===this.to&&(this.value=this.to,e=!0)):(this.value=this.to,e=!0);e&&this.stop(),this.onUpdate?.(this.value,e)}stop(){this.isRunning=!1}fromTo(t,e,{lerp:i,duration:s,easing:o,onStart:l,onUpdate:h}){this.from=this.value=t,this.to=e,this.lerp=i,this.duration=s,this.easing=o,this.currentTime=0,this.isRunning=!0,l?.(),this.onUpdate=h}};function R(r,t){let e;return function(...i){let s=this;clearTimeout(e),e=setTimeout(()=>{e=void 0,r.apply(s,i)},t)}}var E=class{constructor(t,e,{autoResize:i=!0,debounce:s=250}={}){this.wrapper=t;this.content=e;i&&(this.debouncedResize=R(this.resize,s),this.wrapper instanceof Window?window.addEventListener("resize",this.debouncedResize,!1):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}width=0;height=0;scrollHeight=0;scrollWidth=0;debouncedResize;wrapperResizeObserver;contentResizeObserver;destroy(){this.wrapperResizeObserver?.disconnect(),this.contentResizeObserver?.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener("resize",this.debouncedResize,!1)}resize=()=>{this.onWrapperResize(),this.onContentResize()};onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)};onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)};get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}};var f=class{events={};emit(t,...e){let i=this.events[t]||[];for(let s=0,o=i.length;s<o;s++)i[s]?.(...e)}on(t,e){return this.events[t]?.push(e)||(this.events[t]=[e]),()=>{this.events[t]=this.events[t]?.filter(i=>e!==i)}}off(t,e){this.events[t]=this.events[t]?.filter(i=>e!==i)}destroy(){this.events={}}};var _=100/6,u={passive:!1},T=class{constructor(t,e={wheelMultiplier:1,touchMultiplier:1}){this.element=t;this.options=e;window.addEventListener("resize",this.onWindowResize,!1),this.onWindowResize(),this.element.addEventListener("wheel",this.onWheel,u),this.element.addEventListener("touchstart",this.onTouchStart,u),this.element.addEventListener("touchmove",this.onTouchMove,u),this.element.addEventListener("touchend",this.onTouchEnd,u)}touchStart={x:0,y:0};lastDelta={x:0,y:0};window={width:0,height:0};emitter=new f;on(t,e){return this.emitter.on(t,e)}destroy(){this.emitter.destroy(),window.removeEventListener("resize",this.onWindowResize,!1),this.element.removeEventListener("wheel",this.onWheel,u),this.element.removeEventListener("touchstart",this.onTouchStart,u),this.element.removeEventListener("touchmove",this.onTouchMove,u),this.element.removeEventListener("touchend",this.onTouchEnd,u)}onTouchStart=t=>{let{clientX:e,clientY:i}=t.targetTouches?t.targetTouches[0]:t;this.touchStart.x=e,this.touchStart.y=i,this.lastDelta={x:0,y:0},this.emitter.emit("scroll",{deltaX:0,deltaY:0,event:t})};onTouchMove=t=>{let{clientX:e,clientY:i}=t.targetTouches?t.targetTouches[0]:t,s=-(e-this.touchStart.x)*this.options.touchMultiplier,o=-(i-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=e,this.touchStart.y=i,this.lastDelta={x:s,y:o},this.emitter.emit("scroll",{deltaX:s,deltaY:o,event:t})};onTouchEnd=t=>{this.emitter.emit("scroll",{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:t})};onWheel=t=>{let{deltaX:e,deltaY:i,deltaMode:s}=t,o=s===1?_:s===2?this.window.width:1,l=s===1?_:s===2?this.window.height:1;e*=o,i*=l,e*=this.options.wheelMultiplier,i*=this.options.wheelMultiplier,this.emitter.emit("scroll",{deltaX:e,deltaY:i,event:t})};onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}}};var L=class{_isScrolling=!1;_isStopped=!1;_isLocked=!1;_preventNextNativeScrollEvent=!1;_resetVelocityTimeout=null;__rafID=null;isTouching;time=0;userData={};lastVelocity=0;velocity=0;direction=0;options;targetScroll;animatedScroll;animate=new y;emitter=new f;dimensions;virtualScroll;constructor({wrapper:t=window,content:e=document.documentElement,eventsTarget:i=t,smoothWheel:s=!0,syncTouch:o=!1,syncTouchLerp:l=.075,touchInertiaMultiplier:h=35,duration:S,easing:d=H=>Math.min(1,1.001-Math.pow(2,-10*H)),lerp:c=.1,infinite:p=!1,orientation:b="vertical",gestureOrientation:n="vertical",touchMultiplier:a=1,wheelMultiplier:v=1,autoResize:g=!0,prevent:m,virtualScroll:N,overscroll:M=!0,autoRaf:O=!1,__experimental__naiveDimensions:D=!1}={}){window.lenisVersion=k,(!t||t===document.documentElement||t===document.body)&&(t=window),this.options={wrapper:t,content:e,eventsTarget:i,smoothWheel:s,syncTouch:o,syncTouchLerp:l,touchInertiaMultiplier:h,duration:S,easing:d,lerp:c,infinite:p,gestureOrientation:n,orientation:b,touchMultiplier:a,wheelMultiplier:v,autoResize:g,prevent:m,virtualScroll:N,overscroll:M,autoRaf:O,__experimental__naiveDimensions:D},this.dimensions=new E(t,e,{autoResize:g}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.addEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll=new T(i,{touchMultiplier:a,wheelMultiplier:v}),this.virtualScroll.on("scroll",this.onVirtualScroll),this.options.autoRaf&&(this.__rafID=requestAnimationFrame(this.raf))}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener("scroll",this.onNativeScroll,!1),this.options.wrapper.removeEventListener("pointerdown",this.onPointerDown,!1),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName(),this.__rafID&&cancelAnimationFrame(this.__rafID)}on(t,e){return this.emitter.on(t,e)}off(t,e){return this.emitter.off(t,e)}setScroll(t){this.isHorizontal?this.rootElement.scrollLeft=t:this.rootElement.scrollTop=t}onPointerDown=t=>{t.button===1&&this.reset()};onVirtualScroll=t=>{if(typeof this.options.virtualScroll=="function"&&this.options.virtualScroll(t)===!1)return;let{deltaX:e,deltaY:i,event:s}=t;if(this.emitter.emit("virtual-scroll",{deltaX:e,deltaY:i,event:s}),s.ctrlKey||s.lenisStopPropagation)return;let o=s.type.includes("touch"),l=s.type.includes("wheel");this.isTouching=s.type==="touchstart"||s.type==="touchmove";let h=e===0&&i===0;if(this.options.syncTouch&&o&&s.type==="touchstart"&&h&&!this.isStopped&&!this.isLocked){this.reset();return}let d=this.options.gestureOrientation==="vertical"&&i===0||this.options.gestureOrientation==="horizontal"&&e===0;if(h||d)return;let c=s.composedPath();c=c.slice(0,c.indexOf(this.rootElement));let p=this.options.prevent;if(c.find(m=>m instanceof HTMLElement&&(typeof p=="function"&&p?.(m)||m.hasAttribute?.("data-lenis-prevent")||o&&m.hasAttribute?.("data-lenis-prevent-touch")||l&&m.hasAttribute?.("data-lenis-prevent-wheel"))))return;if(this.isStopped||this.isLocked){s.preventDefault();return}if(!(this.options.syncTouch&&o||this.options.smoothWheel&&l)){this.isScrolling="native",this.animate.stop(),s.lenisStopPropagation=!0;return}let n=i;this.options.gestureOrientation==="both"?n=Math.abs(i)>Math.abs(e)?i:e:this.options.gestureOrientation==="horizontal"&&(n=e),(!this.options.overscroll||this.options.infinite||this.options.wrapper!==window&&(this.animatedScroll>0&&this.animatedScroll<this.limit||this.animatedScroll===0&&i>0||this.animatedScroll===this.limit&&i<0))&&(s.lenisStopPropagation=!0),s.preventDefault();let a=o&&this.options.syncTouch,g=o&&s.type==="touchend"&&Math.abs(n)>5;g&&(n=this.velocity*this.options.touchInertiaMultiplier),this.scrollTo(this.targetScroll+n,{programmatic:!1,...a?{lerp:g?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}})};resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit("scroll",this)}onNativeScroll=()=>{if(this._resetVelocityTimeout!==null&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent){this._preventNextNativeScrollEvent=!1;return}if(this.isScrolling===!1||this.isScrolling==="native"){let t=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-t,this.direction=Math.sign(this.animatedScroll-t),this.isStopped||(this.isScrolling="native"),this.emit(),this.velocity!==0&&(this._resetVelocityTimeout=setTimeout(()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()},400))}};reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){this.isStopped&&(this.reset(),this.isStopped=!1)}stop(){this.isStopped||(this.reset(),this.isStopped=!0)}raf=t=>{let e=t-(this.time||t);this.time=t,this.animate.advance(e*.001),this.options.autoRaf&&(this.__rafID=requestAnimationFrame(this.raf))};scrollTo(t,{offset:e=0,immediate:i=!1,lock:s=!1,duration:o=this.options.duration,easing:l=this.options.easing,lerp:h=this.options.lerp,onStart:S,onComplete:d,force:c=!1,programmatic:p=!0,userData:b}={}){if(!((this.isStopped||this.isLocked)&&!c)){if(typeof t=="string"&&["top","left","start"].includes(t))t=0;else if(typeof t=="string"&&["bottom","right","end"].includes(t))t=this.limit;else{let n;if(typeof t=="string"?n=document.querySelector(t):t instanceof HTMLElement&&t?.nodeType&&(n=t),n){if(this.options.wrapper!==window){let v=this.rootElement.getBoundingClientRect();e-=this.isHorizontal?v.left:v.top}let a=n.getBoundingClientRect();t=(this.isHorizontal?a.left:a.top)+this.animatedScroll}}if(typeof t=="number"){if(t+=e,t=Math.round(t),this.options.infinite?p&&(this.targetScroll=this.animatedScroll=this.scroll):t=w(0,t,this.limit),t===this.targetScroll){S?.(this),d?.(this);return}if(this.userData=b??{},i){this.animatedScroll=this.targetScroll=t,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),d?.(this),this.userData={};return}p||(this.targetScroll=t),this.animate.fromTo(this.animatedScroll,t,{duration:o,easing:l,lerp:h,onStart:()=>{s&&(this.isLocked=!0),this.isScrolling="smooth",S?.(this)},onUpdate:(n,a)=>{this.isScrolling="smooth",this.lastVelocity=this.velocity,this.velocity=n-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=n,this.setScroll(this.scroll),p&&(this.targetScroll=n),a||this.emit(),a&&(this.reset(),this.emit(),d?.(this),this.userData={},this.preventNextNativeScrollEvent())}})}}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame(()=>{this._preventNextNativeScrollEvent=!1})}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.__experimental__naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?"x":"y"]}get isHorizontal(){return this.options.orientation==="horizontal"}get actualScroll(){return this.isHorizontal?this.rootElement.scrollLeft:this.rootElement.scrollTop}get scroll(){return this.options.infinite?x(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return this.limit===0?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(t){this._isScrolling!==t&&(this._isScrolling=t,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(t){this._isStopped!==t&&(this._isStopped=t,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(t){this._isLocked!==t&&(this._isLocked=t,this.updateClassName())}get isSmooth(){return this.isScrolling==="smooth"}get className(){let t="lenis";return this.isStopped&&(t+=" lenis-stopped"),this.isLocked&&(t+=" lenis-locked"),this.isScrolling&&(t+=" lenis-scrolling"),this.isScrolling==="smooth"&&(t+=" lenis-smooth"),t}updateClassName(){this.cleanUpClassName(),this.rootElement.className=`${this.rootElement.className} ${this.className}`.trim()}cleanUpClassName(){this.rootElement.className=this.rootElement.className.replace(/lenis(-\w+)?/g,"").trim()}};globalThis.Lenis=L;

const kimberleyFilm = document.querySelector(".kimberley-window-film");
const kimberleyTrack = document.querySelector(".kimberley-track");
const kimberleyCalm = matchMedia("(prefers-reduced-motion: reduce)");
function kimberleyRein(move) {
    const gulp = innerHeight * 0.9;
    const slack = innerHeight * 1.6;
    const lead = kimberleyGlide.targetScroll - kimberleyGlide.animatedScroll;
    let step = Math.max(-gulp, Math.min(gulp, move.deltaY));
    if (lead + step > slack) step = Math.max(0, slack - lead);
    if (lead + step < -slack) step = Math.min(0, -slack - lead);
    move.deltaY = step;
    return true;
}

const kimberleyGlide = kimberleyCalm.matches ? null : new Lenis({
    lerp: 0.055,
    wheelMultiplier: 0.75,
    touchMultiplier: 1.4,
    anchors: false,
    syncTouch: false,
    autoRaf: true,
    virtualScroll: kimberleyRein
});

function kimberleyShare() {
    const box = kimberleyTrack.getBoundingClientRect();
    const run = box.height - innerHeight;
    return run > 0 ? Math.min(Math.max(-box.top / run, 0), 1) : 1;
}

function kimberleySync() {
    const share = kimberleyShare();
    const run = share > 0.072 && !kimberleyCalm.matches && !navigator.connection?.saveData;
    if (run && kimberleyFilm.paused) kimberleyFilm.play().catch(() => {});
    if (!run && !kimberleyFilm.paused) kimberleyFilm.pause();
}
addEventListener("load", () => {
    const net = navigator.connection;
    const thin = net?.saveData || /2g|3g/.test(net?.effectiveType ?? "");
    if (kimberleyCalm.matches || thin) return;
    kimberleyFilm.preload = "auto";
    kimberleyFilm.load();
});
const kimberleyJump = [...document.querySelectorAll(".kimberley-jump a")];
const kimberleyMarks = kimberleyJump.map((a) => document.querySelector(a.getAttribute("href")));
function kimberleyHere() {
    let at = 0;
    kimberleyMarks.forEach((mark, i) => {
        if (mark.getBoundingClientRect().top <= innerHeight * 0.5) at = i;
    });
    kimberleyJump.forEach((a, i) => {
        if (i === at) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
    });
}
kimberleyJump.forEach((a, i) => a.addEventListener("click", (event) => {
    const mark = kimberleyMarks[i];
    if (!mark) return;
    event.preventDefault();
    document.body.classList.add("kimberley-veiled");
    setTimeout(() => {
        const to = scrollY + mark.getBoundingClientRect().top;
        if (kimberleyGlide) kimberleyGlide.scrollTo(to, { immediate: true });
        else scrollTo({ top: to, behavior: "instant" });
        kimberleyHere();
        requestAnimationFrame(() => requestAnimationFrame(
            () => document.body.classList.remove("kimberley-veiled")));
    }, 380);
}));
addEventListener("scroll", () => { kimberleySync(); kimberleyHere(); }, { passive: true });
kimberleyHere();
const kimberleyBukkit = document.querySelector(".kimberley-mid-film");
const kimberleySound = document.querySelector(".kimberley-mid-sound");
const kimberleyHold = document.querySelector(".kimberley-mid-hold");
let kimberleyArmed = false;
let kimberleyWish = null;
function kimberleyBeat() {
    const share = kimberleyShare();
    const near = share > 0.633 && share < 0.773;
    if (!near) kimberleyWish = null;
    const on = kimberleyWish === null ? near && !kimberleyCalm.matches : kimberleyWish;
    if (on && !kimberleyArmed) {
        kimberleyArmed = true;
        kimberleyBukkit.preload = "auto";
        kimberleyBukkit.load();
    }
    if (on && kimberleyBukkit.paused) kimberleyBukkit.play().catch(() => {});
    if (!on && !kimberleyBukkit.paused) kimberleyBukkit.pause();
}
kimberleySound.addEventListener("click", () => {
    kimberleyBukkit.muted = !kimberleyBukkit.muted;
    kimberleySound.textContent = kimberleyBukkit.muted ? "Lyd til" : "Lyd fra";
});

const kimberleyLaura = document.querySelector(".kimberley-end-next");
const kimberleyLauraSound = document.querySelector(".kimberley-end-sound");
kimberleyLauraSound.addEventListener("click", () => {
    kimberleyLaura.muted = !kimberleyLaura.muted;
    kimberleyLauraSound.textContent = kimberleyLaura.muted ? "Lyd til" : "Lyd fra";
});
kimberleyHold.addEventListener("click", () => {
    kimberleyWish = kimberleyBukkit.paused;
    kimberleyBeat();
});
kimberleyBukkit.addEventListener("play", () => { kimberleyHold.textContent = "Pause"; });
kimberleyBukkit.addEventListener("pause", () => { kimberleyHold.textContent = "Afspil"; });
addEventListener("scroll", kimberleyBeat, { passive: true });
kimberleyBeat();
kimberleyFilm.addEventListener("playing", () => document.body.classList.add("kimberley-is-running"));
kimberleyFilm.addEventListener("pause", () => document.body.classList.remove("kimberley-is-running"));
kimberleySync();

const kimberleySection = document.querySelector(".kimberley-work");
const kimberleyWorkTrack = document.querySelector(".kimberley-work-track");
const kimberleyNext = document.querySelector(".kimberley-next");
const kimberleyNextTrack = document.querySelector(".kimberley-next-track");
const kimberleyVote = document.querySelector(".kimberley-vote");
const kimberleyVoteTrack = document.querySelector(".kimberley-vote-track");
const kimberleyEnd = document.querySelector(".kimberley-end");
const kimberleyEndTrack = document.querySelector(".kimberley-end-track");
const kimberleyEndSaid = [...document.querySelectorAll(".kimberley-end-said")];
const kimberleyOwnLines = [...document.querySelectorAll(".kimberley-end-own-rise")];
const kimberleyEndFilms = [...document.querySelectorAll(".kimberley-end-film")];
const kimberleyLast = document.querySelector(".kimberley-last");
const kimberleyLastTrack = document.querySelector(".kimberley-last-track");
const kimberleyLastLines = [...document.querySelectorAll(".kimberley-last-rise")];
const kimberleyLastSaid = [...document.querySelectorAll(".kimberley-last-words p")];
const kimberleyVoteSaid = [...document.querySelectorAll(".kimberley-vote-words > *, .kimberley-vote-keys")];
const kimberleyVoteOut = [...document.querySelectorAll(".kimberley-vote-words, .kimberley-vote-book")];
const kimberleyLeaves = [...document.querySelectorAll(".kimberley-vote-leaf")];
const kimberleyBack = document.querySelector(".kimberley-vote-back");
const kimberleyOn = document.querySelector(".kimberley-vote-on");
const kimberleyPage = document.querySelector(".kimberley-vote-page");
let kimberleyLeaf = 0;

function kimberleyTurn(to) {
    kimberleyLeaf = Math.max(0, Math.min(kimberleyLeaves.length - 1, to));
    kimberleyLeaves.forEach((leaf, i) => {
        const deep = i - kimberleyLeaf;
        leaf.classList.toggle("kimberley-vote-turned", deep < 0);
        leaf.style.setProperty("--kimberley-deep", Math.min(Math.max(deep, 0), 3));
        leaf.style.zIndex = String(kimberleyLeaves.length - i);
    });
    kimberleyPage.textContent = `Side ${kimberleyLeaf + 1} af ${kimberleyLeaves.length}`;
    kimberleyBack.disabled = kimberleyLeaf === 0;
    kimberleyOn.disabled = kimberleyLeaf === kimberleyLeaves.length - 1;
}

kimberleyBack.addEventListener("click", () => kimberleyTurn(kimberleyLeaf - 1));
kimberleyOn.addEventListener("click", () => kimberleyTurn(kimberleyLeaf + 1));
kimberleyLeaves.forEach((leaf, i) => leaf.addEventListener("click", () => {
    kimberleyTurn(i === kimberleyLeaf ? kimberleyLeaf + 1 : i);
}));
kimberleyTurn(0);
const kimberleyFilms = [...document.querySelectorAll(".kimberley-next-film")];
const kimberleySaid = [...document.querySelectorAll(".kimberley-next-said")];

const kimberleyWipes = [[0.109, 0.15], [0.421, 0.455], [0.578, 0.613]];
const kimberleyBeats = [[0.144, 0.184, 0.226, 0.26], [0.301, 0.342, 0.383, 0.417],
    [0.458, 0.499, 0.54, 0.574], [0.616, 0.65, 0.74, 0.82]];

function kimberleyThin() {
    const net = navigator.connection;
    return Boolean(net?.saveData) || /2g|3g/.test(net?.effectiveType ?? "");
}
function kimberleyReel(told, awake) {
    kimberleyFilms.forEach((film, i) => {
        const wipe = kimberleyWipes[i];
        const lift = kimberleySpan(told, wipe[0], wipe[1]);
        film.style.setProperty("--kimberley-lift", lift);
        const next = kimberleyWipes[i + 1];
        const on = awake && lift > 0 && (!next || told < next[1]);
        if (on && film.preload === "none") {
            film.preload = "auto";
            film.load();
        }
        if (on) {
            if (film.paused) film.play().catch(() => {});
        } else if (!film.paused) {
            film.pause();
            film.currentTime = 0;
        }
    });
    kimberleySaid.forEach((block, i) => {
        const beat = kimberleyBeats[i];
        const show = kimberleySpan(told, beat[0], beat[1]);
        const hide = kimberleySpan(told, beat[2], beat[3]);
        block.style.setProperty("--kimberley-note", show * (1 - hide));
    });
}

function kimberleyStudio(awake) {
    kimberleyEndFilms.forEach((film) => {
        if (awake && film.preload === "none") {
            film.preload = "auto";
            film.load();
        }
        if (awake) {
            if (film.paused) film.play().catch(() => {});
        } else if (!film.paused) {
            film.pause();
        }
    });
}

function kimberleyEase(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}
function kimberleySpan(value, from, to) {
    return kimberleyEase((value - from) / (to - from));
}

let queued = false;
let watching = false;

function kimberleyDraw(share, push, told, vote, last, end) {
    const cover = kimberleySpan(share, 0, 0.145);
    const say = kimberleySpan(share, 0.145, 0.24);
    const leave = kimberleySpan(share, 0.46, 0.56);
    const swap = kimberleySpan(share, 0.54, 0.68);
    const grow = kimberleySpan(share, 0.7, 0.9);
    const creep = kimberleySpan(share, 0.9, 1);

    kimberleySection.style.setProperty("--kimberley-cover", cover);
    kimberleySection.style.setProperty("--kimberley-swap", swap);
    kimberleySection.style.setProperty("--kimberley-grow", grow);
    kimberleySection.style.setProperty("--kimberley-creep", creep * 0.15 + kimberleyEase(push) * 0.1);
    kimberleySection.classList.toggle("kimberley-work-show", cover > 0);

    kimberleySection.style.setProperty("--kimberley-say", say * (1 - leave));
    kimberleySection.style.setProperty("--kimberley-go", leave);
    kimberleySection.classList.toggle("kimberley-work-close", say > 0 && leave < 1);
    kimberleyNext.style.setProperty("--kimberley-push", push);
    kimberleyNext.classList.toggle("kimberley-next-covered", push >= 1);

    kimberleyReel(told, push >= 1 && last < 0.3 && !kimberleyCalm.matches && !kimberleyThin());
    kimberleyNext.style.setProperty("--kimberley-gone", kimberleySpan(told, 0.7, 0.82));
    kimberleyNext.style.setProperty("--kimberley-near", kimberleySpan(told, 0.7, 0.874));
    kimberleyNext.style.setProperty("--kimberley-open", kimberleySpan(told, 0.7, 0.874));
    kimberleyVote.style.setProperty("--kimberley-lid", kimberleySpan(vote, 0.04, 0.26));
    kimberleyVote.style.setProperty("--kimberley-fan", kimberleySpan(vote, 0.34, 0.54));
    kimberleyVoteOut.forEach((out, i) => {
        out.style.setProperty("--kimberley-hush", kimberleySpan(vote, 0.7 + i * 0.04, 0.86 + i * 0.04));
    });
    kimberleyEnd.style.setProperty("--kimberley-shut", kimberleySpan(end, 0.03, 0.18));
    kimberleyEnd.style.setProperty("--kimberley-own", 1 - kimberleySpan(end, 0.58, 0.66));
    kimberleyEnd.style.setProperty("--kimberley-sign", kimberleySpan(end, 0.2, 0.34));
    kimberleyOwnLines.forEach((line, i) => {
        line.style.setProperty("--kimberley-tell", kimberleySpan(end, 0.32 + i * 0.035, 0.42 + i * 0.035));
    });
    kimberleyEnd.style.setProperty("--kimberley-lens", kimberleySpan(end, 0.62, 0.74));
    kimberleyEnd.style.setProperty("--kimberley-turn", kimberleySpan(end, 0.84, 0.94));
    kimberleyEndSaid.forEach((said, i) => {
        const show = kimberleySpan(end, i ? 0.86 : 0.66, i ? 0.95 : 0.76);
        const hide = i ? 0 : kimberleySpan(end, 0.82, 0.89);
        said.style.setProperty("--kimberley-glow", show * (1 - hide));
    });
    kimberleyStudio(end > 0.55 && end < 0.995 && !kimberleyCalm.matches && !kimberleyThin());
    kimberleyVoteSaid.forEach((said, i) => {
        said.style.setProperty("--kimberley-read", kimberleySpan(vote, 0.28 + i * 0.05, 0.46 + i * 0.05));
    });
    kimberleyLast.style.setProperty("--kimberley-slide", kimberleySpan(last, 0.04, 0.20));
    kimberleyLast.style.setProperty("--kimberley-lay", kimberleySpan(last, 0.56, 0.73));
    kimberleyLast.style.setProperty("--kimberley-away", kimberleySpan(last, 0.72, 0.84));
    kimberleyLastLines.forEach((line, i) => {
        line.style.setProperty("--kimberley-tell", kimberleySpan(last, 0.22 + i * 0.045, 0.38 + i * 0.045));
    });
    kimberleyLastSaid.forEach((said, i) => {
        said.style.setProperty("--kimberley-tale", kimberleySpan(last, 0.34 + i * 0.1, 0.5 + i * 0.1));
    });
}

function kimberleyTick() {
    const box = kimberleyWorkTrack.getBoundingClientRect();
    const next = kimberleyNextTrack.getBoundingClientRect();
    const run = box.height - innerHeight;
    const gone = -box.top;
    const solo = next.top - box.top;
    const nextRun = next.height - innerHeight;
    const share = solo > 0 ? Math.min(Math.max(gone / solo, 0), 1) : 0;
    const push = run > solo ? Math.min(Math.max((gone - solo) / (run - solo), 0), 1) : 0;
    const told = nextRun > 0 ? Math.min(Math.max(-next.top / nextRun, 0), 1) : 0;
    const poll = kimberleyVoteTrack.getBoundingClientRect();
    const pollRun = poll.height - innerHeight;
    const vote = pollRun > 0 ? Math.min(Math.max(-poll.top / pollRun, 0), 1) : 0;
    const shut = kimberleyEndTrack.getBoundingClientRect();
    const shutRun = shut.height - innerHeight;
    const end = shutRun > 0 ? Math.min(Math.max(-shut.top / shutRun, 0), 1) : 0;
    const tail = kimberleyLastTrack.getBoundingClientRect();
    const tailRun = tail.height - innerHeight;
    const last = tailRun > 0 ? Math.min(Math.max(-tail.top / tailRun, 0), 1) : 0;
    kimberleyDraw(share, push, told, vote, last, end);
}
function kimberleyQueue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
        queued = false;
        kimberleyTick();
    });
}

document.documentElement.classList.add("kimberley-push");

const seen = new Set();
const eye = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) seen.add(entry.target);
        else seen.delete(entry.target);
    }
    watching = seen.size > 0;
    if (watching) kimberleyQueue();
}, { rootMargin: "20% 0px" });
eye.observe(kimberleyWorkTrack);
eye.observe(kimberleyNextTrack);
eye.observe(kimberleyVoteTrack);
eye.observe(kimberleyLastTrack);
eye.observe(kimberleyEndTrack);
addEventListener("scroll", () => { if (watching) kimberleyQueue(); }, { passive: true });
addEventListener("resize", kimberleyQueue, { passive: true });
kimberleyQueue();
