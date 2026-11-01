// Procedural man (Pak Mat): skin + cloth materials, realistic eyes, lip-sync jaw, hands with finger curl, simple walking rig. Faces +z.
function noiseTex(size, base, speck, n, seed, rep) {
  return texCanvas(size, (x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); speckle(x, s, n, speck, 0.6, 2.2, seed); }, rep);
}
function lathePts(profile, n = 28, closeEnds = true) { // profile: [[y, r]...] bottom->top
  const P = profile.map(p => new THREE.Vector2(Math.max(p[1], 0.0005), p[0])); return new THREE.LatheGeometry(P, n);
}
function smoothProfile(pts, steps = 24) { // [[y,r]] -> eased resample
  const out = []; for (let i = 0; i <= steps; i++) { const y = pts[0][0] + (pts[pts.length - 1][0] - pts[0][0]) * i / steps; let r = pts[0][1]; for (let k = 0; k < pts.length - 1; k++) if (y >= pts[k][0] && y <= pts[k + 1][0]) { const u = (y - pts[k][0]) / (pts[k + 1][0] - pts[k][0]); r = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * (u * u * (3 - 2 * u)); } out.push([y, r]); } return out;
}
function wrinkle(geo, amp, freq, seed) { // vertical folds for cloth
  const p = geo.attributes.position, r = rng(seed); const ph = r() * 6.28;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const k = 1 + amp * (Math.sin(a * freq + ph + y * 3) * 0.6 + Math.sin(a * freq * 2.3 + y * 9 + ph) * 0.4); p.setXYZ(i, x * k, y, z * k); }
  geo.computeVertexNormals(); return geo;
}
function makeEyeHuman(R, irisCols) {
  const eg = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.35 })); eg.add(ball);
  const cap = (radius, theta, zs, polar) => { const g = new THREE.SphereGeometry(radius, 36, 12, 0, Math.PI * 2, 0, theta); g.rotateX(Math.PI / 2); if (polar) { const p = g.attributes.position, uv = g.attributes.uv, rr = radius * Math.sin(theta); for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * rr), 0.5 + p.getY(i) / (2 * rr)); } return g; };
  const iris = new THREE.Mesh(cap(R * 1.004, 0.62, 1, true), new THREE.MeshBasicMaterial({ map: irisTexture(irisCols[0], irisCols[1]), color: 0xa8a8a8 })); eg.add(iris);
  const pup = new THREE.Mesh(cap(R * 1.008, 0.3, 1, false), new THREE.MeshBasicMaterial({ color: 0x020202 })); eg.add(pup); eg.userData.pup = pup;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(R * 0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff6e8 })); glint.position.set(R * 0.28, R * 0.3, R * 0.93); eg.add(glint);
  const lu = { value: 9 }; const lidMat = new THREE.MeshStandardMaterial({ color: 0xb87a4e, roughness: 0.7 });
  lidMat.onBeforeCompile = sh => { sh.uniforms.uT = lu; sh.vertexShader = 'varying float vLy;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLy = position.y;'); sh.fragmentShader = 'varying float vLy; uniform float uT;\n' + sh.fragmentShader.replace('void main() {', 'void main() { if (vLy < uT) discard;'); };
  const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 32, 24), lidMat); eg.add(lid); eg.userData.lu = lu; eg.userData.R = R; eg.userData.lid = lid;
  return eg;
}

