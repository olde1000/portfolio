(function () {
  try {
    var cv = document.getElementById('kimberleyFireWash');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, embers = [];
    var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
    var sstep = function (a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    var resize = function () {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    for (var i = 0; i < 90; i++) embers.push({ a: Math.random() * 6.2832, r: Math.random(), sp: 0.35 + Math.random() * 1.1, sz: 0.6 + Math.random() * 2.2, ph: Math.random() * 6.2832 });
    var t0 = null;
    var frame = function (now) {
      requestAnimationFrame(frame);
      if (t0 === null) t0 = now;
      var ts = (now - t0) / 1000;
      var P = window.kimberleyOutro || 0;
      ctx.clearRect(0, 0, W, H);
      if (P <= 0.001) return;
      var ix = W * 0.68, iy = H * 0.5;
      var bloom = sstep(0.30, 0.64, P), recede = sstep(0.80, 1.0, P);
      var alpha = bloom * (1 - recede);
      var flash = Math.max(0, 1 - Math.abs(P - 0.30) / 0.05);
      if (flash > 0) { ctx.fillStyle = 'rgba(255,250,240,' + (flash * 0.9).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
      if (alpha <= 0.001) return;
      var flick = 0.88 + 0.12 * Math.sin(ts * 30) * Math.sin(ts * 12.3);
      var seal = Math.min(1, sstep(0.48, 0.64, P) * 1.05) * (1 - recede);
      ctx.fillStyle = 'rgba(120,16,8,' + seal.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      var rad = Math.max(1, bloom * Math.hypot(W, H) * 1.15), ha = alpha * flick;
      var g = ctx.createRadialGradient(ix, iy, 0, ix, iy, rad);
      g.addColorStop(0, 'rgba(255,244,214,' + ha.toFixed(3) + ')');
      g.addColorStop(0.18, 'rgba(255,160,50,' + (ha * 0.95).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(226,52,18,' + (ha * 0.85).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(90,6,4,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (var e = 0; e < embers.length; e++) {
        var p = embers[e];
        var life = (ts * p.sp + p.r) % 1;
        var ex = ix + Math.cos(p.a) * life * W * 0.5 * (0.3 + p.r);
        var ey = iy - life * H * 0.62 + Math.sin(ts * 2 + p.ph) * 8;
        var ea = alpha * (1 - life) * 0.8;
        if (ea > 0.02) { ctx.fillStyle = 'rgba(255,' + (150 + Math.floor(80 * p.r)) + ',60,' + ea.toFixed(3) + ')'; ctx.fillRect(ex, ey, p.sz, p.sz); }
      }
      ctx.globalCompositeOperation = 'source-over';
      var logoA = sstep(0.58, 0.70, P) * (1 - sstep(0.84, 0.94, P));
      if (logoA > 0.01) {
        var narrow = W < 640;
        var lfs = narrow ? Math.min(W * 0.088, 40) : Math.max(20, Math.min(W * 0.039, 50));
        ctx.font = '400 ' + lfs + 'px "Source Code Pro", monospace';
        try { ctx.letterSpacing = (lfs * -0.05) + 'px'; } catch (e) {}
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(8,3,3,' + logoA.toFixed(3) + ')';
        ctx.fillText('OLIVIER', W / 2, H / 2);
        try { ctx.letterSpacing = '0px'; } catch (e) {}
        ctx.textAlign = 'left';
      }
      ctx.globalAlpha = 1;
    };
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  } catch (e) { console.error('kimberley fire wash', e); }
})();
