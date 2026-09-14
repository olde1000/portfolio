(function () {
  var cv = document.getElementById('kimberleyShockwave');
  var gl = document.getElementById('kimberleyAstroGL');
  if (!cv) return;

  var ctx = cv.getContext('2d');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var TAU = Math.PI * 2;
  var FOCAL = 620, BASE_Z = 620, APPROACH = 52;
  var TILT_MIN = 1.02, TILT_MAX = 1.26;
  var SEGMENTS = 56, SHELL_SCALE = 0.58;
  var RIPPLE_DUR = 0.72, RIPPLE_R = 172, RIPPLE_MAX = 4;
  var CORE_R = 52, CORE_FRAC = 0.36;
  var SHAKE_IMPULSE = 82, SHAKE_K = 190, SHAKE_C = 17, SHAKE_CAP = 7;
  var PUNCH_IMPULSE = 0.10, PUNCH_K = 210, PUNCH_C = 19;

  var W = 0, H = 0, DPR = 1, CX = 0, CY = 0;
  var ripples = [];
  var shakeX = 0, shakeY = 0, shakeVX = 0, shakeVY = 0, shakeLive = false;
  var punch = 0, punchV = 0;
  var seenPulse = 0, last = null;

  var px = new Float32Array(SEGMENTS + 1);
  var py = new Float32Array(SEGMENTS + 1);
  var pk = new Float32Array(SEGMENTS + 1);
  var pz = new Float32Array(SEGMENTS + 1);

  var resize = function () {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    CX = W * 0.5; CY = H * 0.5;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  var spawn = function () {
    var pulse = window.kimberleyClickPulse || 0;
    if (pulse === seenPulse) return;
    seenPulse = pulse;
    if ((window.kimberleyEnd || 0) >= 0.001) return;

    var sx = (window.kimberleyClickNX == null ? 0.5 : window.kimberleyClickNX) * W;
    var sy = (window.kimberleyClickNY == null ? 0.5 : window.kimberleyClickNY) * H;
    var roll = Math.random() * TAU;
    var tilt = TILT_MIN + Math.random() * (TILT_MAX - TILT_MIN);

    ripples.push({
      x: (sx - CX) * BASE_Z / FOCAL,
      y: (sy - CY) * BASE_Z / FOCAL,
      cr: Math.cos(roll), sr: Math.sin(roll),
      ca: Math.cos(tilt), sa: Math.sin(tilt),
      t: 0
    });
    if (ripples.length > RIPPLE_MAX) ripples.shift();

    if (calm.matches) return;
    var dx = CX - sx, dy = CY - sy;
    var len = Math.hypot(dx, dy) + 1e-3;
    shakeVX += (dx / len) * SHAKE_IMPULSE;
    shakeVY += (dy / len) * SHAKE_IMPULSE;
    punchV += PUNCH_IMPULSE;
  };

  var project = function (r, rad, cz, count) {
    var ux = r.cr, uy = r.sr;
    var vx = -r.sr * r.ca, vy = r.cr * r.ca, vz = -r.sa;
    for (var i = 0; i <= count; i++) {
      var th = (i / count) * TAU;
      var c = Math.cos(th), s = Math.sin(th);
      var Z = cz + rad * s * vz;
      if (Z < 40) Z = 40;
      var k = BASE_Z / Z;
      px[i] = CX + FOCAL * (r.x + rad * (c * ux + s * vx)) / Z;
      py[i] = CY + FOCAL * (r.y + rad * (c * uy + s * vy)) / Z;
      pk[i] = k;
      pz[i] = Z;
    }
  };

  var strokeArc = function (count, cz, far, alpha, width) {
    for (var i = 0; i < count; i++) {
      var mid = (pz[i] + pz[i + 1]) * 0.5;
      if (far ? mid < cz : mid >= cz) continue;
      var k = (pk[i] + pk[i + 1]) * 0.5;
      var a = alpha * Math.min(1.8, Math.pow(k, 1.6));
      if (a < 0.004) continue;
      ctx.beginPath();
      ctx.moveTo(px[i], py[i]);
      ctx.lineTo(px[i + 1], py[i + 1]);
      ctx.strokeStyle = 'rgba(232,228,221,' + a.toFixed(3) + ')';
      ctx.lineWidth = width * Math.min(2.2, k);
      ctx.stroke();
    }
  };

  var drawCore = function (r, cz, f) {
    var k = BASE_Z / cz;
    var x = CX + FOCAL * r.x / cz;
    var y = CY + FOCAL * r.y / cz;
    var rad = CORE_R * k;
    var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,186,132,' + (f * f * 0.34).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,186,132,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    ctx.globalCompositeOperation = 'source-over';
  };

  var drawRipples = function (dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    for (var i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i];
      r.t += dt;
      var p = r.t / RIPPLE_DUR;
      if (p >= 1) { ripples.splice(i, 1); continue; }

      var out = 1 - Math.pow(1 - p, 3);
      var fade = (1 - p) * (1 - p);
      var cz = BASE_Z - APPROACH * out;
      var rad = 5 + out * RIPPLE_R;
      var width = 0.35 + 1.7 * (1 - p);

      project(r, rad, cz, SEGMENTS);
      strokeArc(SEGMENTS, cz, true, fade * 0.30, width * 0.8);

      var shellP = Math.max(0, (p - 0.10) / 0.90);
      var shellRad = rad * SHELL_SCALE;
      var shellFade = fade * (1 - shellP) * 0.22;
      if (shellFade > 0.004) {
        project(r, shellRad, cz, SEGMENTS);
        strokeArc(SEGMENTS, cz, true, shellFade, width * 0.6);
      }

      if (p < CORE_FRAC) drawCore(r, cz, 1 - p / CORE_FRAC);

      if (shellFade > 0.004) strokeArc(SEGMENTS, cz, false, shellFade, width * 0.6);
      project(r, rad, cz, SEGMENTS);
      strokeArc(SEGMENTS, cz, false, fade * 0.62, width);
    }
  };

  var driveShake = function (dt) {
    if (!gl) return;
    shakeVX += (-SHAKE_K * shakeX - SHAKE_C * shakeVX) * dt;
    shakeVY += (-SHAKE_K * shakeY - SHAKE_C * shakeVY) * dt;
    shakeX += shakeVX * dt;
    shakeY += shakeVY * dt;
    punchV += (-PUNCH_K * punch - PUNCH_C * punchV) * dt;
    punch += punchV * dt;

    var mag = Math.hypot(shakeX, shakeY);
    if (mag > SHAKE_CAP) { shakeX *= SHAKE_CAP / mag; shakeY *= SHAKE_CAP / mag; }
    if (punch > 0.012) punch = 0.012;

    var resting = Math.abs(shakeX) < 0.02 && Math.abs(shakeY) < 0.02 &&
                  Math.abs(shakeVX) < 0.5 && Math.abs(shakeVY) < 0.5 &&
                  Math.abs(punch) < 0.0002 && Math.abs(punchV) < 0.004;
    if (resting) {
      shakeX = shakeY = shakeVX = shakeVY = punch = punchV = 0;
      if (shakeLive) { gl.style.transform = ''; shakeLive = false; }
      return;
    }
    gl.style.transform = 'translate3d(' + shakeX.toFixed(2) + 'px,' + shakeY.toFixed(2) + 'px,0) scale(' +
                         (1 + punch).toFixed(4) + ')';
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
