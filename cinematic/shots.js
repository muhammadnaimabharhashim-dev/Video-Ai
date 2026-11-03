// Story + cinematography. Everything is a pure function of sim time S; real time T maps to S with slow-motion ramps.
const FPS = 24;
const SLOW = [[11.65, 12.15, 0.4], [14.8, 15.6, 0.4]];   // [simStart, simEnd, speed]
function simOf(T) { let S = 0, t = 0; for (const [a, b, k] of SLOW) { if (T < t + (a - S)) return S + (T - t); t += a - S; S = a; const rl = (b - a) / k; if (T < t + rl) return a + (T - t) * k; t += rl; S = b; } return S + (T - t); }
function realOf(Sq) { let S = 0, t = 0; for (const [a, b, k] of SLOW) { if (Sq <= a) return t + (Sq - S); t += a - S; S = a; if (Sq <= b) return t + (Sq - a) / k; t += (b - a) / k; S = b; } return t + (Sq - S); }
const SIM_END = 26.5, DURATION = realOf(SIM_END);

aimSun(30, 0);
const world = buildWorld();
const dog = makeQuad(DOG_CFG), cat = makeQuad(CAT_CFG); scene.add(dog.root, cat.root);
const dust = makeParticles(700, '#d8c29a', false), splash = makeParticles(500, '#e8f4ff', true), motes = makeParticles(160, '#ffe2b0', true);
const strawG = new THREE.BoxGeometry(0.28, 0.012, 0.012), straw = new THREE.InstancedMesh(strawG, new THREE.MeshStandardMaterial({ color: 0xd8b858, roughness: 0.9 }), 160); straw.frustumCulled = false; straw.castShadow = true; scene.add(straw);
const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); ripple.rotation.x = -Math.PI / 2; scene.add(ripple);

// ---------- paths ----------
const V = 9.0, X_STOP = 109, DEC_T = 2.0;
const X6 = 2.1 + 0.5 * V * 1.4;                           // dog x at t=6 (end of acceleration)
const T_DEC = 6 + (100 - X6) / V;
function dogX(t) {
  if (t < 2.2) return lerp(5.0, 1.4, sstep(0, 1, t / 2.2) * 0.6 + 0.4 * (t / 2.2));
  if (t < 3.0) return 1.4;
  if (t < 3.9) return lerp(1.4, 2.1, sstep(0, 1, (t - 3.0) / 0.9));
  if (t < 4.6) return 2.1;
  if (t < 6.0) { const u = t - 4.6; return 2.1 + 0.5 * (V / 1.4) * u * u; }
  if (t < T_DEC) return X6 + V * (t - 6.0);
  if (t < T_DEC + DEC_T) { const u = t - T_DEC; return 100 + V * u - 0.5 * V / DEC_T * u * u; }
  return X_STOP;
}
const catGap = t => { const K = [[6.4, 4.6], [9, 3.6], [11.8, 3.2], [12.1, 3.2], [13.2, 4.4], [14.3, 3.6], [14.85, 3.6]]; if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], sstep(0, 1, (t - K[i][0]) / (K[i + 1][0] - K[i][0]))); return K[K.length - 1][1]; };
const T_C = 11.8, T_P = 14.85;
function catX(t) {
  if (t < 5.6) return -0.7;
  if (t < 6.4) return lerp(-0.7, 7.4, sstep(0, 1, (t - 5.6) / 0.8));
  if (t < T_P) return dogX(t) - catGap(t);
  if (t < 16.26) { const u = (t - T_P) / 1.3; return 84.4 + 6.3 * (1 - (1 - u) * (1 - u)); }
  if (t < 17.4) return 90.7;
  if (t < 19.8) { const u = (t - 17.4) / 2.4; return 90.7 + 15.6 * (1 - (1 - u) * (1 - u)); }
  if (t < 22.2) return lerp(106.3, 107.4, sstep(0, 1, (t - 20.2) / 2.0));
  if (t < 23.2) return 107.4;
  return 107.4 - 3.4 * sstep(0, 1, (t - 23.4) / 1.8);
}
const jumpY = (t, a, b, h) => (t > a && t < b) ? h * Math.sin((t - a) / (b - a) * Math.PI) : 0;
const PORCH_Y = 0.4;
const T_STEAL = 2.85, T_FISHDROP = 21.0, T_FISHTAKE = 22.9;

