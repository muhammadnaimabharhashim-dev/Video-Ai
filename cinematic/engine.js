// Cinematic 3D engine: HDR render target -> DOF / bloom / grade / grain / letterbox post pass, procedural sky + IBL.
const W = 1280, H = 720;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
// deterministic PRNG
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 400);
const sunDir = new THREE.Vector3(-0.55, 0.52, -0.65).normalize();   // direction TO the sun (low, behind the action)

// ---------- procedural sky ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sunDir: { value: sunDir }, time: { value: 0 } },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
  varying vec3 vDir; uniform vec3 sunDir; uniform float time;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
  void main(){
    vec3 d = normalize(vDir); float el = clamp(d.y, -0.2, 1.0);
    vec3 zen = vec3(0.16,0.36,0.72), mid = vec3(0.55,0.72,0.92), hor = vec3(1.0,0.78,0.52);
    vec3 col = mix(hor, mid, smoothstep(0.0, 0.25, el)); col = mix(col, zen, smoothstep(0.2, 0.8, el));
    float sd = max(dot(d, normalize(sunDir)), 0.0);
    col += vec3(1.0,0.62,0.30) * pow(sd, 6.0) * 0.55 + vec3(1.0,0.85,0.6) * pow(sd, 64.0) * 1.6;
    col += vec3(1.0,0.95,0.85) * smoothstep(0.9993, 0.9998, sd) * 40.0;
    vec2 cu = d.xz / (d.y + 0.22) * 1.4 + vec2(time*0.01, 0.0);
    float c = smoothstep(0.48, 0.82, fbm(cu)); c *= smoothstep(0.0, 0.18, el);
    vec3 cc = mix(vec3(0.95,0.88,0.82), vec3(1.0,0.72,0.45), pow(sd, 3.0)); cc *= mix(0.55, 1.0, fbm(cu*2.0+3.0));
    col = mix(col, cc * 1.15, c * 0.9);
    if (d.y < 0.0) col = mix(col, vec3(0.30,0.26,0.20), smoothstep(0.0, -0.2, d.y));
    gl_FragColor = vec4(col, 1.0);
  }`,
});
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat); skyMesh.frustumCulled = false; scene.add(skyMesh);
{ const ps = new THREE.Scene(); ps.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), skyMat));
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(ps, 0.0).texture; scene.environmentIntensity = 0.9; }
scene.fog = new THREE.FogExp2(0xe9c9a0, 0.0105);

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffd2a0, 3.4);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 90;
{ const c = sun.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; }
scene.add(sun); scene.add(sun.target);
scene.add(new THREE.HemisphereLight(0x9fc4ee, 0x7a5a3a, 0.55));
function aimSun(cx, cz) { sun.target.position.set(cx, 0, cz); sun.position.set(cx, 0, cz).addScaledVector(sunDir, 45); sun.target.updateMatrixWorld(); }

// ---------- post pass ----------
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(W, H) });
const post = {
  uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: new THREE.Vector2(W, H) }, near: { value: camera.near }, far: { value: camera.far },
    focus: { value: 6 }, aperture: { value: 0.35 }, time: { value: 0 }, fade: { value: 0 }, flash: { value: 0 }, grain: { value: 0.045 }, bars: { value: 0.118 } },
  vs: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fs: `
  varying vec2 vUv; uniform sampler2D tColor, tDepth; uniform vec2 res; uniform float near, far, focus, aperture, time, fade, flash, grain, bars;
  float lin(float d){ float z = d*2.0-1.0; return 2.0*near*far/(far+near - z*(far-near)); }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*7.31)*43758.5453); }
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
  float coc(float z){ return clamp(aperture * abs(z - focus) / max(z, 0.1) * 14.0, 0.0, 13.0); }
  void main(){
    vec2 uv = vUv; vec2 px = 1.0/res;
    float z0 = lin(texture2D(tDepth, uv).r); float c0 = coc(z0);
    vec3 acc = texture2D(tColor, uv).rgb; float wsum = 1.0; vec3 glow = vec3(0.0);
    const int N = 40; float ga = 2.39996;
    for (int i=1; i<=N; i++) {
      float r = sqrt(float(i)/float(N)); float a = float(i)*ga;
      vec2 o = vec2(cos(a), sin(a)) * r;
      vec2 suv = uv + o * c0 * px * 1.3;
      float zs = lin(texture2D(tDepth, suv).r); float cs = coc(zs);
      float w = (zs < z0) ? clamp(cs/(c0*r*1.3+0.5), 0.0, 1.0) : 1.0;       // keep sharp foreground from bleeding
      vec3 s = texture2D(tColor, suv).rgb; acc += s * w; wsum += w;
      glow += max(s - 1.4, 0.0);
    }
    vec3 col = acc / wsum; col += glow / float(N) * 0.55;
    // wide soft bloom from mip-like taps
    vec3 b = vec3(0.0); for (int i=0;i<8;i++){ float a=float(i)*0.785; b += texture2D(tColor, uv + vec2(cos(a),sin(a))*px*22.0).rgb; } col += max(b/8.0 - 1.0, 0.0) * 0.35;
    // chromatic aberration (edges)
    vec2 d = (uv-0.5); float ca = dot(d,d)*2.2;
    col.r = mix(col.r, texture2D(tColor, uv + d*0.004*ca*8.0).r, 0.5); col.b = mix(col.b, texture2D(tColor, uv - d*0.004*ca*8.0).b, 0.5);
    col += flash;
    col = aces(col * 0.95);
    // teal/orange grade
    float l = dot(col, vec3(0.299,0.587,0.114));
    col = mix(col, col * vec3(0.92,1.0,1.08), (1.0-l)*0.5); col = mix(col, col * vec3(1.08,1.0,0.88), l*0.5);
    col = mix(vec3(l), col, 1.08); col = pow(col, vec3(1.0/2.2));
    col = col*col*(3.0-2.0*col)*0.35 + col*0.65;                     // gentle filmic contrast
    float v = 1.0 - dot(d,d)*1.25; col *= clamp(v, 0.0, 1.0)*0.5+0.5;
    col += (hash(uv*res) - 0.5) * grain;
    float bar = step(bars, uv.y) * step(uv.y, 1.0-bars);
    col *= bar; col *= (1.0 - fade);
    gl_FragColor = vec4(col, 1.0);
  }`,
};
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: post.uniforms, vertexShader: post.vs, fragmentShader: post.fs, depthTest: false, depthWrite: false })));

// motion blur: accumulate sub-frames in a 2D canvas
const out = document.createElement('canvas'); out.width = W; out.height = H; out.id = 'out'; document.body.appendChild(out);
const octx = out.getContext('2d'); canvas.style.display = 'none';
function renderFrame(setup, t, sub = 3, shutter = 0.5, fps = 30) {
  for (let i = 0; i < sub; i++) {
    const tt = t + (sub > 1 ? (i / (sub - 1) - 0.5) * shutter / fps : 0);
    setup(tt);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    octx.globalAlpha = 1 / (i + 1); octx.drawImage(canvas, 0, 0);
  }
  octx.globalAlpha = 1;
}
