// Procedural quadruped rig (dog / cat) with shell fur. Body faces +x, feet at y=0.
const ellipsoid = (rx, ry, rz, ws = 28, hs = 18) => { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); g.userData.kind = 'sphere'; return g; };
// tapered limb hanging down from the origin (lathe => clean UVs for fur)
const capsule = (r, len) => { const P = []; const N = 18; for (let i = 0; i <= N; i++) { const t = i / N; let rr = r * (1.0 - 0.28 * t); if (t < 0.06) rr *= Math.sqrt(t / 0.06); if (t > 0.94) rr *= Math.sqrt((1 - t) / 0.06); P.push(new THREE.Vector2(Math.max(rr, 0.0004), -t * (len + r))); } const g = new THREE.LatheGeometry(P, 20); g.userData.kind = 'capsule'; return g; };
// smooth body of revolution along +x. pts: [[t(0..1), radius(0..1)]...], length L, elliptic cross-section ry/rz
function latheBody(pts, L, ry, rz, x0) {
  const P = []; for (let i = 0; i <= 28; i++) { const t = i / 28; let r = 0; for (let k = 0; k < pts.length - 1; k++) if (t >= pts[k][0] && t <= pts[k + 1][0]) { const u = (t - pts[k][0]) / (pts[k + 1][0] - pts[k][0]); r = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * (u * u * (3 - 2 * u)); } P.push(new THREE.Vector2(Math.max(r, 0.0005), t * L)); }
  const g = new THREE.LatheGeometry(P, 40); g.rotateZ(-Math.PI / 2); g.scale(1, ry, rz); g.translate(x0, 0, 0); g.userData.kind = 'lathe'; return g;
}   // hangs down from origin
const glossy = (c, rough = 0.15) => new THREE.MeshPhysicalMaterial({ color: c, roughness: rough, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 });
function irisTexture(c1, c2) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
  const g = x.createRadialGradient(128, 128, 8, 128, 128, 128); g.addColorStop(0, c1); g.addColorStop(0.65, c2); g.addColorStop(1, '#1a1208'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const r = rng(9); for (let i = 0; i < 160; i++) { const a = r() * 6.283; x.strokeStyle = `rgba(${r() > 0.5 ? '255,240,160' : '60,40,10'},${0.2 + r() * 0.25})`; x.lineWidth = 1 + r() * 2; x.beginPath(); x.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30); x.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118); x.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeQuad(c) {
  const A = { root: new THREE.Group(), cfg: c };
  const fur = (geo, o = {}) => furMesh(geo, Object.assign({}, c.fur, o));
  A.body = new THREE.Group(); A.body.position.y = c.legLen + c.torsoRy * 0.55; A.root.add(A.body);
  const L = c.torsoLen * 1.22, Lr = L * 0.52, Lf = L * 0.48;
  A.hind = new THREE.Group(); A.body.add(A.hind);
  A.hind.add(fur(latheBody([[0, 0.0], [0.06, 0.55], [0.22, 0.88], [0.5, 1.0], [0.8, 0.94], [1, 0.88]], Lr, c.torsoRy * 0.98, c.torsoRz * 0.98, -Lr)));
  A.chest = new THREE.Group(); A.body.add(A.chest);
  A.chest.add(fur(latheBody([[0, 0.88], [0.25, 1.0], [0.55, 1.04], [0.82, 0.92], [0.94, 0.66], [1, 0.0]].map(p => [p[0], p[1]]), Lf, c.torsoRy * 1.06, c.torsoRz * 1.02, 0)));
  A.torsoL = [Lr, Lf];
  // neck + head
  A.neck = new THREE.Group(); A.neck.position.set(A.torsoL[1] * 0.78, c.torsoRy * 0.55, 0); A.chest.add(A.neck);
  const neckM = fur(ellipsoid(c.neckLen * 0.6, c.neckR, c.neckR * 1.0)); neckM.position.set(c.neckLen * 0.35, c.neckLen * 0.25, 0); neckM.rotation.z = 0.7; A.neck.add(neckM);
  A.head = new THREE.Group(); A.head.position.set(c.neckLen * 0.62, c.neckLen * 0.55, 0); A.neck.add(A.head);
  A.head.add(fur(ellipsoid(c.headR * 1.1, c.headR, c.headR * 0.98), { furLen: c.fur.furLen * 0.8 }));
  const mz = c.muzzle ? { base: c.muzzle[0], tip: c.muzzle[1] } : {}; const snout = fur(ellipsoid(c.snoutLen, c.headR * c.snoutH, c.headR * c.snoutW), Object.assign({ furLen: c.fur.furLen * 0.5 }, mz)); snout.position.set(c.headR * 0.95, -c.headR * 0.22, 0); A.head.add(snout);
  A.jaw = new THREE.Group(); A.jaw.position.set(c.headR * 0.6, -c.headR * 0.45, 0); A.head.add(A.jaw);
  const jawM = fur(ellipsoid(c.snoutLen * 0.9, c.headR * 0.22, c.headR * c.snoutW * 0.8), Object.assign({ furLen: c.fur.furLen * 0.4 }, mz)); jawM.position.set(c.snoutLen * 0.55, -c.headR * 0.05, 0); A.jaw.add(jawM);
  const mouthIn = new THREE.Mesh(ellipsoid(c.snoutLen * 0.85, c.headR * 0.1, c.headR * c.snoutW * 0.7, 16, 10), new THREE.MeshStandardMaterial({ color: 0x5a1520, roughness: 0.5 })); mouthIn.position.set(c.snoutLen * 0.5, c.headR * 0.04, 0); A.jaw.add(mouthIn);
  const nose = new THREE.Mesh(ellipsoid(c.noseR * 1.2, c.noseR, c.noseR * 1.3, 16, 12), glossy(c.noseCol, 0.25)); nose.position.set(c.headR * 0.95 + c.snoutLen * 0.93, -c.headR * 0.12, 0); A.head.add(nose);
  // eyes (+ eyelids)
  A.eyes = [];
  for (const s of [1, -1]) {
    const eg = new THREE.Group(); eg.position.set(c.headR * c.eyeX, c.headR * 0.25, s * c.headR * c.eyeZ); eg.rotation.y = s * -0.28; A.head.add(eg);
    const R = c.eyeR;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), new THREE.MeshStandardMaterial({ color: 0xb9b1a0, roughness: 0.45 })); eg.add(ball);
    const cap = (radius, theta, zs, polar) => { const g = new THREE.SphereGeometry(radius, 36, 12, 0, Math.PI * 2, 0, theta); g.rotateZ(-Math.PI / 2); if (polar) { const p = g.attributes.position, uv = g.attributes.uv, rr = radius * Math.sin(theta); for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getZ(i) / (2 * rr), 0.5 + p.getY(i) / (2 * rr)); } g.scale(1, 1, zs); return g; };
    const iris = new THREE.Mesh(cap(R * 1.004, 0.66, 1, true), new THREE.MeshBasicMaterial({ map: irisTexture(c.iris1, c.iris2), color: 0xb0b0b0 })); eg.add(iris);
    const pup = new THREE.Mesh(cap(R * 1.008, 0.36, c.cat ? 0.3 : 1, false), new THREE.MeshBasicMaterial({ color: 0x020202 })); eg.add(pup); eg.userData.pup = pup;
    const glint = new THREE.Mesh(new THREE.SphereGeometry(R * 0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff6e8 })); glint.position.set(R * 0.93, R * 0.3, R * 0.2); eg.add(glint);
    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(R * 0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffeedd })); glint2.position.set(R * 0.95, -R * 0.25, -R * 0.22); eg.add(glint2);
    const lidMat = new THREE.MeshStandardMaterial({ color: c.lidCol, roughness: 0.95 });
    const closedLine = new THREE.Mesh(new THREE.TorusGeometry(R * 0.78, R * 0.07, 6, 24, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a0a02 })); closedLine.geometry.rotateY(Math.PI / 2); closedLine.geometry.rotateX(Math.PI); closedLine.position.set(R * 0.97, -R * 0.1, 0); closedLine.visible = false; eg.add(closedLine); eg.userData.cl = closedLine; const lu = { value: 9 };
    lidMat.onBeforeCompile = sh => { sh.uniforms.uT = lu; sh.vertexShader = 'varying float vLy;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLy = position.y;'); sh.fragmentShader = 'varying float vLy; uniform float uT;\n' + sh.fragmentShader.replace('void main() {', 'void main() { if (vLy < uT) discard;'); };
    const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 32, 24), lidMat); eg.add(lid); eg.userData.lu = lu; eg.userData.R = R;
    eg.userData.lid = lid; A.eyes.push(eg);
  }
  // ears
  A.ears = [];
  for (const s of [1, -1]) {
    const eg = new THREE.Group(); eg.position.set(-c.headR * 0.1, c.headR * 0.72, s * c.headR * 0.62); A.head.add(eg);
    const geo = c.cat ? new THREE.ConeGeometry(c.earW, c.earH, 20, 1) : ellipsoid(c.earW * 0.55, c.earH * 0.5, c.earW * 0.16, 16, 12);
    const m = c.cat ? furMesh(geo, Object.assign({}, c.fur, { layers: 6, furLen: 0.006 })) : furMesh(geo, Object.assign({}, c.fur, { base: c.earCol, tip: c.earCol, layers: 6, stripe: 0 }));
    m.position.y = c.cat ? c.earH * 0.45 : -c.earH * 0.4; eg.add(m); eg.rotation.x = s * (c.cat ? -0.25 : -0.5); A.ears.push(eg);
    if (c.cat) { const inner = new THREE.Mesh(new THREE.ConeGeometry(c.earW * 0.62, c.earH * 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xe8a0a8, roughness: 0.7 })); inner.position.set(c.earW * 0.28, c.earH * 0.42, 0); inner.scale.z = 0.5; eg.add(inner); }
  }
  if (c.cat) { // whiskers
    A.whisk = new THREE.Group(); A.head.add(A.whisk);
    for (const s of [1, -1]) for (let i = 0; i < 4; i++) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.00055, 0.00018, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0xcfcfc8, roughness: 0.6 }));
      w.geometry.translate(0, 0.06, 0); w.position.set(c.headR * 1.55, -c.headR * (0.12 + i * 0.06), s * c.headR * 0.28); w.rotation.set(s * (1.35 + i * 0.1), 0, -0.25 + i * 0.12); A.whisk.add(w);
    }
  }
  // legs
  A.legs = [];
  const mkLeg = (x, z, front) => {
    const hip = new THREE.Group(); hip.position.set(x, -c.torsoRy * 0.1, z); (front ? A.chest : A.hind).add(hip); 
    const upG = ellipsoid(c.legR * (front ? 1.5 : 2.1), c.legLen * (front ? 0.30 : 0.34), c.legR * (front ? 1.5 : 1.9), 20, 14); upG.translate(0, -c.legLen * (front ? 0.22 : 0.25), 0);
    const up = furMesh(upG, Object.assign({}, c.fur, { layers: 10 })); hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -c.legLen * 0.5; hip.add(knee);
    const low = furMesh(capsule(c.legR * 0.85, c.legLen * 0.5), Object.assign({}, c.fur, { layers: 10, stripe: (c.fur.stripe || 0) * 0.35 })); knee.add(low);
    const paw = furMesh(ellipsoid(c.legR * 1.5, c.legR * 0.9, c.legR * 1.25, 18, 12), Object.assign({}, c.fur, { layers: 6, base: c.pawCol || c.fur.base, tip: c.pawCol || c.fur.tip })); paw.position.set(c.legR * 0.7, -c.legLen * 0.5 - c.legR * 0.2, 0); knee.add(paw);
    A.legs.push({ hip, knee, front, side: Math.sign(z) });
  };
  mkLeg(A.torsoL[1] * 0.58, c.torsoRz * 0.8, true); mkLeg(A.torsoL[1] * 0.58, -c.torsoRz * 0.8, true);
  mkLeg(-A.torsoL[0] * 0.55, c.torsoRz * 0.82, false); mkLeg(-A.torsoL[0] * 0.55, -c.torsoRz * 0.82, false);
  // tail (chain)
  A.tail = []; let parent = A.hind; const seg0 = c.tailLen / c.tailSegs;
  for (let i = 0; i < c.tailSegs; i++) {
    const gp = new THREE.Group(); gp.position.set(i === 0 ? -A.torsoL[0] * 0.97 : -seg0 * 0.9, i === 0 ? c.torsoRy * 0.3 : 0, 0); parent.add(gp);
    const r = c.tailR * (1 - i / (c.tailSegs * 1.6)); const m = furMesh(ellipsoid(seg0 * 0.62, r, r, 14, 10), Object.assign({}, c.fur, { layers: 8, furLen: c.fur.furLen * (c.tailFluff || 1) })); m.position.x = -seg0 * 0.45; gp.add(m);
    A.tail.push(gp); parent = gp;
  }
  A.furUniforms = []; A.root.traverse(o => { if (o.userData && o.userData.uniforms) A.furUniforms.push(o.userData.uniforms); });
  A.setFurLen = k => A.furUniforms.forEach(u => { if (u._len0 === undefined) u._len0 = u.furLen.value; u.furLen.value = u._len0 * k; });
  // ----- posing -----
  const rest = {};
  A.pose = function (p) {
    // p: phase, amp (gait swing 0..1), bob, pitch, flex, headPitch, headYaw, neckPitch, jaw, tailUp, tailWag, lidClose(0..1), earBack, tuck (0..1 loaf), sit (0..1), lie (0..1), height
    const ph = p.phase || 0, amp = p.amp === undefined ? 0 : p.amp, tuck = p.tuck || 0, sit = p.sit || 0;
    const swing = 0.95 * amp * c.swing, knee = 1.15 * amp;
    const phases = c.cat ? [0, 0.35, 3.1, 3.5] : [0, 0.4, 3.0, 3.35];   // FL, FR, HL, HR
    A.legs.forEach((L, i) => {
      const f = ph + phases[i], s = Math.sin(f), lift = Math.max(0, Math.cos(f));
      let hipA = (L.front ? 1 : -1) * s * swing * 0.9 + (L.front ? 0.0 : 0.15) * amp, kneeA = -(lift * knee) * (L.front ? 1 : -0.4) - (L.front ? 0.05 : 0.0);
      if (!L.front) { hipA = s * swing * 0.9 * (L.front ? 1 : 1) - 0.2 * amp; kneeA = (lift * knee * 1.1); }
      // blend poses
      hipA = lerp(hipA, L.front ? 1.45 : -1.5, tuck); kneeA = lerp(kneeA, L.front ? -2.5 : 2.5, tuck);
      hipA = lerp(hipA, L.front ? 0.0 : -1.15, sit); kneeA = lerp(kneeA, L.front ? 0.0 : 2.0, sit);
      L.hip.rotation.z = hipA; L.knee.rotation.z = kneeA;
    });
    A.body.position.y = c.legLen + c.torsoRy * 0.55 + (p.bob || 0) - tuck * (c.legLen * 0.86) - sit * c.legLen * 0.55 + (p.height || 0);
    A.root.rotation.z = (p.pitch || 0) + sit * 0.55;
    A.chest.rotation.z = (p.flex || 0); A.hind.rotation.z = -(p.flex || 0) * 0.6;
    A.neck.rotation.z = (p.neckPitch || 0) - sit * 0.5 - tuck * 0.2;
    A.head.rotation.z = (p.headPitch || 0); A.head.rotation.y = p.headYaw || 0;
    A.jaw.rotation.z = -(p.jaw || 0);
    A.tail.forEach((g, i) => { g.rotation.z = (p.tailUp || 0) / A.tail.length + Math.sin((p.tailPh || 0) - i * 0.7) * (p.tailWag || 0) * 0.3; g.rotation.y = Math.sin((p.tailPh || 0) * 1.0 - i * 0.7 + 1.5) * (p.tailWag || 0) * 0.35; });
    A.eyes.forEach(e => { const k = p.lidClose || 0; e.userData.lu.value = e.userData.R * 1.07 * (1 - 2 * k) - (k > 0.98 ? 1 : 0); e.userData.lid.visible = k > 0.01; e.userData.cl.visible = k > 0.82; });
    A.ears.forEach((e, i) => { e.rotation.z = -(p.earBack || 0); });
    A.root.userData.pose = p;
  };
  A.pose({});
  return A;
}

