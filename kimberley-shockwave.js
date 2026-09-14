(function () {
  var cv = document.getElementById('kimberleyShockwave');
  var gl = document.getElementById('kimberleyAstroGL');
  if (!cv) return;

  var ctx = cv.getContext('2d');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var RIPPLE_DUR = 0.62, RIPPLE_RADIUS = 132, RIPPLE_MAX = 6;
  var CORE_RADIUS = 46, CORE_FRAC = 0.34;
  var SHAKE_IMPULSE = 82, SHAKE_K = 190, SHAKE_C = 17, SHAKE_CAP = 7;

  var W = 0, H = 0, DPR = 1;
  var ripples = [];
  var shakeX = 0, shakeY = 0, shakeVX = 0, shakeVY = 0, shakeLive = false;
  var seenPulse = 0, last = null;

  var resize = function () {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  var spawn = function () {
    var pulse = window.kimberleyClickPulse || 0;
    if (pulse === seenPulse) return;
    seenPulse = pulse;
    if ((window.kimberleyEnd || 0) >= 0.001) return;

    var x = (window.kimberleyClickNX == null ? 0.5 : window.kimberleyClickNX) * W;
    var y = (window.kimberleyClickNY == null ? 0.5 : window.kimberleyClickNY) * H;

    ripples.push({ x: x, y: y, t: 0 });
    if (ripples.length > RIPPLE_MAX) ripples.shift();

    if (calm.matches) return;
    var dx = W * 0.5 - x, dy = H * 0.5 - y;
    var len = Math.hypot(dx, dy) + 1e-3;
    shakeVX += (dx / len) * SHAKE_IMPULSE;
    shakeVY += (dy / len) * SHAKE_IMPULSE;
  };

  var drawRipples = function (dt) {
    ctx.clearRect(0, 0, W, H);
    for (var i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i];
      r.t += dt;
      var p = r.t / RIPPLE_DUR;
      if (p >= 1) { ripples.splice(i, 1); continue; }

      var out = 1 - Math.pow(1 - p, 3);
      var rad = 6 + out * RIPPLE_RADIUS;
      var fade = (1 - p) * (1 - p);

      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(232,228,221,' + (fade * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 0.4 + 1.6 * (1 - p);
      ctx.stroke();

      if (p >= CORE_FRAC) continue;
      var f = 1 - p / CORE_FRAC;
      var g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, CORE_RADIUS);
      g.addColorStop(0, 'rgba(255,186,132,' + (f * f * 0.30).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,186,132,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(r.x - CORE_RADIUS, r.y - CORE_RADIUS, CORE_RADIUS * 2, CORE_RADIUS * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  var driveShake = function (dt) {
    if (!gl) return;
    shakeVX += (-SHAKE_K * shakeX - SHAKE_C * shakeVX) * dt;
    shakeVY += (-SHAKE_K * shakeY - SHAKE_C * shakeVY) * dt;
    shakeX += shakeVX * dt;
    shakeY += shakeVY * dt;

    var mag = Math.hypot(shakeX, shakeY);
    if (mag > SHAKE_CAP) { shakeX *= SHAKE_CAP / mag; shakeY *= SHAKE_CAP / mag; }

    var resting = Math.abs(shakeX) < 0.02 && Math.abs(shakeY) < 0.02 &&
                  Math.abs(shakeVX) < 0.5 && Math.abs(shakeVY) < 0.5;
    if (resting) {
      shakeX = shakeY = shakeVX = shakeVY = 0;
      if (shakeLive) { gl.style.transform = ''; shakeLive = false; }
      return;
    }
    gl.style.transform = 'translate3d(' + shakeX.toFixed(2) + 'px,' + shakeY.toFixed(2) + 'px,0)';
    shakeLive = true;
  };

  var frame = function (now) {
    requestAnimationFrame(frame);
    if (last === null) { last = now; return; }
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    spawn();
    drawRipples(dt);
    driveShake(dt);
  };

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
