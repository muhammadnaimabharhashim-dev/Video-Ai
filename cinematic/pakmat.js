// "Pak Mat dan Ayam" - cinematic 3D version. Everything is a pure function of time T (seconds, 24 fps).
const FPS = 24, DURATION = 39;
const ease = t => sstep(0, 1, t);
const LINES = [[1.0, 7.35], [9.0, 3.84], [14.0, 3.34], [19.4, 5.01], [25.0, 7.05], [32.6, 3.74]];
const mouthAt = T => window.MOUTH ? (window.MOUTH[Math.round(T * 30)] || 0) : (LINES.some(l => T >= l[0] && T < l[0] + l[1]) ? 0.25 + 0.75 * Math.abs(Math.sin(T * 17)) : 0);

// ---------- scene ----------
scene.fog.density = 0.0055; FUR_GLOBAL.fogD.value = 0.0055;
sun.shadow.mapSize.set(2048, 2048); { const c = sun.shadow.camera; c.left = -17; c.right = 17; c.top = 17; c.bottom = -17; c.far = 120; c.updateProjectionMatrix(); }
sun.intensity = 3.0;
const fill = new THREE.DirectionalLight(0xffe6cc, 0.9); fill.position.set(3, 4, 14); scene.add(fill);
const yardW = buildYard(scene);
aimSun(0, -1);
const man = makeMan(); scene.add(man.root);
const hen = makeHen(); scene.add(hen.root);
const dust = makeParticles(500, '#d8c29a', false), grains = makeParticles(120, '#f2c23a', false), motes = makeParticles(140, '#ffe2b0', true), sparkle = makeParticles(60, '#fff0b0', true);
const eggG = new THREE.Mesh(ellipsoid(0.03, 0.04, 0.03, 24, 18), new THREE.MeshStandardMaterial({ color: 0xffcf3a, metalness: 1, roughness: 0.16, envMapIntensity: 1.6 })); eggG.castShadow = true; scene.add(eggG);
const durian = new THREE.Group(); { const core = new THREE.Mesh(ellipsoid(0.12, 0.14, 0.12, 24, 18), new THREE.MeshStandardMaterial({ color: 0x9bb23a, roughness: 0.7 })); core.castShadow = true; durian.add(core);
  const sg = new THREE.ConeGeometry(0.018, 0.06, 5); sg.translate(0, 0.03, 0); const spikes = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: 0x6f8c22, roughness: 0.8 }), 160); const r = rng(5), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 160; i++) { const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(); q.setFromUnitVectors(up, d); m4.compose(new THREE.Vector3(d.x * 0.12, d.y * 0.14, d.z * 0.12), q, new THREE.Vector3(1, 1, 1)); spikes.setMatrixAt(i, m4); } spikes.castShadow = true; durian.add(spikes); }
scene.add(durian);
// a second pair of hanging durians for dressing the tree
for (const [dx, dy, dz] of [[1.2, 5.4, -1.2], [-0.4, 6.0, -0.9]]) { const d = durian.clone(); d.position.set(3.4 + dx, dy, -1.8 + dz); scene.add(d); }
const sack = new THREE.Mesh(ellipsoid(0.08, 0.1, 0.06, 18, 14), new THREE.MeshStandardMaterial({ color: 0xcdb27a, roughness: 1 })); sack.castShadow = true; scene.add(sack);