// ---------- animal state ----------
function dogState(S) {
  const x = dogX(S); const P = {}; let yaw = Math.PI, y = 0;
  const onPorch = x < 2.6; y = onPorch ? PORCH_Y * sstep(1, 0, (x - 2.0) / 0.6 * 0 + (x - 2.0) / 0.6) : 0;
  if (S < 4.6) {
    const mask = clamp((1 - sstep(2.0, 2.3, S)) + sstep(2.9, 3.15, S) * (1 - sstep(3.75, 4.0, S)), 0, 1), head = sstep(2.2, 2.55, S) * (1 - sstep(2.95, 3.35, S));
    P.phase = x * 5.2; P.amp = 0.38 * mask; P.bob = 0.012 * Math.sin(P.phase * 2) * mask; P.neckPitch = lerp(-0.35, -0.8, head); P.headPitch = lerp(-0.2, -0.3, head); P.tailUp = -0.5; P.tailWag = 0.1; P.tailPh = S * 4; P.earBack = 0.2; P.height = -0.03 * head;
    P.jaw = 0.7 * sstep(2.35, 2.55, S) * (1 - sstep(2.78, 2.92, S)) + 0.12 * sstep(2.85, 2.98, S);
    P.headYaw = 0.9 * sstep(3.3, 3.8, S) * (1 - sstep(4.2, 4.6, S));
    yaw = Math.PI; if (S > 3.5) yaw = Math.PI - Math.PI * sstep(3.5, 4.5, S);
  } else if (S < T_DEC + DEC_T) {
    yaw = 0; const v = S < 6 ? (S - 4.6) / 1.4 * V : S < T_DEC ? V : V * (1 - (S - T_DEC) / DEC_T);
    const k = clamp(v / V, 0, 1); P.amp = k; P.phase = absPhase(S, 2.1); P.bob = 0.05 * k * Math.abs(Math.sin(P.phase)); P.pitch = 0.05 * Math.sin(P.phase) * k; P.flex = 0.14 * Math.sin(P.phase + 0.6) * k; P.neckPitch = -0.18; P.headPitch = 0.12; P.tailUp = 0.2; P.tailWag = 0.5; P.tailPh = S * 14; P.earBack = 0.7 * k; P.jaw = 0.1;
    y = (S < 4.9 ? PORCH_Y * (1 - sstep(4.6, 5.0, S)) * (dogX(S) < 2.6 ? 1 : 0) : 0);
    y += jumpY(S, 11.15, 11.9, 1.5) + jumpY(S, 14.35, 15.35, 1.15);
    if (y > 0.3 && k > 0.5) { P.amp = 0.35; P.phase = 0.4; P.pitch = -0.15 + 0.3 * sstep(11.6, 12.0, S) * 0; P.tailUp = 0.5; }
    if (S > 17.2) { P.headYaw = 0.9 * sstep(17.2, 17.9, S); P.earBack = 0.9; P.amp *= 1; P.tailUp = -0.4; }
  } else {
    const u = S;
    yaw = S < 18.9 ? Math.PI * sstep(18.3, 18.9, S) : Math.PI;
    P.amp = 0; P.phase = 0.2; P.earBack = 0.95; P.tailUp = -0.7; P.tailWag = 0; P.neckPitch = -0.15; P.headPitch = 0.0; P.jaw = S < T_FISHDROP ? 0.12 : (S < T_FISHDROP + 0.5 ? 0.6 : 0.0);
    P.height = Math.sin(S * 55) * 0.006 * (S < 21 ? 1 : 0);
    if (S > 21.3) { P.sit = sstep(21.3, 21.9, S); P.height = 0; }
    if (S > 23.4) { P.sit = 1 - sstep(23.4, 23.9, S); P.tuck = sstep(23.6, 24.4, S); P.neckPitch = -0.5 * P.tuck; P.headPitch = -0.3 * P.tuck; }
  }
  return { x, y, yaw, P };
}
const PH_STEP = 0.01, DOGD = [0], CATD = [0];
for (let i = 1; i <= 2800; i++) { const t = i * PH_STEP; DOGD.push(DOGD[i - 1] + (t > 4.6 ? Math.abs(dogX(t) - dogX(t - PH_STEP)) : 0)); CATD.push(CATD[i - 1] + (t > 5.6 ? Math.abs(catX(t) - catX(t - PH_STEP)) : 0)); }
const tabAt = (T, S) => { const f = clamp(S / PH_STEP, 0, T.length - 2), i = Math.floor(f); return lerp(T[i], T[i + 1], f - i); };
function absPhase(S, stride) { return tabAt(DOGD, S) / stride * Math.PI * 2; }
function catPhase(S, stride) { return tabAt(CATD, S) / stride * Math.PI * 2; }

