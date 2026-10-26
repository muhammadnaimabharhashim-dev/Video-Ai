// Shell-fur rendering: each mesh is drawn as N slightly inflated shells, strands cut out by a 3D hash.
const FUR_VS = `
uniform float layer, furLen; varying vec3 vN, vP0, vW; varying float vDist; varying vec2 vUv;
void main(){
  vec3 g = transpose(mat3(modelMatrix)) * vec3(0.0,-1.0,0.0);
  vec3 p = position + normal * furLen * layer + g * furLen * 0.9 * layer * layer;
  vUv = uv; vP0 = position; vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(p,1.0); vW = wp.xyz;
  vec4 mv = viewMatrix * wp; vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FUR_FS = `
uniform float layer, density, stripe, fogD, sunI, curl; uniform vec3 base, tip, belly, stripeCol, sunDirW, sunCol, skyCol, gndCol, fogCol, camPos; uniform float time;
varying vec3 vN, vP0, vW; varying float vDist; varying vec2 vUv; uniform vec2 uvDen;
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y), f.z); }
void main(){
  vec2 q = vUv * uvDen; vec2 cell = floor(q); vec2 fc = fract(q);
  float hA = h31(vec3(cell, 1.7)), hB = h31(vec3(cell.yx, 4.1)), hC = h31(vec3(cell, 9.3));
  vec2 ctr = vec2(0.5) + (vec2(hB, hC) - 0.5) * 0.5;
  float hl = 0.30 + 0.70*hA;
  float r = length(fc - ctr) * 2.0;
  if (layer > 0.0 && (hl < layer || r > 1.0 - layer*0.8)) discard;
  float clump = n3(vP0*14.0), pat = n3(vP0*3.0+7.0);
  vec3 col = mix(base, tip, layer);
  col *= 0.94 + 0.12*clump;
  if (stripe > 0.0) { float s = smoothstep(0.35,0.65, sin(vP0.x*26.0 + pat*5.0 + vP0.y*9.0)*0.5+0.5); col = mix(col, stripeCol, s*stripe*(0.6+0.4*clump)); }
  vec3 N = normalize(vN); vec3 V = normalize(camPos - vW);
  float bl = smoothstep(0.1, -0.6, N.y); col = mix(col, belly, bl);
  float ndl = dot(N, sunDirW); float diff = max(ndl*0.7+0.3, 0.0);               // wrapped light for soft fur
  float ao = mix(0.28, 1.0, layer*0.9 + 0.1);
  vec3 amb = mix(gndCol, skyCol, N.y*0.5+0.5);
  float rim = pow(1.0 - max(dot(N,V),0.0), 2.6) * max(dot(-V, sunDirW)*0.5+0.55, 0.0);
  vec3 lit = col * (sunCol * diff * 1.15 + amb) * ao + sunCol * rim * (0.35 + layer*0.9) * mix(base,tip,0.6);
  lit += sunCol * pow(max(dot(reflect(-sunDirW, N), V),0.0), 18.0) * layer * 0.12;
  float f = 1.0 - exp(-fogD*fogD*vDist*vDist); lit = mix(lit, fogCol, f);
  gl_FragColor = vec4(lit, 1.0);
}`;
const FUR_GLOBAL = {
  sunDirW: { value: sunDir.clone() }, sunCol: { value: new THREE.Color(1.0, 0.72, 0.45).multiplyScalar(2.1) }, skyCol: { value: new THREE.Color(0.40, 0.55, 0.80).multiplyScalar(0.75) },
  gndCol: { value: new THREE.Color(0.35, 0.27, 0.18).multiplyScalar(0.7) }, fogCol: { value: new THREE.Color(0xe9c9a0) }, fogD: { value: 0.0105 }, camPos: { value: new THREE.Vector3() }, time: { value: 0 },
};
function uvDenOf(geo, dens) {
  if (!geo.boundingBox) geo.computeBoundingBox(); const s = new THREE.Vector3(); geo.boundingBox.getSize(s); const k = geo.userData.kind || 'sphere';
  let circ, len;
  if (k === 'lathe') { circ = Math.PI * (s.y + s.z) / 2; len = s.x; }
  else if (k === 'capsule') { circ = Math.PI * (s.x + s.z) / 2; len = s.y; }
  else { const a = s.y / 2, b = (s.x + s.z) / 4; circ = Math.PI * (s.x + s.z) / 2; len = Math.PI / 2 * Math.sqrt(2 * (a * a + b * b)); }
  return new THREE.Vector2(circ * dens, len * dens);
}
// returns Group with base + shells. cfg: base, tip, belly, stripe, stripeCol, furLen, density, layers
function furMesh(geo, cfg) {
  const g = new THREE.Group();
  const shared = Object.assign({}, FUR_GLOBAL, {
    base: { value: new THREE.Color(cfg.base) }, tip: { value: new THREE.Color(cfg.tip || cfg.base) }, belly: { value: new THREE.Color(cfg.belly || cfg.base) },
    stripeCol: { value: new THREE.Color(cfg.stripeCol || 0x000000) }, uvDen: { value: uvDenOf(geo, cfg.density || 300) }, stripe: { value: cfg.stripe || 0 }, furLen: { value: cfg.furLen || 0.012 }, density: { value: cfg.density || 70 }, sunI: { value: 1 }, curl: { value: 0 },
  });
  const L = cfg.layers || 12;
  for (let i = 0; i <= L; i++) {
    const m = new THREE.ShaderMaterial({ uniforms: Object.assign({}, shared, { layer: { value: i / L } }), vertexShader: FUR_VS, fragmentShader: FUR_FS });
    const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false;
    if (i === 0) { mesh.castShadow = true; }
    g.add(mesh);
  }
  g.userData.uniforms = shared; return g;
}