// ---------- paths ----------
const BUCKET = new THREE.Vector3(-4.2, 0, 0.6), TREE_X = 2.5, HEN_X = 4.2;
const T_TRIP = 12.9, T_BONK = 19.2, T_DUR0 = 18.4, T_LAY = 31.8, T_EGGUP = 32.4;
function manPath(T) {
  const s = { x: -1.5, z: 0.8, yaw: 0.25, mode: 'talk' };
  if (T < 1.0) { s.x = -3.5 + 2.0 * T; s.yaw = Math.PI / 2 * (1 - ease(seg(T, 0.6, 1.0))) + 0.25 * ease(seg(T, 0.6, 1.0)); s.mode = 'walk'; }
  else if (T < 8.5) { s.mode = 'talk'; s.yaw = 0.25 + 0.1 * Math.sin(T * 0.7); }
  else if (T < 10.0) { s.mode = 'point'; s.yaw = lerp(0.25, Math.PI / 2, ease(seg(T, 8.5, 9.0))); }
  else if (T < 11.2) { const u = seg(T, 10.0, 11.2); s.x = lerp(-1.5, -7.0, ease(u)); s.yaw = lerp(Math.PI / 2, -Math.PI / 2, ease(seg(T, 10.0, 10.25))); s.mode = 'run'; }
  else if (T < 11.7) { s.x = -7.0; s.yaw = lerp(-Math.PI / 2, Math.PI / 2, ease(seg(T, 11.2, 11.6))); s.mode = 'stand'; }
  else if (T < T_TRIP) { s.x = lerp(-7.0, -4.7, seg(T, 11.7, T_TRIP)); s.yaw = Math.PI / 2; s.mode = 'run'; }
  else if (T < 13.5) { s.x = lerp(-4.7, -3.9, ease(seg(T, T_TRIP, 13.5))); s.yaw = Math.PI / 2; s.mode = 'fall'; }
  else if (T < 14.0) { s.x = -3.9; s.yaw = Math.PI / 2; s.mode = 'fall'; }
  else if (T < 14.8) { s.x = -3.9; s.yaw = Math.PI / 2; s.mode = 'getup'; }
  else if (T < 17.4) { const a = (T - 14.8) * 2.2; s.x = -3.8 + Math.sin(a) * 1.1; s.z = 0.8 + Math.sin(a * 0.7 + 1) * 0.5; s.yaw = Math.cos(a) >= 0 ? Math.PI / 2 : -Math.PI / 2; s.yaw += Math.sin(a * 2) * 0.5; s.mode = 'blind'; }
  else if (T < 17.9) { s.x = -3.8 + Math.sin(2.6 * 2.2) * 1.1; s.z = 0.8 + Math.sin(2.6 * 2.2 * 0.7 + 1) * 0.5; s.yaw = Math.PI / 2; s.mode = 'cheer'; }
  else if (T < 18.8) { const x0 = -3.8 + Math.sin(2.6 * 2.2) * 1.1, z0 = 0.8 + Math.sin(2.6 * 2.2 * 0.7 + 1) * 0.5, u = ease(seg(T, 17.9, 18.8)); s.x = lerp(x0, TREE_X, u); s.z = lerp(z0, -0.5, u); s.yaw = Math.PI / 2; s.mode = 'walk'; }
  else { s.x = TREE_X; s.z = -0.5; s.yaw = 0.6; s.mode = T < T_BONK ? 'stand' : T < 23.4 ? 'rub' : T < 25.0 ? 'idea' : T < 32.05 ? 'feed' : T < 36.0 ? 'hold' : T < 36.6 ? 'hop' : 'stand';
    if (T >= 25.0 && T < 32.05) s.yaw = lerp(0.6, 1.2, ease(seg(T, 25, 26))); if (T >= 32.05) s.yaw = lerp(1.2, 0.35, ease(seg(T, 32.05, 32.8))); }
  return s;
}
const MD = [0]; for (let i = 1; i <= 4100; i++) { const a = manPath((i - 1) / 100), b = manPath(i / 100); MD.push(MD[i - 1] + (a.mode === 'run' || a.mode === 'walk' || a.mode === 'blind' ? Math.hypot(b.x - a.x, b.z - a.z) : 0)); }
const mdist = T => lerp(MD[Math.min(4099, Math.floor(T * 100))], MD[Math.min(4100, Math.floor(T * 100) + 1)], (T * 100) % 1);