function catState(S) {
  const x = catX(S); const P = {}; let y = 0, yaw = 0, roll = 0, spin = 0, hide = false, scaleFur = 1;
  if (S < 5.6) {   // sleeping loaf on the mat
    y = PORCH_Y + 0.0; P.tuck = 1; P.lidClose = S < 4.0 ? 1 : 1 - sstep(4.0, 4.9, S); P.tailUp = 0.1; P.tailWag = 0.04; P.tailPh = S; P.earBack = 0.8 * sstep(4.6, 4.95, S) + 0.5 * sstep(2.8, 2.86, S) * (1 - sstep(3.0, 3.1, S));
    P.height = 0.012 * Math.sin(S * 2.4) + 0.012; P.neckPitch = -0.3; P.headPitch = -0.15; P.headYaw = S > 4.2 ? -0.15 - 0.55 * sstep(4.2, 4.9, S) : -0.15;
    if (S > 5.0) { P.tuck = 1 - sstep(5.0, 5.55, S) * 0.6; P.earBack = 0.9; }
  } else if (S < 6.4) {
    const u = (S - 5.6) / 0.8; y = lerp(PORCH_Y, 0, sstep(0.3, 1, u)) + Math.sin(u * Math.PI) * 0.55; P.amp = 0.8; P.phase = u * 6; P.earBack = 1.0; P.tailUp = 0.6; P.tailWag = 0.3; P.neckPitch = -0.1; P.tuck = Math.max(0, 0.4 - u * 1.2);
  } else if (S < T_C - 0.1) {
    const sp = Math.abs(catX(S + 0.01) - catX(S)) / 0.01, k = clamp(sp / 8, 0.3, 1.1); P.amp = k; P.phase = catPhase(S, 1.35); P.bob = 0.035 * k * Math.abs(Math.sin(P.phase)); P.flex = 0.35 * Math.sin(P.phase + 0.5) * k; P.pitch = 0.04 * Math.sin(P.phase);
    P.neckPitch = -0.2; P.headPitch = 0.05; P.earBack = 1.0; P.tailUp = 0.5 + 0.15 * Math.sin(S * 8); P.tailWag = 0.25; P.tailPh = S * 12; P.jaw = 0.15;
    y = S > 5.9 && S < 6.3 ? 0.0 : 0;
  } else if (S < T_C + 0.14) { hide = true; P.amp = 1; P.phase = 1; }   // inside the bale
  else if (S < T_P) {
    const sp = Math.abs(catX(S + 0.01) - catX(S)) / 0.01, k = clamp(sp / 8, 0.3, 1.0); P.amp = k; P.phase = catPhase(S, 1.35); P.bob = 0.03 * k * Math.abs(Math.sin(P.phase)); P.flex = 0.3 * Math.sin(P.phase + 0.5) * k;
    P.neckPitch = -0.2; P.earBack = 0.9; P.tailUp = 0.3; P.tailWag = 0.2; P.tailPh = S * 12; P.jaw = S < 13.5 ? 0.3 : 0.1; P.headYaw = Math.sin(S * 9) * 0.15 * (S < 13.4 ? 1 : 0);
  } else if (S < 16.26) {   // hydroplane: sliding on belly, spinning
    const u = (S - T_P) / 1.3; P.tuck = 0.8; P.amp = 0; P.earBack = 0.2; P.tailUp = 0.5; P.neckPitch = 0.1; P.headPitch = 0.1; P.jaw = 0.5; P.lidClose = 0; y = 0.0; spin = -u * Math.PI * 2 * (1 - u * 0.2); P.height = 0.0; P.tailWag = 0.6; P.tailPh = S * 10;
  } else if (S < 17.4) {
    const shake = S > 16.7 && S < 17.3 ? Math.sin((S - 16.7) * 62) * 0.28 * (1 - (S - 16.7) / 0.6) : 0; yaw = shake; P.amp = 0; P.earBack = S < 16.7 ? 0.4 : 1.0; P.tailUp = 0.2; P.neckPitch = -0.1; P.headPitch = S < 16.7 ? 0.2 : 0; P.sit = 0; P.lidClose = S > 16.3 && S < 16.6 ? 0.9 : 0; P.headYaw = S < 16.7 ? 0.5 * Math.sin((S - 16.26) * 5) : shake * 2;
  } else if (S < 19.8) {
    const sp = Math.abs(catX(S + 0.01) - catX(S)) / 0.01, k = clamp(sp / 8, 0.0, 0.95); P.amp = k; P.phase = catPhase(S, 1.35); P.bob = 0.02 * k * Math.abs(Math.sin(P.phase)); P.flex = 0.2 * Math.sin(P.phase + 0.5) * k; P.earBack = 0.8; P.tailUp = 0.6; P.tailWag = 0.1; P.neckPitch = -0.12;
  } else if (S < 22.9) {
    const walking = S > 20.2 && S < 22.2; P.amp = walking ? 0.28 : 0; P.phase = catPhase(S, 0.9); P.neckPitch = S > 22.2 ? -0.25 - 0.55 * sstep(22.2, 22.8, S) : -0.1; P.headPitch = S > 22.2 ? -0.3 : 0; P.earBack = 0.6; P.tailUp = 0.9; P.tailWag = 0.18; P.tailPh = S * 3; scaleFur = 1.6 - 0.6 * sstep(20.0, 22.0, S);
    P.height = S < 20.2 ? 0.02 : 0;
  } else {
    P.amp = S > 23.4 ? 0.4 : 0; P.phase = catPhase(S, 0.9); P.tailUp = 0.95; P.tailWag = 0.15; P.tailPh = S * 3; P.earBack = 0.1; P.neckPitch = S < 23.3 ? -0.5 : -0.05; P.headPitch = 0; P.fish = true;
    yaw = S < 23.4 ? 0 : Math.PI * sstep(23.4, 24.0, S); P.lidClose = S > 24 ? 0.5 : 0;
  }
  return { x, y, yaw, roll, spin, hide, P, scaleFur };
}

