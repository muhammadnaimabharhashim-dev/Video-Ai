// Procedural hen (feather shell fur, comb/wattle/beak, scaly legs). Faces +x, feet at y=0.
function makeHen() {
  const H = { root: new THREE.Group() }; H.root.rotation.order = 'YXZ';
  const FEA = { base: 0xf1ece0, tip: 0xfffdf6, belly: 0xe9e2d2, stripe: 0, furLen: 0.011, density: 520, layers: 12 };
  const fur = (g, o = {}) => furMesh(g, Object.assign({}, FEA, o));
  const red = new THREE.MeshStandardMaterial({ color: 0xc4221f, roughness: 0.45 }), orange = new THREE.MeshStandardMaterial({ color: 0xe89a1c, roughness: 0.45 });
  const legM = new THREE.MeshStandardMaterial({ color: 0xe0a82a, roughness: 0.6 });
  H.body = new THREE.Group(); H.body.position.y = 0.26; H.root.add(H.body);
  H.body.add(fur(ellipsoid(0.2, 0.15, 0.125, 36, 24)));
  const chest = fur(ellipsoid(0.12, 0.13, 0.11, 28, 20)); chest.position.set(0.13, 0.03, 0); H.body.add(chest);
  H.tail = new THREE.Group(); H.tail.position.set(-0.17, 0.07, 0); H.body.add(H.tail);
  for (let i = 0; i < 5; i++) { const f = fur(ellipsoid(0.13, 0.04, 0.012, 20, 10), { layers: 8, furLen: 0.007, base: i % 2 ? 0xe8e2d4 : 0xf4efe4 }); f.position.set(-0.07, 0.07, 0); const g = new THREE.Group(); g.rotation.z = 0.35 + i * 0.1; g.rotation.y = (i - 2) * 0.22; g.add(f); H.tail.add(g); }
  H.wings = [];
  for (const s of [1, -1]) { const w = new THREE.Group(); w.position.set(-0.01, 0.04, s * 0.115); H.body.add(w); const m = fur(ellipsoid(0.13, 0.085, 0.02, 24, 14), { layers: 10, furLen: 0.008, base: 0xe9e3d3 }); m.position.set(-0.04, -0.02, s * 0.006); w.add(m); H.wings.push(w); }
  // neck + head
  H.neck = new THREE.Group(); H.neck.position.set(0.19, 0.08, 0); H.body.add(H.neck);
  const neckM = fur(ellipsoid(0.05, 0.1, 0.055, 20, 14), { layers: 10 }); neckM.position.set(0.02, 0.07, 0); neckM.rotation.z = -0.25; H.neck.add(neckM);
  H.head = new THREE.Group(); H.head.position.set(0.04, 0.17, 0); H.neck.add(H.head);
  H.head.add(fur(ellipsoid(0.052, 0.05, 0.046, 24, 16), { layers: 8, furLen: 0.005, density: 600 }));
  const comb = new THREE.Group(); comb.position.set(0.0, 0.05, 0); H.head.add(comb);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(ellipsoid(0.014, 0.022 - Math.abs(i - 1.5) * 0.004, 0.007, 12, 10), red); c.position.set(-0.025 + i * 0.02, 0.01, 0); comb.add(c); }
  H.beakUp = new THREE.Group(); H.beakUp.position.set(0.045, -0.005, 0); H.head.add(H.beakUp);
  const bu = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 14), orange); bu.rotation.z = -Math.PI / 2; bu.position.x = 0.022; bu.scale.z = 0.8; H.beakUp.add(bu);
  H.beakLow = new THREE.Group(); H.beakLow.position.set(0.045, -0.014, 0); H.head.add(H.beakLow);
  const bl = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.04, 12), orange); bl.rotation.z = -Math.PI / 2; bl.position.x = 0.018; bl.scale.z = 0.7; H.beakLow.add(bl);
  for (const s of [1, -1]) { const w = new THREE.Mesh(ellipsoid(0.008, 0.02, 0.007, 10, 8), red); w.position.set(0.03, -0.035, s * 0.01); H.head.add(w); }
  const wat = new THREE.Mesh(ellipsoid(0.011, 0.026, 0.012, 12, 10), red); wat.position.set(0.038, -0.04, 0); H.head.add(wat);
  H.eyes = [];
  for (const s of [1, -1]) { const e = makeEyeHuman(0.0085, ['#d8902a', '#7a3a10']); e.position.set(0.03, 0.012, s * 0.04); e.rotation.y = s > 0 ? 0.35 : Math.PI - 0.35; H.head.add(e); H.eyes.push(e); }
  // legs
  H.legs = [];
  for (const s of [1, -1]) {
    const hip = new THREE.Group(); hip.position.set(0.0, -0.02, s * 0.065); H.body.add(hip);
    const th = fur(ellipsoid(0.05, 0.075, 0.04, 16, 12), { layers: 8 }); th.position.y = -0.04; hip.add(th);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0085, 0.12, 10), legM); upper.position.y = -0.11; upper.castShadow = true; hip.add(upper);
    const knee = new THREE.Group(); knee.position.y = -0.17; hip.add(knee);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0075, 0.1, 10), legM); lower.position.y = -0.04; lower.castShadow = true; knee.add(lower);
    const foot = new THREE.Group(); foot.position.y = -0.09; knee.add(foot);
    for (let k = -1; k <= 1; k++) { const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.06, 4, 8), legM); t.rotation.z = Math.PI / 2; t.rotation.x = 0; t.position.set(0.03, 0, k * 0.022); t.rotation.y = k * 0.35; foot.add(t); }
    const bk = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.03, 4, 8), legM); bk.rotation.z = Math.PI / 2; bk.position.set(-0.016, 0.0, 0); foot.add(bk);
    H.legs.push({ hip, knee, foot, s });
  }
  H.slotEgg = new THREE.Group(); H.slotEgg.position.set(-0.12, -0.12, 0); H.body.add(H.slotEgg);
  H.pose = function (p) {
    const ph = p.ph || 0, amp = p.amp || 0, bob = Math.sin(ph * 2) * 0.012 * amp;
    H.body.position.y = 0.26 + bob - (p.squat || 0) * 0.09; H.body.rotation.z = (p.pitch || 0) - (p.peck || 0) * 0.5; H.body.rotation.x = (p.roll || 0);
    H.legs.forEach((L, i) => { const a = Math.sin(ph + (i ? Math.PI : 0)); L.hip.rotation.z = -a * 0.75 * amp; L.knee.rotation.z = (Math.max(0, Math.cos(ph + (i ? Math.PI : 0))) * 1.0) * amp + (p.squat || 0) * 0.9; L.foot.rotation.z = -L.hip.rotation.z - L.knee.rotation.z; });
    H.neck.rotation.z = (p.neckPitch || 0) + (p.peck || 0) * 1.2 - Math.sin(ph * 2 + 1) * 0.12 * amp; H.head.rotation.z = (p.headPitch || 0) - (p.peck || 0) * 0.7; H.head.rotation.y = p.headYaw || 0;
    H.beakLow.rotation.z = -(p.beak || 0) * 0.6; H.beakUp.rotation.z = (p.beak || 0) * 0.15;
    H.wings.forEach((w, i) => { const s = i ? -1 : 1; const fl = (p.flap || 0) * Math.sin((p.flapPh || 0)) ; w.rotation.x = s * (0.06 + (p.wingOut || 0) + fl * 0.9); w.rotation.z = 0.0; });
    H.tail.rotation.z = (p.tailUp || 0) + Math.sin(ph * 2) * 0.08 * amp;
    H.eyes.forEach(e => { const k = p.blink || 0; e.userData.lu.value = e.userData.R * 1.1 * (1 - 2 * k) - (k > 0.98 ? 1 : 0); e.userData.lid.visible = k > 0.01; });
  };
  H.pose({});
  return H;
}