function henPath(T) {
  const s = { x: 7.6, y: 0.0, z: 0.1, yaw: -Math.PI / 2, mode: 'sit' };
  if (T < 8.7) { s.mode = 'sit'; s.y = 0.6; }
  else if (T < 9.0) { const u = seg(T, 8.7, 9.0); s.x = 7.6; s.z = lerp(0.1, 1.9, u); s.y = lerp(0.6, 0, ease(u)); s.yaw = -Math.PI / 2 + (Math.PI / 2) * u; s.mode = 'run'; }
  else if (T < 10.6) { s.x = lerp(7.6, -12, seg(T, 9.0, 10.6)); s.z = 1.9; s.yaw = Math.PI; s.mode = 'run'; }
  else if (T < 11.4) { s.x = -14; s.z = 1.9; s.mode = 'away'; }
  else if (T < 12.6) { s.x = lerp(-12, HEN_X, ease(seg(T, 11.4, 12.6))); s.z = 1.9; s.yaw = 0; s.mode = 'run'; }
  else if (T < 13.8) { s.x = HEN_X; s.z = 1.9; s.yaw = lerp(0, Math.PI, ease(seg(T, 12.6, 12.9))); s.mode = 'stand'; }
  else if (T < 17.4) { const a = (T - 13.8) * 1.6, cx = -3.9, cz = 0.8; s.x = cx + Math.cos(a) * 2.4; s.z = cz + Math.sin(a) * 1.6 + 0.4; s.yaw = Math.atan2(-Math.cos(a) * 1.6, -Math.sin(a) * 2.4); s.mode = 'run'; }
  else if (T < 18.8) { const a = 3.6 * 1.6, x0 = -3.9 + Math.cos(a) * 2.4, z0 = 0.8 + Math.sin(a) * 1.6 + 0.4, u = ease(seg(T, 17.4, 18.8)); s.x = lerp(x0, HEN_X, u); s.z = lerp(z0, 0.9, u); s.yaw = Math.atan2(-(0.9 - z0), HEN_X - x0); s.mode = 'run'; }
  else if (T < 27.0) { s.x = HEN_X; s.z = 0.9; s.yaw = Math.PI; s.mode = 'stand'; }
  else if (T < 30.0) { s.x = HEN_X - 0.4 * Math.abs(Math.sin((T - 27) * 1.3)); s.z = 0.9 + 0.3 * Math.sin((T - 27) * 0.9); s.yaw = Math.PI + 0.4 * Math.sin((T - 27) * 0.9); s.mode = 'peck'; }
  else if (T < 31.6) { s.x = HEN_X - 0.3; s.z = 0.9; s.yaw = Math.PI; s.mode = 'stand'; }
  else if (T < 32.6) { s.x = HEN_X - 0.3; s.z = 0.9; s.yaw = Math.PI; s.mode = 'lay'; }
  else if (T < 35.6) { s.x = HEN_X - 0.3; s.z = 0.9; s.yaw = Math.PI; s.mode = 'stand'; }
  else if (T < 36.0) { s.x = lerp(HEN_X - 0.3, 3.0, seg(T, 35.6, 36.0)); s.z = lerp(0.9, 0.0, seg(T, 35.6, 36.0)); s.yaw = Math.PI; s.mode = 'run'; }
  else { s.x = 3.0; s.z = 0.0; s.yaw = Math.PI; s.mode = 'peck'; }
  return s;
}
const HD = [0]; for (let i = 1; i <= 4100; i++) { const a = henPath((i - 1) / 100), b = henPath(i / 100); HD.push(HD[i - 1] + (a.mode === 'run' ? Math.hypot(b.x - a.x, b.z - a.z) : 0)); }
const hdist = T => lerp(HD[Math.min(4099, Math.floor(T * 100))], HD[Math.min(4100, Math.floor(T * 100) + 1)], (T * 100) % 1);

