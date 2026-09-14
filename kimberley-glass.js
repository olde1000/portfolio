import * as THREE from 'three';

const SLOTS = 8;
const LIFE = 5.4, GROW = 0.34, BAND = 5.2, PUSH = 0.07;
const CHROMA = 0.006, GLINT = 0.18;

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
      float ring = 0.0;

      for (int i = 0; i < ${SLOTS}; i++) {
        float age = u_ages[i];
        if (age >= 0.0 && age < ${LIFE.toFixed(1)}) {
          vec2 cd = (uv - u_clicks[i]) * vec2(aspect, 1.0);
          float band = exp(-pow((length(cd) - age * ${GROW.toFixed(2)}) * ${BAND.toFixed(1)}, 2.0));
          float rr = band * pow(1.0 - age / ${LIFE.toFixed(1)}, 1.8) * smoothstep(0.0, 0.24, age);
          ring += rr;
          flow += normalize(uv - u_clicks[i] + 1e-5) * rr * ${PUSH.toFixed(2)};
        }
      }

      vec2 suv = uv + flow;
      vec4 s = texture2D(u_tex, suv);
      vec3 col = s.rgb;

      if (ring > 0.002) {
        vec2 dir = normalize(flow + 1e-5);
        float ca = ring * ${CHROMA.toFixed(4)};
        col.r = texture2D(u_tex, suv + dir * ca).r;
        col.b = texture2D(u_tex, suv - dir * ca).b;
        col += vec3(0.62, 0.78, 1.0) * ring * ${GLINT.toFixed(2)};
      }

      gl_FragColor = vec4(col, max(s.a, ring * 0.55));
    }
  `;

  const clicks = [];
  for (let i = 0; i < SLOTS; i++) clicks.push(new THREE.Vector2(0.5, 0.5));
  const ages = new Float32Array(SLOTS).fill(-1);

  const target = new THREE.WebGLRenderTarget(1, 1, {
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType
  });

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        u_tex: { value: target.texture },
        u_res: { value: new THREE.Vector2(1, 1) },
        u_clicks: { value: clicks },
        u_ages: { value: ages }
      }
    })
  );
  const pass = new THREE.Scene();
  pass.add(quad);
  const flat = new THREE.Camera();

  const size = new THREE.Vector2();
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

    if (!live) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    renderer.getDrawingBufferSize(size);
    if (target.width !== size.x || target.height !== size.y) {
      target.setSize(size.x, size.y);
      quad.material.uniforms.u_res.value.copy(size);
    }

    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(pass, flat);
  };
}