function makeMan() {
  const M = { root: new THREE.Group() }; M.root.rotation.order = 'YXZ';
  const skinTex = noiseTex(256, '#b67a52', ['#a86a44', '#c48a60', '#b0744c'], 5000, 41, [2, 2]);
  const skin = new THREE.MeshStandardMaterial({ color: 0xffffff, map: skinTex, bumpMap: skinTex, bumpScale: 0.6, roughness: 0.58, emissive: 0x1a0a06, emissiveIntensity: 0.35 });
  const clothTex = (base, line, rep) => texCanvas(256, (x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 3) { x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(i, 0, 1, s); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(0, i, s, 1); } speckle(x, s, 2500, [line, 'rgba(0,0,0,.2)'], 0.5, 1.4, 9); }, rep);
  const shirtM = new THREE.MeshPhysicalMaterial({ map: clothTex('#2c7a58', '#4a9a78', [3, 3]), roughness: 0.86, sheen: 1, sheenColor: new THREE.Color(0x9fd8bc), sheenRoughness: 0.55, bumpMap: clothTex('#808080', '#999', [3, 3]), bumpScale: 0.5 });
  const sarongTex = texCanvas(512, (x, s) => { x.fillStyle = '#7d1e22'; x.fillRect(0, 0, s, s); for (let i = 0; i < 8; i++) { const p = i * 64; x.fillStyle = 'rgba(206,168,84,.75)'; x.fillRect(p + 8, 0, 3, s); x.fillRect(0, p + 8, s, 3); x.fillStyle = 'rgba(34,12,14,.8)'; x.fillRect(p + 26, 0, 20, s); x.fillRect(0, p + 26, s, 20); x.fillStyle = 'rgba(232,218,184,.4)'; x.fillRect(p + 52, 0, 2, s); x.fillRect(0, p + 52, s, 2); } for (let i = 0; i < s; i += 4) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(i, 0, 1, s); } }, [5, 3]);
  const sarongM = new THREE.MeshPhysicalMaterial({ map: sarongTex, roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color(0xd8a070), bumpMap: sarongTex, bumpScale: 0.6, side: THREE.DoubleSide });
  const sashM = new THREE.MeshPhysicalMaterial({ map: texCanvas(128, (x, s) => { x.fillStyle = '#7a4a14'; x.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 8) { x.fillStyle = '#e6c25a'; x.fillRect(i, 0, 3, s); } x.fillStyle = 'rgba(255,230,140,.4)'; for (let i = 0; i < s; i += 16) x.fillRect(0, i, s, 2); }, [4, 1]), roughness: 0.55, metalness: 0.25 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };

  // --- legs hidden under the sarong; feet visible ---
  M.feet = [];
  for (const s of [1, -1]) { const f = new THREE.Group(); f.position.set(s * 0.085, 0, 0); M.root.add(f); mesh(ellipsoid(0.042, 0.028, 0.095, 20, 12), skin, f, 0, 0.026, 0.035);
    for (let i = 0; i < 5; i++) mesh(ellipsoid(0.009, 0.008, 0.012, 8, 6), skin, f, (i - 2) * 0.0105, 0.012, 0.126); M.feet.push(f); }
  M.hips = new THREE.Group(); M.hips.position.y = 0.92; M.root.add(M.hips);
  // sarong (kain pelikat) as a skirt, swaying with the walk
  M.skirt = new THREE.Group(); M.skirt.position.y = 0.92; M.root.add(M.skirt);
  { const prof = smoothProfile([[-0.84, 0.205], [-0.55, 0.205], [-0.2, 0.185], [0.0, 0.175], [0.06, 0.18]], 20); const g = lathePts(prof.map(p => [p[0], p[1]]), 40); g.scale(1, 1, 0.78); wrinkle(g, 0.035, 7, 3); mesh(g, sarongM, M.skirt, 0, 0.0, 0); M.skirtGeo = g; }
  // torso (baju melayu) + sash
  M.torso = new THREE.Group(); M.torso.position.y = 0.9; M.root.add(M.torso);
  { const prof = smoothProfile([[0.0, 0.165], [0.1, 0.178], [0.25, 0.172], [0.4, 0.178], [0.49, 0.162], [0.54, 0.085]], 20); const g = lathePts(prof, 40); g.scale(1.02, 1, 0.62); wrinkle(g, 0.02, 9, 5); mesh(g, shirtM, M.torso, 0, 0.02, 0); }
  { const g = new THREE.TorusGeometry(0.18, 0.03, 12, 40); g.rotateX(Math.PI / 2); g.scale(1, 1, 0.74); mesh(g, sashM, M.torso, 0, 0.055, 0); }
  { const g = new THREE.TorusGeometry(0.075, 0.016, 8, 24); g.rotateX(Math.PI / 2); mesh(g, shirtM, M.torso, 0, 0.545, 0); }   // collar band
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe6c25a, metalness: 0.8, roughness: 0.25 }), M.torso, 0, 0.5 - i * 0.07, 0.125 + (0.005 - i * 0.001));
  // arms: upper (sleeve) + forearm + hand with finger curl
  M.arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.2, 0.46, 0); M.torso.add(sh);
    mesh(ellipsoid(0.058, 0.055, 0.058, 16, 12), shirtM, sh);
    const upG = lathePts(smoothProfile([[-0.28, 0.046], [-0.14, 0.05], [0.0, 0.056]], 12), 20); wrinkle(upG, 0.03, 5, 11 + s); mesh(upG, shirtM, sh);
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el); mesh(ellipsoid(0.05, 0.046, 0.05, 14, 10), shirtM, el);
    const faG = lathePts(smoothProfile([[-0.26, 0.044], [-0.12, 0.049], [0.0, 0.05]], 12), 20); wrinkle(faG, 0.03, 5, 21 + s); mesh(faG, shirtM, el);
    const hand = new THREE.Group(); hand.position.y = -0.27; el.add(hand);
    mesh(ellipsoid(0.032, 0.047, 0.017, 16, 12), skin, hand, 0, -0.04, 0);
    const fingers = [];
    for (let i = 0; i < 4; i++) { const f = new THREE.Group(); f.position.set((i - 1.5) * 0.0195 * s * -1, -0.078, 0); hand.add(f);
      mesh(capsuleSimple(0.0088, 0.034), skin, f, 0, 0, 0); const f2 = new THREE.Group(); f2.position.y = -0.036; f.add(f2); mesh(capsuleSimple(0.0078, 0.03), skin, f2, 0, 0, 0); f.userData.f2 = f2; fingers.push(f); }
    const th = new THREE.Group(); th.position.set(s * 0.029, -0.045, 0.008); th.rotation.z = s * 0.7; hand.add(th); mesh(capsuleSimple(0.0105, 0.036), skin, th, 0, 0, 0); const th2 = new THREE.Group(); th2.position.y = -0.034; th.add(th2); mesh(capsuleSimple(0.0075, 0.024), skin, th2, 0, 0, 0);
    M.arms.push({ sh, el, hand, fingers, th, th2, s });
  }
  // neck + head
  M.neck = new THREE.Group(); M.neck.position.y = 0.55; M.torso.add(M.neck);
  mesh(new THREE.CylinderGeometry(0.058, 0.068, 0.1, 22), skin, M.neck, 0, 0.02, 0);
  M.head = new THREE.Group(); M.head.position.y = 0.045; M.head.scale.setScalar(1.12); M.neck.add(M.head);
  const skullGeo = (() => { const g = new THREE.SphereGeometry(1, 72, 52), p = g.attributes.position, rx = 0.088, ry = 0.116, rz = 0.1;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i) * rx, y = p.getY(i) * ry, z = p.getZ(i) * rz; const t = Math.min(Math.max((-0.012 - y) / (ry + 0.012), 0), 1), jaw = Math.pow(t, 1.25);
      x *= 1 - 0.17 * jaw; z *= 1 - 0.06 * jaw; if (z > 0) z += 0.012 * jaw; const cb = Math.exp(-Math.pow(y / 0.055, 2)); x *= 1 + 0.045 * cb; p.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); return g; })();
  const skull = mesh(skullGeo, skin, M.head, 0, 0.115, 0);
  M.root.updateMatrixWorld(true); const ray = new THREE.Raycaster();
  const surf = (x, y) => { ray.set(M.head.localToWorld(new THREE.Vector3(x, y, 0.5)), new THREE.Vector3(0, 0, -1)); const h = ray.intersectObject(skull)[0]; return h ? M.head.worldToLocal(h.point.clone()).z : 0.09; };
  mesh(ellipsoid(0.0105, 0.03, 0.0155, 14, 12), skin, M.head, 0, 0.097, surf(0, 0.097) + 0.002);                                   // nose bridge
  mesh(ellipsoid(0.0165, 0.0145, 0.0185, 16, 12), skin, M.head, 0, 0.074, surf(0, 0.074) + 0.008);                                 // nose tip
  for (const s of [1, -1]) { mesh(ellipsoid(0.0095, 0.0085, 0.011, 12, 8), skin, M.head, s * 0.0135, 0.07, surf(s * 0.0135, 0.07) + 0.003); mesh(ellipsoid(0.0055, 0.0042, 0.0055, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3a1a10 }), M.head, s * 0.0085, 0.067, surf(0, 0.067) + 0.017);
    mesh(ellipsoid(0.011, 0.028, 0.018, 14, 10), skin, M.head, s * 0.0885, 0.1, -0.004); mesh(ellipsoid(0.006, 0.016, 0.01, 10, 8), new THREE.MeshStandardMaterial({ color: 0xa4604a, roughness: 0.8 }), M.head, s * 0.093, 0.1, 0.0); }
  // mouth: dark cavity on the face surface, lips, and a jaw that drops with the voice
  mesh(ellipsoid(0.025, 0.0105, 0.005, 18, 10), new THREE.MeshStandardMaterial({ color: 0x3e0b12, roughness: 0.6 }), M.head, 0, 0.044, surf(0, 0.044) - 0.0005);
  mesh(ellipsoid(0.019, 0.0035, 0.0045, 14, 8), new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: 0.35 }), M.head, 0, 0.0475, surf(0, 0.0475) + 0.003);       // upper teeth
  mesh(ellipsoid(0.0265, 0.0072, 0.0095, 18, 8), new THREE.MeshStandardMaterial({ color: 0xa8584a, roughness: 0.5 }), M.head, 0, 0.0545, surf(0, 0.0545) + 0.0035);   // upper lip
  M.jaw = new THREE.Group(); M.jaw.position.set(0, 0.078, 0.0); M.head.add(M.jaw);
  mesh(ellipsoid(0.04, 0.03, 0.044, 22, 14), skin, M.jaw, 0, -0.065, surf(0, 0.0) - 0.034);                                                                              // chin
  mesh(ellipsoid(0.0235, 0.0072, 0.0095, 18, 8), new THREE.MeshStandardMaterial({ color: 0xa8584a, roughness: 0.5 }), M.jaw, 0, 0.037 - 0.078, surf(0, 0.037) + 0.0035);  // lower lip
  mesh(ellipsoid(0.018, 0.0035, 0.0045, 14, 8), new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: 0.35 }), M.jaw, 0, 0.0405 - 0.078, surf(0, 0.0405) + 0.003);
  mesh(ellipsoid(0.016, 0.006, 0.014, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc0606a, roughness: 0.55 }), M.jaw, 0, 0.036 - 0.078, surf(0, 0.036) - 0.012);   // tongue
  { const m = furMesh(ellipsoid(0.034, 0.0095, 0.0115, 24, 10), { base: 0x161616, tip: 0x2a2a2a, furLen: 0.006, density: 700, layers: 10 }); m.position.set(0, 0.0615, surf(0, 0.0615) + 0.0025); M.head.add(m); }
  for (const s of [1, -1]) { const t = furMesh(ellipsoid(0.008, 0.026, 0.016, 12, 10), { base: 0x77777a, tip: 0xb0b0b0, furLen: 0.005, density: 500, layers: 8 }); t.position.set(s * 0.082, 0.128, 0.0); M.head.add(t);
    const b = mesh(ellipsoid(0.028, 0.005, 0.009, 14, 8), new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.9 }), M.head, s * 0.036, 0.142, surf(s * 0.036, 0.142) + 0.004); b.rotation.z = -s * 0.07; M.brows = M.brows || []; M.brows.push(b); }
  M.eyes = [];
  for (const s of [1, -1]) { const eg = makeEyeHuman(0.0125, ['#7a4a1e', '#2a1408']); eg.position.set(s * 0.034, 0.118, surf(s * 0.034, 0.118) - 0.0035); eg.rotation.y = s * 0.1; M.head.add(eg); M.eyes.push(eg); }
  // songkok
  { const g = lathePts([[0, 0.094], [0.01, 0.096], [0.072, 0.092], [0.082, 0.085], [0.085, 0.001]], 48); const sk = mesh(g, new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.95 }), M.head, 0, 0.19, -0.008); sk.rotation.x = -0.16;
    const band = mesh(new THREE.TorusGeometry(0.094, 0.003, 8, 40), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.7, roughness: 0.35 }), M.head, 0, 0.195, -0.008); band.rotation.x = Math.PI / 2 - 0.16; }
  // props that attach to the body
  M.bucketSlot = new THREE.Group(); M.bucketSlot.position.set(0, 0.19, 0); M.head.add(M.bucketSlot);
  M.setupDone = true;

  // ----- posing -----
  M.pose = function (p) {
    const ph = p.ph || 0, amp = p.amp || 0;
    M.feet.forEach((f, i) => { const s = i ? -1 : 1, a = Math.sin(ph + (i ? Math.PI : 0)); f.position.z = a * 0.3 * amp; f.position.y = Math.max(0, Math.cos(ph + (i ? Math.PI : 0))) * 0.09 * amp; f.rotation.x = -a * 0.25 * amp; });
    M.skirt.rotation.x = Math.sin(ph) * 0.07 * amp + (p.lean || 0) * 0.3; M.skirt.rotation.z = Math.sin(ph * 0.5) * 0.04 * amp;
    M.torso.rotation.set((p.lean || 0), (p.twist || 0) + Math.sin(ph) * 0.07 * amp, Math.sin(ph) * 0.03 * amp);
    M.hips.position.y = 0.92 + Math.abs(Math.sin(ph)) * 0.025 * amp + (p.hipDrop || 0); M.skirt.position.y = M.hips.position.y; M.torso.position.y = M.hips.position.y - 0.02;
    M.neck.rotation.set(p.neckPitch || 0, p.headYaw || 0, p.headRoll || 0); M.head.rotation.x = p.headPitch || 0;
    M.jaw.rotation.x = (p.mouth || 0) * 0.36; const open = p.mouth || 0; M.jaw.position.z = -open * 0.004;
    M.eyes.forEach(e => { const k = p.blink || 0; e.userData.lu.value = e.userData.R * 1.1 * (1 - 2 * k) - (k > 0.98 ? 1 : 0); e.userData.lid.visible = k > 0.01; e.rotation.y = (p.eyeYaw || 0); e.rotation.x = (p.eyePitch || 0); });
    M.brows.forEach((b, i) => { b.position.y = 0.142 + (p.brow || 0) * 0.012; b.rotation.z = (i ? 1 : -1) * 0.07 + (i ? -1 : 1) * (p.browAngry || 0) * 0.25; });
    // arms: {fw, out, el, tw, curl, point}
    [p.armL || {}, p.armR || {}].forEach((a, i) => { const arm = M.arms[i], s = arm.s;
      const swing = (p.swingArms ? (i ? 1 : -1) * Math.sin(ph) * 0.55 * amp : 0);
      arm.sh.rotation.set(-((a.fw || 0) + swing), a.tw || 0, s * (a.out === undefined ? 0.07 : a.out));
      arm.el.rotation.set(-((a.el === undefined ? 0.12 : a.el) + (p.swingArms ? Math.max(0, -swing) * 0.5 : 0)), 0, 0);
      arm.hand.rotation.set(a.hx || 0, a.hy || 0, a.hz || 0);
      const curl = a.curl === undefined ? 0.35 : a.curl;
      arm.fingers.forEach((f, k) => { const c = (a.point && k === 0) ? 0.05 : curl * (1.35 - k * 0.1); f.rotation.x = -c * 1.2; f.userData.f2.rotation.x = -c * 1.3; });
      arm.th.rotation.x = -0.2 - curl * 0.5; arm.th2.rotation.x = -0.2 - curl * 0.4; });
    M.root.userData.pose = p;
  };
  M.pose({});
  return M;
}
function capsuleSimple(r, len) { const g = new THREE.CapsuleGeometry(r, len, 5, 10); g.translate(0, -len / 2 - r * 0.4, 0); return g; }