// ---------- poses ----------
const blinkAt = T => { const k = (T * 0.37 + 0.2) % 1; return k > 0.94 ? Math.sin((k - 0.94) / 0.06 * Math.PI) : 0; };
function manPose(T) {
  const p = manPath(T), P = { amp: 0, ph: 0, armL: {}, armR: {}, blink: blinkAt(T), mouth: mouthAt(T) };
  let rotX = 0, y = 0;
  const talk = Math.sin(T * 3.1), talk2 = Math.sin(T * 2.3 + 1.0), speaking = P.mouth > 0.05 ? 1 : 0;
  switch (p.mode) {
    case 'walk': P.amp = 1; P.ph = mdist(T) / 1.4 * Math.PI * 2; P.swingArms = true; P.lean = 0.04; break;
    case 'run': P.amp = 1.5; P.ph = mdist(T) / 1.9 * Math.PI * 2; P.swingArms = true; P.lean = 0.22; P.armL = { fw: 0.3, el: 1.3 }; P.armR = { fw: 0.3, el: 1.3 }; P.brow = 0.7; P.neckPitch = -0.1; break;
    case 'blind': P.amp = 0.8; P.ph = mdist(T) / 1.1 * Math.PI * 2; P.armL = { fw: 1.5 + 0.1 * talk, el: 0.1, curl: 0.1 }; P.armR = { fw: 1.5 - 0.1 * talk, el: 0.1, curl: 0.1 }; P.lean = 0.1; break;
    case 'point': P.armR = { fw: 1.5, out: 0.1, el: 0.08, curl: 0.5, point: true }; P.armL = { fw: 0.2 }; P.brow = 0.8; P.mouth = Math.max(P.mouth, 0); P.neckPitch = 0.0; break;
    case 'cheer': P.armL = { fw: 2.9, out: 0.15, el: 0.3 }; P.armR = { fw: 2.9, out: 0.15, el: 0.3 }; P.brow = 0.5; break;
    case 'rub': P.armR = { fw: 1.75, out: 0.75, el: 2.45, curl: 0.3, hx: 0.2 }; P.armL = { fw: 0.3 + 0.2 * talk2 }; P.neckPitch = 0.05; P.browAngry = 0.4; break;
    case 'idea': P.armR = { fw: 1.1, out: 0.25, el: 1.9, curl: 0.3 }; P.armL = { fw: 0.4, el: 0.6 }; P.brow = 0.7; break;
    case 'feed': P.armR = { fw: 0.9 + 0.7 * Math.sin(T * 7.5), out: 0.25, el: 0.9, curl: 0.0 }; P.armL = { fw: 0.9, el: 1.6, curl: 0.4 }; break;
    case 'hold': P.armR = { fw: 2.45, out: 0.12, el: 0.5, curl: 0.55, hx: 0.15 }; P.armL = { fw: 0.3, el: 0.4 }; P.browAngry = 0; P.brow = 0.6; break;
    case 'hop': P.armL = { fw: 1.4, out: 1.0, el: 0.3 }; P.armR = { fw: 1.4, out: 1.0, el: 0.3 }; P.brow = 1; y = Math.sin(seg(T, 36.0, 36.5) * Math.PI) * 0.18; break;
    case 'fall': { const u = ease(seg(T, T_TRIP, T_TRIP + 0.6)); rotX = 1.4 * u; P.armL = { fw: 2.3 * u, el: 0.2 }; P.armR = { fw: 2.3 * u, el: 0.2 }; P.brow = 1; P.mouth = 0.6 * (1 - u); y = 0.12 * u; break; }
    case 'getup': { const u = ease(seg(T, 14.0, 14.8)); rotX = 1.4 * (1 - u); P.armL = { fw: 1.5 * u, el: 0.2 }; P.armR = { fw: 1.5 * u, el: 0.2 }; y = 0.12 * (1 - u); break; }
    default: P.armL = { fw: 0.1 }; P.armR = { fw: speaking ? 0.7 + 0.5 * talk : 0.1, out: 0.3, el: speaking ? 1.1 + 0.5 * talk2 : 0.12, curl: 0.3 };
      if (p.mode === 'talk') { P.armL = { fw: 0.25 + 0.15 * talk2, out: 0.12, el: 0.5 + 0.3 * talk }; P.brow = 0.3 + 0.25 * Math.max(0, talk2); P.headYaw = 0.12 * Math.sin(T * 0.8); P.neckPitch = 0.04 * talk; }
  }
  if (T >= T_BONK && T < T_BONK + 0.5) { const k = Math.sin(seg(T, T_BONK, T_BONK + 0.5) * Math.PI); P.neckPitch = (P.neckPitch || 0) + 0.45 * k; P.hipDrop = -0.07 * k; P.brow = 0.2; P.blink = Math.max(P.blink, 0.8 * k); }
  if (T >= 32.4 && T < 36) { P.eyePitch = 0.0; P.eyeYaw = 0.0; }
  if (p.mode === 'blind') { P.blink = 0; P.headYaw = Math.sin(T * 2.2) * 0.2; }
  if (p.mode === 'hold' && T > 33) { P.neckPitch = -0.12; }
  P.mouth = clamp(P.mouth * 1.15, 0, 1);
  return { p, P, rotX, y };
}
function henPose(T) {
  const p = henPath(T), P = { ph: 0, amp: 0, blink: blinkAt(T + 1.3), tailUp: 0.35 }, y = p.y;
  switch (p.mode) {
    case 'run': P.amp = 1; P.ph = hdist(T) / 0.55 * Math.PI * 2; P.neckPitch = 0.2; P.pitch = 0.1; P.tailUp = 0.5; P.wingOut = 0.25; break;
    case 'peck': { const k = Math.abs(Math.sin(T * 8.5)); P.peck = k > 0.5 ? 1 : k * 1.6 - 0.3; P.peck = clamp(P.peck, 0, 1); P.beak = k < 0.4 ? 0.7 : 0; P.amp = 0.25 + 0.0; P.ph = T * 2; break; }
    case 'lay': P.squat = 1; P.tailUp = 0.9; P.wingOut = 0.1; P.neckPitch = 0.2; P.beak = 0.3 + 0.3 * Math.sin(T * 14); break;
    case 'sit': P.headYaw = 0.5 * Math.sin(T * 1.3) * (T > 3 ? 1 : 0.3); P.neckPitch = Math.sin(T * 0.9) * 0.15; P.squat = 0.7; break;
    case 'stand': P.headYaw = 0.5 * Math.sin(T * 2.5 + 1) * (T > 12 && T < 14 ? 1 : 0.4); P.neckPitch = Math.sin(T * 3) * 0.08; P.beak = (T > 19.4 && T < 25) ? 0.3 + 0.25 * Math.sin(T * 5) : 0; break;
    default: break;
  }
  if (T > 12.6 && T < 13.8) P.wingOut = 0.2 + 0.1 * Math.sin(T * 30);
  return { p, P, y };
}
const SM_KEYS_FLAT = ['neckPitch', 'headPitch', 'headYaw', 'brow', 'browAngry', 'lean', 'amp', 'peck', 'squat', 'tailUp', 'wingOut', 'beak', 'pitch', 'hipDrop'];
function smoothArm(fn, T, key) { const acc = {}, n = 6; for (let i = 0; i < n; i++) { const a = fn(Math.max(0, T - i * 0.025)).P[key] || {}; for (const k in a) if (typeof a[k] === 'number') acc[k] = (acc[k] || 0) + a[k]; } const out = {}; for (const k in acc) out[k] = acc[k] / n; const cur = fn(T).P[key] || {}; if (cur.point) out.point = true; return out; }
function smoothedPose(fn, T, hasArms) { const base = fn(T); const n = 6; for (const k of SM_KEYS_FLAT) { let s = 0; for (let i = 0; i < n; i++) s += fn(Math.max(0, T - i * 0.025)).P[k] || 0; if (base.P[k] !== undefined || s) base.P[k] = s / n; } if (hasArms) { base.P.armL = smoothArm(fn, T, 'armL'); base.P.armR = smoothArm(fn, T, 'armR'); } return base; }

