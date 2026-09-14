import * as THREE from 'three';

const SLOTS = 8;
const LIFE = 0.85, SEED = 0.015, GROW = 0.125, EASE = 0.55;
const THICK = 0.016, SPREAD = 0.034, PUSH = 0.045, FADE = 1.6;
const CHROMA = 0.0065, RIM = 0.60, CORE = 0.22;

window.kimberleyShockProfile = { life: LIFE, seed: SEED, grow: GROW, ease: EASE };

const renderer = window.kimberleyRenderer;

if (renderer) {
  const vert = `
    varying vec2 v_uv;
    void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `;

  const frag = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec2 u_clicks[${SLOTS}];
    uniform float u_ages[${SLOTS}];

    void main() {
      vec2 uv = v_uv;
      float aspect = u_res.x / u_res.y;
      vec2 flow = vec2(0.0);
      float rim = 0.0;

      for (int i = 0; i < ${SLOTS}; i++) {
        float age = u_ages[i];
        if (age < 0.0 || age >= ${LIFE.toFixed(2)}) continue;

        vec2 cd = (uv - u_clicks[i]) * vec2(aspect, 1.0);
        float r = length(cd);
        float life = age / ${LIFE.toFixed(2)};
        float radius = ${SEED.toFixed(3)} + pow(life, ${EASE.toFixed(2)}) * ${GROW.toFixed(3)};
        float thick = ${THICK.toFixed(3)} + life * ${SPREAD.toFixed(3)};
        float lobe = (r - radius) / thick;
        float shell = exp(-lobe * lobe);
        float decay = pow(1.0 - life, ${FADE.toFixed(1)});

        flow += normalize(cd + 1e-5) * shell * -lobe * decay * ${PUSH.toFixed(3)};
        rim += (shell * shell * 0.7 + shell * 0.4) * decay;
        rim += smoothstep(radius, radius * 0.25, r) * decay * ${CORE.toFixed(2)} * (1.0 - life);
      }

      vec2 suv = uv + flow;
      vec4 s = texture2D(u_tex, suv);

      if (rim > 0.002) {
        vec2 dir = normalize(flow + 1e-5);
        float ca = rim * ${CHROMA.toFixed(4)};
        s.r = texture2D(u_tex, suv + dir * ca).r;
        s.b = texture2D(u_tex, suv - dir * ca).b;
        float glow = rim * ${RIM.toFixed(2)};
        s.rgb += vec3(0.70, 0.84, 1.0) * glow;
        s.a = min(1.0, s.a + glow);
      }

      gl_FragColor = s;
    }
  `;

  const clicks = [];
  for (let i = 0; i < SLOTS; i++) clicks.push(new THREE.Vector2(0.5, 0.5));
  const ages = new Float32Array(SLOTS).fill(-1);

  let grab = null;

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        u_tex: { value: null },
        u_res: { value: new THREE.Vector2(1, 1) },
        u_clicks: { value: clicks },
        u_ages: { value: ages }
      },
      blending: THREE.NoBlending
    })
  );
  const pass = new THREE.Scene();
  pass.add(quad);
  const flat = new THREE.Camera();

  const size = new THREE.Vector2();
  const corner = new THREE.Vector2(0, 0);
  let slot = 0, seenPulse = 0, lastNow = null;

  const strike = () => {
    const pulse = window.kimberleyClickPulse || 0;
    if (pulse === seenPulse) return;
    seenPulse = pulse;
    clicks[slot].set(
      window.kimberleyClickNX == null ? 0.5 : window.kimberleyClickNX,
      1 - (window.kimberleyClickNY == null ? 0.5 : window.kimberleyClickNY)
    );
    ages[slot] = 0;
    slot = (slot + 1) % SLOTS;
  };

  window.kimberleyPresent = (scene, camera) => {
    const now = performance.now();
    const dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.05);
    lastNow = now;

    strike();

    let live = false;
    for (let i = 0; i < SLOTS; i++) {
      if (ages[i] < 0) continue;
      ages[i] += dt;
      if (ages[i] >= LIFE) ages[i] = -1;
      else live = true;
    }

    renderer.render(scene, camera);
    if (!live) return;

    renderer.getDrawingBufferSize(size);
    if (!grab || grab.image.width !== size.x || grab.image.height !== size.y) {
      if (grab) grab.dispose();
      grab = new THREE.FramebufferTexture(size.x, size.y);
      quad.material.uniforms.u_tex.value = grab;
      quad.material.uniforms.u_res.value.copy(size);
    }

    renderer.copyFramebufferToTexture(corner, grab);
    renderer.render(pass, flat);
  };
}