// pose smoothing: average slow-changing pose channels over the last ~0.18 s so state switches never pop (gait channels stay exact)
const SM_KEYS = ['amp', 'neckPitch', 'headPitch', 'headYaw', 'jaw', 'tailUp', 'tailWag', 'earBack', 'sit', 'tuck', 'lidClose', 'height'];
function smoothed(fn, S) { const base = fn(S), acc = {}, n = 7; for (let i = 0; i < n; i++) { const p = fn(Math.max(0, S - i * 0.03)).P; for (const k of SM_KEYS) acc[k] = (acc[k] || 0) + (p[k] === undefined ? 0 : p[k]); } for (const k of SM_KEYS) if (base.P[k] !== undefined || acc[k]) base.P[k] = acc[k] / n; return base; }

// ---------- camera ----------
const shake = (t, a) => new THREE.Vector3(Math.sin(t * 2.1) * 0.6 + Math.sin(t * 5.3) * 0.4, Math.sin(t * 2.7 + 1) * 0.6 + Math.sin(t * 6.1) * 0.35, Math.sin(t * 1.7 + 2) * 0.5).multiplyScalar(a);
function cam(p, look, fov, focus, ap, sh) {
  camera.fov = fov; camera.updateProjectionMatrix(); camera.position.copy(p); if (sh) camera.position.add(shake(sh[0], sh[1])); camera.lookAt(look); camera.updateMatrixWorld();
  post.uniforms.focus.value = focus === undefined ? p.distanceTo(look) : focus; post.uniforms.aperture.value = ap === undefined ? 0.35 : ap;
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
function camera_(S) {
  const d = dogState(S), c = catState(S), mid = (d.x + c.x) / 2;
  post.uniforms.flash.value = 0;
  if (S < 4.0) {            // 1. porch, slow push-in; dog steals the fish
    const u = S / 4.0, cp = v3(lerp(5.0, 3.6, u), lerp(0.85, 0.7, u), lerp(3.8, 2.9, u)); cam(cp, v3(lerp(0.5, 0.35, u), 0.58, -0.3), 26, cp.distanceTo(v3((d.x - 0.7) / 2, 0.5, -0.3)), 0.3, [S, 0.004]);
  } else if (S < 5.95) {    // 2. extreme close-up on the cat's eyes
    const u = (S - 4.0) / 1.95, hp = cat.head.localToWorld(v3(0.05, 0.015, 0));
    cam(hp.clone().add(v3(0.30 - 0.12 * u, 0.03 + 0.02 * u, 0.46 - 0.16 * u)), hp.clone().add(v3(0.0, 0.0, 0)), 26, 0.55 - 0.15 * u, 0.9, [S, 0.0012]);
  } else if (S < 8.6) {     // 3a. tracking shot beside the chase, fence posts flicker in the foreground
    const cx = Math.max(mid + 0.6, 4.0); cam(v3(cx, 0.75, 5.4), v3(cx + 0.3, 0.5, 0), 38, 5.5, 0.4, [S, 0.012]);
  } else if (S < 11.0) {    // 3b. low front angle, running toward camera
    const cx = d.x + 5.5; cam(v3(cx, 0.32, 1.4), v3(mid, 0.45, 0), 30, cx - mid + 0.4, 0.7, [S, 0.01]);
  } else if (S < 13.2) {    // 4. the hay bale
    cam(v3(52.6, 0.8, 4.2), v3(58.3, 0.7, 0), 30, 6.6, 0.45, [S, 0.004]); camera.lookAt(v3(lerp(56.0, 61.0, sstep(10.8, 13, S)), 0.6, 0)); camera.updateMatrixWorld();
  } else if (S < 14.4) {    // 4b. tracking again: the straw-covered cat keeps chasing
    const cx = mid + 0.8; cam(v3(cx, 0.8, 5.2), v3(cx + 0.3, 0.55, 0), 38, 5.3, 0.4, [S, 0.012]);
  } else if (S < 18.2) {    // 5. the puddle, ground-level, backlit
    cam(v3(82.4, 0.55, 2.7), v3(lerp(87.5, 90.5, sstep(14.4, 17.4, S)), 0.5, 0), 36, undefined, 0.35, [S, 0.004]);
  } else if (S < 21.0) {    // 6a. gate: dog cornered, cat approaches from the left
    const u = (S - 18.2) / 2.8; cam(v3(lerp(100.2, 102.0, u), 0.55, lerp(3.6, 2.7, u)), v3(107.0, 0.5, 0), lerp(32, 40, u), undefined, 0.45, [S, 0.004]);
  } else if (S < 23.2) {    // 6b. low close-up between the two
    const u = (S - 21.0) / 2.2; cam(v3(lerp(106.6, 107.0, u), 0.34, 1.55), v3(107.9, 0.34, 0.0), 30, 1.7, 0.7, [S, 0.003]);
  } else {                  // 7. pull back, the cat strolls away, the dog lies down
    const u = (S - 23.2) / (SIM_END - 23.2); cam(v3(lerp(101.5, 98.5, u), lerp(0.8, 1.6, u), lerp(3.4, 5.6, u)), v3(lerp(106.5, 105.0, u), 0.4, 0), 34, undefined, 0.3, [S, 0.004]);
  }
}

// ---------- apply per-frame ----------
const FISH_HEAD = { dog: new THREE.Vector3(DOG_CFG.headR * 1.0 + DOG_CFG.snoutLen * 0.35, -DOG_CFG.headR * 0.62, 0) };
function setup(T) {
  const S = simOf(T);
  const d = smoothed(dogState, S), c = smoothed(catState, S);
  dog.pose(d.P); dog.root.position.set(d.x, d.y, d.P.sit ? 0 : 0.0); dog.root.rotation.set(0, d.yaw, 0);
  // cat
  cat.pose(c.P); cat.root.position.set(c.x, c.y, S < 5.6 ? -0.5 : (S >= T_P && S < 16.26) ? 0.0 : 0.0); cat.root.rotation.set(0, (c.P.fish || S >= 23.4) ? c.yaw : c.yaw, 0); cat.root.rotation.y += c.spin;
  cat.root.visible = !c.hide;
  cat.setFurLen(c.scaleFur);
  // wet cat after the puddle: darker fur
  const wet = sstep(15.2, 16.2, S) * (1 - sstep(24.2, 26, S) * 0);
  cat.furUniforms.forEach(u => { if (!u._b0) { u._b0 = u.base.value.clone(); u._t0 = u.tip.value.clone(); } u.base.value.copy(u._b0).multiplyScalar(1 - 0.38 * wet); u.tip.value.copy(u._t0).multiplyScalar(1 - 0.3 * wet); });
  // cat sleeps with her head toward the bowl: face +x; at 5.6 she stays
  // fish
  const fish = WORLD.fish;
  const fishMode = S < T_STEAL ? 'bowl' : S < T_FISHDROP ? 'dog' : S < T_FISHDROP + 0.55 ? 'fall' : S < T_FISHTAKE ? 'ground' : 'cat';
  const cur = fish.parent; let want = fishMode === 'dog' ? dog.head : fishMode === 'cat' ? cat.head : (fishMode === 'bowl' ? WORLD.porch : scene);
  if (cur !== want) want.add(fish);
  if (fishMode === 'bowl') { fish.position.set(1.6, 0.5, -0.2); fish.rotation.set(0, 0.5, 0); }
  else if (fishMode === 'dog') { fish.position.copy(FISH_HEAD.dog); fish.rotation.set(0.0, 0.0, -0.18 + Math.sin(S * 22) * 0.1 * (S > 4.6 ? 1 : 0.2)); fish.scale.setScalar(1); }
  else if (fishMode === 'fall') { const a = S - T_FISHDROP; fish.position.set(X_STOP - 1.12, Math.max(0.05, 0.28 - 4.9 * a * a), 0.05); fish.rotation.set(0, 0, 0.9 * a * 4); }
  else if (fishMode === 'ground') { fish.position.set(X_STOP - 1.12, 0.05, 0.05); fish.rotation.set(0, 0.3, 0); }
  else { fish.position.set(CAT_CFG.headR * 1.0 + CAT_CFG.snoutLen * 0.2, -CAT_CFG.headR * 0.55, 0); fish.rotation.set(0, 0, -0.25); fish.scale.setScalar(0.85); }
  scene.updateMatrixWorld(true);
  camera_(S);
  FUR_GLOBAL.camPos.value.copy(camera.position); FUR_GLOBAL.time.value = S; if (WORLD.blades.userData.sh) WORLD.blades.userData.sh.uniforms.uT.value = S;
  skyMat.uniforms.time.value = S;
  // ---- dust ----
  const L = [];
  const emit = (who, S0, S1, step, rate) => { for (let tb = Math.ceil(S0 / step) * step; tb < S1; tb += step) { const age = S - tb; if (age < 0 || age > 1.3) continue; const st = who === 0 ? dogState(tb) : catState(tb); const k = Math.round(tb / step); const r = rng(k * 13 + who * 101);
      for (let j = 0; j < rate; j++) { const vx = -(0.8 + r() * 1.6) * (who ? 1.4 : 1.7), vy = 0.4 + r() * 0.8, vz = (r() - 0.5) * 1.2; L.push({ x: st.x - 0.5 + vx * age * 0.6, y: 0.08 + vy * age * 0.55 - age * age * 0.05, z: (r() - 0.5) * 0.4 + vz * age * 0.5, s: (0.14 + r() * 0.16) * (1 + age * 3.2), a: 0.5 * (1 - age / 1.3) * (0.5 + r() * 0.5) }); } } };
  emit(0, 6.0, T_DEC + 1.6, 0.045, 3); emit(1, 6.4, 14.9, 0.05, 2); emit(1, 17.4, 19.9, 0.07, 2); emit(0, 4.7, 6.0, 0.06, 2);
  { const a = S - T_C; if (a > 0 && a < 2.0) for (let j = 0; j < 70; j++) { const r = rng(j * 31 + 5); L.push({ x: 58.2 + (r() - 0.3) * a * 3.6, y: 0.4 + r() * 0.8 * Math.min(a * 2, 1.5) - a * a * 0.2, z: (r() - 0.5) * 1.6 + (r() - 0.5) * a * 2, s: (0.2 + r() * 0.2) * (1 + a * 2), a: 0.55 * (1 - a / 2.0) }); } }
  setParticles(dust, L);
  // straw burst (instanced boxes, ballistic)
  const a = S - T_C, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 160; i++) { const r = rng(i * 17 + 3); if (a < 0 || a > 3.2) { m.makeScale(0, 0, 0); straw.setMatrixAt(i, m); continue; }
    const vx = 0.5 + r() * 5.5, vy = 1.5 + r() * 5.0, vz = (r() - 0.5) * 4.5; const pos = v3(58.0 + vx * a, 0.62 + vy * a - 4.9 * a * a, vz * a + (r() - 0.5) * 0.8); if (pos.y < 0.01) { pos.y = 0.01; }
    e.set(r() * 6.28 + a * (3 + r() * 8) * (pos.y > 0.02 ? 1 : 0), r() * 6.28, r() * 6.28); q.setFromEuler(e); m.compose(pos, q, v3(1, 1, 1)); straw.setMatrixAt(i, m); }
  straw.instanceMatrix.needsUpdate = true;
  WORLD.bale.visible = S < T_C; // the bale bursts
  if (S >= T_C) { const g = WORLD.bale; }
  // puddle splash + ripple
  const SP = []; { const a2 = S - T_P; if (a2 > 0 && a2 < 2.4) for (let j = 0; j < 260; j++) { const r = rng(j * 7 + 2); const t0 = r() * 1.1; const ag = a2 - t0; if (ag < 0 || ag > 1.2) continue; const sx = 84.4 + r() * 4.5 * Math.min(1, t0 / 1.1 + 0.3), vx = 1.5 + r() * 4.0, vy = 1.5 + r() * 3.2, vz = (r() - 0.5) * 3.0;
      SP.push({ x: sx + vx * ag, y: 0.05 + vy * ag - 4.9 * ag * ag, z: (r() - 0.5) * 1.0 + vz * ag, s: 0.035 + r() * 0.03, a: Math.max(0, 0.9 - ag * 0.6) * (0.4 + r() * 0.6) }); } }
  { const a3 = S - (T_P - 0.55); if (a3 > 0 && a3 < 1.5) for (let j = 0; j < 90; j++) { const r = rng(j * 9 + 1); const ag = a3 - r() * 0.35; if (ag < 0) continue; SP.push({ x: 84.0 + vx0(r) * ag, y: 0.05 + (2.0 + r() * 3.6) * ag - 4.9 * ag * ag, z: (r() - 0.5) * 2.0 * ag, s: 0.04 + r() * 0.03, a: Math.max(0, 0.9 - ag * 0.7) }); } }
  setParticles(splash, SP);
  { const a4 = S - (T_P - 0.1); ripple.visible = a4 > 0 && a4 < 2.6; if (ripple.visible) { const k = Math.min(1, a4 / 2.6); ripple.position.set(85.6 + a4 * 1.8, 0.03, 0.1); ripple.scale.setScalar(0.3 + k * 4.0); ripple.material.opacity = 0.55 * (1 - k); } }
  // sun motes drifting near the camera (only wide shots)
  const MM = []; for (let i = 0; i < 120; i++) { const r = rng(i * 5 + 1); MM.push({ x: camera.position.x + (r() - 0.3) * 14 + Math.sin(S * 0.3 + i) * 0.4, y: 0.3 + r() * 3.2 + Math.sin(S * 0.5 + i * 2) * 0.15, z: camera.position.z + (r() - 0.5) * 7 - 3.5, s: 0.012 + r() * 0.02, a: 0.5 * (0.5 + 0.5 * Math.sin(S * 1.5 + i)) }); }
  setParticles(motes, MM);
  aimSun(camera.position.x + (camera.getWorldDirection(v3(0, 0, 0)).x * 4), 0);
  // fades
  post.uniforms.fade.value = Math.max(1 - sstep(0, 0.8, T), sstep(DURATION - 1.4, DURATION - 0.1, T)); post.uniforms.time.value = S % 7.3;
}
const vx0 = r => 2.0 + r() * 4.0;
window.realOf = realOf;
window.OVERLAY = (ctx2, T) => {
  const a = sstep(DURATION - 2.7, DURATION - 1.6, T) * (1 - sstep(DURATION - 0.35, DURATION - 0.05, T)); if (a <= 0) return;
  ctx2.save(); ctx2.globalAlpha = a; ctx2.fillStyle = '#f2ead8'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
  ctx2.font = '300 84px "DejaVu Sans", Arial, sans-serif'; ctx2.letterSpacing = '28px'; ctx2.fillText('TAMAT', W / 2 + 14, H / 2 - 18);
  ctx2.font = '300 26px "DejaVu Sans", Arial, sans-serif'; ctx2.letterSpacing = '6px'; ctx2.fillStyle = '#d9c9a4'; ctx2.fillText('Kucing 1   -   Anjing 0', W / 2 + 3, H / 2 + 46); ctx2.restore(); };