// ---------- camera ----------
const shake = (t, a) => new THREE.Vector3(Math.sin(t * 2.1) * 0.6 + Math.sin(t * 5.3) * 0.4, Math.sin(t * 2.7 + 1) * 0.6 + Math.sin(t * 6.1) * 0.35, Math.sin(t * 1.7 + 2) * 0.5).multiplyScalar(a);
function cam(p, look, fov, focus, ap, sh, T) { camera.fov = fov; camera.updateProjectionMatrix(); camera.position.copy(p); if (sh) camera.position.add(shake(T, sh)); camera.lookAt(look); camera.updateMatrixWorld(); post.uniforms.focus.value = focus === undefined ? p.distanceTo(look) : focus; post.uniforms.aperture.value = ap === undefined ? 0.3 : ap; }
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
function cameraAt(T, mp, hp) {
  const head = man.head.localToWorld(v3(0, 0.1, 0)), chest = head.clone().add(v3(0, -0.2, 0)), henPos = v3(hp.x, 0.3 + hp.y, hp.z);
  const mx = mp.x, mz = mp.z;
  if (T < 1.0) cam(v3(lerp(3.5, 3.0, T), lerp(2.4, 2.2, T), lerp(9.5, 9.0, T)), v3(-1.2, 1.5, 0), 34, 9.5, 0.2, 0.01, T);
  else if (T < 5.0) { const u = (T - 1) / 4; cam(v3(lerp(1.2, 0.8, u), 1.55, lerp(3.4, 2.8, u)), head.clone().add(v3(0, -0.06, 0)), 30, undefined, 0.3, 0.004, T); }
  else if (T < 6.4) cam(v3(5.6, 0.95, 2.6), v3(7.6, 0.95, 0.15), 27, 3.4, 0.55, 0.004, T);
  else if (T < 8.5) cam(v3(-3.6, 1.5, 3.4), head.clone().add(v3(0.1, -0.05, 0)), 30, undefined, 0.3, 0.004, T);
  else if (T < 10.6) cam(v3(1.2, 0.75, 8.2), v3(lerp(1.0, -1.5, ease(seg(T, 8.7, 10.6))), 0.95, 1.0), 33, 7.2, 0.25, 0.008, T);
  else if (T < T_TRIP) cam(v3(mx + 0.3, 1.0, 5.6), v3(mx + 0.7, 0.9, 0.8), 34, 5.0, 0.3, 0.012, T);
  else if (T < 14.0) cam(v3(-6.6, 0.32, 2.9), v3(-4.2, 0.35, 0.7), 32, 3.2, 0.5, 0.004, T);
  else if (T < 17.4) cam(v3(-0.3, 1.35, 7.4), v3(-3.9, 1.0, 0.8), 32, 8.0, 0.22, 0.004, T);
  else if (T < 18.5) cam(v3(mx - 1.4, 1.25, 4.6), v3(mx + 0.8, 1.35, -0.2), 33, 4.8, 0.3, 0.006, T);
  else if (T < 19.7) cam(v3(5.2, 1.0, 3.6), v3(2.7, 2.1, -0.4), 36, 4.2, 0.3, T > T_BONK && T < T_BONK + 0.4 ? 0.02 : 0.004, T);
  else if (T < 23.4) cam(v3(mx + 0.6, 1.6, mz + 2.1), head.clone().add(v3(0, -0.05, 0)), 30, undefined, 0.3, 0.004, T);
  else if (T < 25.0) cam(v3(mx + 0.9, 1.5, mz + 2.1), chest.clone().add(v3(0, 0.1, 0)), 30, undefined, 0.35, 0.004, T);
  else if (T < 27.6) cam(v3(1.5, 1.35, 5.2), v3(3.2, 0.9, 0.4), 34, 5.2, 0.28, 0.006, T);
  else if (T < 30.0) cam(v3(2.6, 0.38, 3.0), v3(3.7, 0.2, 0.9), 27, 3.4, 0.55, 0.002, T);
  else if (T < 32.6) cam(v3(2.3, 0.55, 2.7), v3(HEN_X - 0.2, 0.35, 0.9), 28, 2.4, 0.5, 0.004, T);
  else if (T < 36.0) { const u = (T - 32.6) / 3.4; cam(v3(mx + 0.5, 1.55, mz + lerp(2.5, 2.2, u)), head.clone().add(v3(0, 0.2, 0)), 30, undefined, 0.3, 0.003, T); }
  else { const u = seg(T, 36.0, 38.9); cam(v3(lerp(1.0, 0.0, u), lerp(1.4, 2.0, u), lerp(6.0, 8.4, u)), v3(3.0, 0.9, 0.4), 34, undefined, 0.25, 0.006, T); }
}