const DOG_CFG = { cat: false, legLen: 0.54, legR: 0.047, torsoLen: 0.84, torsoRy: 0.175, torsoRz: 0.150, hipRx: 0.27, chestRx: 0.30, neckLen: 0.30, neckR: 0.09, headR: 0.112, snoutLen: 0.145, snoutH: 0.52, snoutW: 0.52, noseR: 0.024, noseCol: 0x0a0a0a,
  eyeR: 0.0165, eyeX: 0.66, eyeZ: 0.66, iris1: '#6a3a14', iris2: '#2a1408', lidCol: 0xb7894f, earW: 0.075, earH: 0.19, earCol: 0x6b4423, muzzle: [0x4a3524, 0x6a4f38], tailLen: 0.5, tailSegs: 4, tailR: 0.04, swing: 1.0, pawCol: 0xe6c9a0,
  fur: { base: 0xb98446, tip: 0xe0b072, belly: 0xefd9b0, stripe: 0, furLen: 0.012, density: 330, layers: 14 } };
const CAT_CFG = { cat: true, legLen: 0.27, legR: 0.024, torsoLen: 0.40, torsoRy: 0.088, torsoRz: 0.078, hipRx: 0.13, chestRx: 0.13, neckLen: 0.13, neckR: 0.055, headR: 0.075, snoutLen: 0.03, snoutH: 0.42, snoutW: 0.5, noseR: 0.009, noseCol: 0xe58a95,
  eyeR: 0.0165, eyeX: 0.78, eyeZ: 0.62, iris1: '#d8d040', iris2: '#5c8a1c', lidCol: 0x9a5018, earW: 0.032, earH: 0.062, earCol: 0xc88a50, tailLen: 0.42, tailSegs: 5, tailR: 0.022, swing: 1.0, pawCol: 0xf4ead8, tailFluff: 1.3,
  fur: { base: 0xd9791e, tip: 0xf2a54a, belly: 0xf6e3c4, stripe: 0.95, stripeCol: 0x7a3a0c, furLen: 0.009, density: 560, layers: 14 } };