window.render = T => { renderFrame(setup, T, window.SUB || 2, 0.5, FPS); if (window.OVERLAY) window.OVERLAY(octx, T); };
window.DURATION = DURATION; window.FPS = FPS;
const stepsList = (phaseFn, S0, S1, beats) => { const out = []; let prev = Math.floor(phaseFn(S0) / (Math.PI / 2 * beats * 0 + Math.PI / 2)); for (let S = S0; S < S1; S += 0.004) { const k = Math.floor(phaseFn(S) / (Math.PI / 2)); if (k !== prev) { out.push([+realOf(S).toFixed(3), +Math.min(1, Math.abs(dogX(S + 0.01) - dogX(S)) / 0.01 / 9).toFixed(2)]); prev = k; } } return out; };
const dogSteps = stepsList(S => absPhase(S, 2.1), 4.6, T_DEC + DEC_T, 4), catSteps = (() => { const out = []; let prev = Math.floor(catPhase(5.6, 1.35) / (Math.PI / 2)); for (let S = 5.6; S < 25; S += 0.004) { const sp = Math.abs(catX(S + 0.01) - catX(S)) / 0.01; const k = Math.floor(catPhase(S, S < 20 ? 1.35 : 0.9) / (Math.PI / 2)); if (k !== prev) { if (sp > 0.3 && !(S > 14.85 && S < 16.3) && !(S > T_C - 0.1 && S < T_C + 0.14)) out.push([+realOf(S).toFixed(3), +Math.min(1, sp / 9).toFixed(2)]); prev = k; } } return out; })();
window.EVENTS = { steal: realOf(T_STEAL), eyes: realOf(4.0), eyesOpen: realOf(4.9), leap: realOf(5.6), crash: realOf(T_C), puddle: realOf(T_P), slideEnd: realOf(16.26), shake: realOf(16.7), drop: realOf(T_FISHDROP), take: realOf(T_FISHTAKE), jump1: realOf(11.15), jump2: realOf(14.35), run: realOf(5.0), stop: realOf(T_DEC + DEC_T), cut: [realOf(4.0), realOf(5.95), realOf(8.6), realOf(11.0), realOf(13.2), realOf(14.4), realOf(18.2), realOf(21.0), realOf(23.2)], slow: SLOW.map(a => [realOf(a[0]), realOf(a[1])]), lie: realOf(23.9), dur: DURATION, dogSteps, catSteps, sniff: [realOf(0.9), realOf(2.5)], bite: realOf(2.85), dogWalk: [realOf(0.0), realOf(2.2)] };