// ---------- per frame ----------
const SUN_OFF = v3(0, 0, 0);
function setup(T) {
  const m = smoothedPose(manPose, T, true), h = smoothedPose(henPose, T, false), mp = m.p, hp = h.p;
  // man
  man.root.position.set(mp.x, m.y, mp.z); man.root.rotation.set(m.rotX, mp.yaw, 0); man.pose(m.P);
  // hen
  hen.root.position.set(hp.x, h.y, hp.z); hen.root.rotation.set(0, hp.yaw, 0); hen.pose(h.P);
  scene.updateMatrixWorld(true);
  // bucket: ground -> flight -> head -> thrown
  const bk = yardW.bucket; const headPos = man.head.localToWorld(v3(0, 0.3, 0));
  if (T < T_TRIP) { bk.position.copy(BUCKET); bk.rotation.set(0, 0, 0); if (bk.parent !== yardW.root) yardW.root.add(bk); }
  else if (T < 13.6) { const u = seg(T, T_TRIP, 13.6); const tgt = man.head.localToWorld(v3(0, 0.3, 0)); bk.position.set(lerp(BUCKET.x, tgt.x, u), lerp(0.1, tgt.y, u) + Math.sin(u * Math.PI) * 1.4, lerp(BUCKET.z, tgt.z, u)); bk.rotation.set(u * 9, 0, u * 3); if (bk.parent !== yardW.root) yardW.root.add(bk); }
  else if (T < 17.4) { if (bk.parent !== man.bucketSlot) man.bucketSlot.add(bk); bk.position.set(0, 0.1, 0); bk.rotation.set(Math.PI, 0, 0); bk.scale.setScalar(1); }
  else { if (bk.parent !== yardW.root) yardW.root.add(bk); const a = Math.min(T - 17.4, 1.0); const x0 = headPos.x; bk.position.set(lerp(-3.8, -6.0, a), Math.max(0.0, 1.9 + 3.2 * a - 4.9 * a * a), 0.9 + a * 0.6); bk.rotation.set(Math.PI + a * 9, 0, a * 2); }
  // durian
  if (T < T_DUR0) durian.position.set(2.55, 5.2, -0.5);
  else if (T < T_BONK) { const a = T - T_DUR0; durian.position.set(2.55, 5.2 - 4.9 * a * a, -0.5); durian.rotation.set(a * 3, a * 2, 0); }
  else { const a = T - T_BONK; const gy = 0.14; let y = Math.max(gy, 1.98 + 3.2 * a - 4.9 * a * a); durian.position.set(2.55 + Math.min(a, 0.9) * 0.9, y, -0.5 + Math.min(a, 0.9) * 0.9); durian.rotation.set(a * 5, a * 3, 0); }
  // grains thrown while feeding
  const G = []; if (T > 26.0 && T < 30.4) for (let i = 0; i < 90; i++) { const tb = 26.0 + i * 0.045, a = T - tb; if (a < 0) continue; const r = rng(i * 7 + 3); const hand = v3(2.75, 1.05, -0.2); const tx = 3.2 + r() * 1.1, tz = 0.5 + r() * 0.7; const u = Math.min(a * 1.4, 1); const y = Math.max(0.01, lerp(1.05, 0.0, u * u) + Math.sin(u * Math.PI) * 0.5);
    if (u >= 1 && T > 29.4 && i % 3 === 0) continue; G.push({ x: lerp(hand.x, tx, u), y, z: lerp(hand.z, tz, u), s: 0.014, a: 1 }); }
  setParticles(grains, G);
  // sack at the hip
  sack.visible = T > 24.4 && T < 32.05; if (sack.visible) { const w = v3(0.22, 0.85, 0.12); man.torso.localToWorld(w); sack.position.copy(w); }
  // golden egg
  eggG.visible = false;
  if (T >= T_LAY && T < T_EGGUP) { const u = seg(T, T_LAY, T_EGGUP); const hx = hp.x + 0.2, hz = hp.z; eggG.visible = true; eggG.position.set(lerp(hx, hx - 0.2, u), Math.max(0.045, 0.18 - 4.9 * (u * 0.6) * (u * 0.6) * 1.0), hz); eggG.rotation.z = Math.PI / 2 * u; if (u < 0.2) eggG.position.set(hx, 0.2, hz); }
  else if (T >= T_EGGUP && T < 33.0) { const u = seg(T, T_EGGUP, 33.0); const handW = man.arms[1].hand.localToWorld(v3(0, -0.1, 0.01)); eggG.visible = true; eggG.position.set(lerp(HEN_X - 0.5, handW.x, ease(u)), lerp(0.05, handW.y, ease(u)) + Math.sin(u * Math.PI) * 0.5, lerp(0.9, handW.z, ease(u))); }
  else if (T >= 33.0 && T < 36.6) { const handW = man.arms[1].hand.localToWorld(v3(0.0, -0.095, 0.012)); eggG.visible = true; eggG.position.copy(handW); eggG.rotation.set(0, T * 0.6, 0); }
  // dust from the runners
  const D = []; const emit = (fn, dist, T0, T1, step) => { for (let tb = Math.ceil(T0 / step) * step; tb < T1; tb += step) { const age = T - tb; if (age < 0 || age > 1.2) continue; const st = fn(tb).p; if (st.mode !== 'run') continue; const r = rng(Math.round(tb / step) * 7 + 1); for (let j = 0; j < 3; j++) D.push({ x: st.x - Math.cos(st.yaw) * 0.0 + (r() - 0.5) * 0.4, y: 0.06 + age * 0.35 * (0.5 + r()), z: st.z + (r() - 0.5) * 0.4, s: (0.1 + r() * 0.1) * (1 + age * 2.6), a: 0.35 * (1 - age / 1.2) * (0.5 + r() * 0.5) }); } };
  emit(henPath2, 0, 8.8, 18.8, 0.05); emit(manPath2, 0, 10.0, 13.0, 0.06);
  setParticles(dust, D);
  // sun motes + egg sparkle
  const MM = []; for (let i = 0; i < 100; i++) { const r = rng(i * 5 + 1); MM.push({ x: camera.position.x + (r() - 0.4) * 10 + Math.sin(T * 0.3 + i) * 0.4, y: 0.4 + r() * 3.0 + Math.sin(T * 0.5 + i * 2) * 0.15, z: camera.position.z - 1.5 - r() * 7, s: 0.012 + r() * 0.02, a: 0.5 * (0.5 + 0.5 * Math.sin(T * 1.5 + i)) }); } setParticles(motes, MM);
  const SPK = []; if (T > 32.6 && T < 36.4) for (let i = 0; i < 28; i++) { const r = rng(i * 11 + 2), a = (T * 0.9 + i / 28) % 1; SPK.push({ x: eggG.position.x + (r() - 0.5) * 0.35, y: eggG.position.y + (r() - 0.3) * 0.3 + a * 0.15, z: eggG.position.z + (r() - 0.5) * 0.2 + 0.05, s: 0.02 + r() * 0.02, a: (1 - a) * (0.3 + 0.7 * Math.abs(Math.sin(T * 6 + i))) * 0.9 }); } setParticles(sparkle, SPK);
  // gentle sway of the washing
  yardW.laundry.forEach((l, i) => { l.rotation.x = Math.sin(T * 1.3 + i) * 0.07; l.rotation.z = Math.sin(T * 0.9 + i * 2) * 0.05; });
  FUR_GLOBAL.camPos.value.copy(camera.position); FUR_GLOBAL.time.value = T; skyMat.uniforms.time.value = T; yardW.grassMat.forEach(g => { if (g.userData.sh) g.userData.sh.uniforms.uT.value = T; });
  cameraAt(T, mp, hp);
  FUR_GLOBAL.camPos.value.copy(camera.position);
  post.uniforms.fade.value = Math.max(1 - sstep(0, 0.7, T), sstep(DURATION - 1.5, DURATION - 0.1, T)); post.uniforms.time.value = T % 7.3; post.uniforms.bars.value = 0.1;
}
const henPath2 = T => ({ p: henPath(T) }), manPath2 = T => ({ p: manPath(T) });
window.OVERLAY = (ctx2, T) => { const a = sstep(DURATION - 2.4, DURATION - 1.5, T) * (1 - sstep(DURATION - 0.35, DURATION - 0.05, T)); if (a <= 0) return;
  ctx2.save(); ctx2.globalAlpha = a; ctx2.fillStyle = '#f2ead8'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.font = '300 84px "DejaVu Sans", Arial, sans-serif'; ctx2.letterSpacing = '28px'; ctx2.fillText('TAMAT', W / 2 + 14, H / 2 - 18);
  ctx2.font = '300 26px "DejaVu Sans", Arial, sans-serif'; ctx2.letterSpacing = '6px'; ctx2.fillStyle = '#d9c9a4'; ctx2.fillText('Pak Mat 1   -   Ayam 1', W / 2 + 3, H / 2 + 46); ctx2.restore(); };
window.render = T => { const sub = window.SUB || ((T > 8.4 && T < 19.2) ? 2 : 1); renderFrame(setup, T, sub, 0.5, FPS); window.OVERLAY(octx, T); };
window.DURATION = DURATION; window.FPS = FPS;
window.EVENTS = { dur: DURATION, trip: T_TRIP, bonk: T_BONK, lay: T_LAY, eggup: T_EGGUP, durFall: T_DUR0, henBolt: 8.7, manSteps: [], henSteps: [] };
// footfall events for the sound mix
{ const steps = (fn, dist, stride, T0, T1, modes) => { const out = []; let prev = Math.floor(dist(T0) / stride * 2); for (let T = T0; T < T1; T += 0.004) { const st = fn(T).p; const k = Math.floor(dist(T) / stride * 2); if (k !== prev) { if (modes.includes(st.mode)) out.push(+T.toFixed(3)); prev = k; } } return out; };
  window.EVENTS.manSteps = steps(manPath2, mdist, 1.4, 0, 19, ['walk', 'run', 'blind']); window.EVENTS.henSteps = steps(henPath2, hdist, 0.55, 8.7, 19, ['run']); }
