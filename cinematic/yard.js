// A tidy kampung yard: stilt house, durian tree, coop, palms, banana plants, bamboo fence, clothes line, paddy + hills.
function woodTexture(base, rep, seed = 11, planks = 0) {
  return texCanvas(512, (x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); const rr = rng(seed);
    for (let i = 0; i < 110; i++) { x.strokeStyle = `rgba(${rr() > 0.5 ? '40,25,10' : '210,180,130'},${0.07 + rr() * 0.14})`; x.lineWidth = 1 + rr() * 3; x.beginPath(); const y = rr() * s; x.moveTo(0, y); x.bezierCurveTo(s * 0.3, y + (rr() - 0.5) * 14, s * 0.7, y + (rr() - 0.5) * 14, s, y + (rr() - 0.5) * 8); x.stroke(); }
    if (planks) for (let i = 0; i < planks; i++) { x.fillStyle = 'rgba(25,14,6,.55)'; x.fillRect(0, i * s / planks, s, 2.5); }
    for (let k = 0; k < 14; k++) { const px = rr() * s, py = rr() * s; x.fillStyle = 'rgba(40,22,8,.35)'; x.beginPath(); x.ellipse(px, py, 3 + rr() * 5, 2 + rr() * 3, 0, 0, 6.28); x.fill(); } }, rep);
}
function leafTex(kind) {
  const w = kind === 'frond' ? 512 : 128, h = kind === 'frond' ? 128 : 256;
  return texCanvas(256, (x, s) => {
    x.canvas.width = w; x.canvas.height = h; x.clearRect(0, 0, w, h);
    if (kind === 'leaf') { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#2d6a24'); g.addColorStop(0.5, '#4a9a38'); g.addColorStop(1, '#2a6020'); x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, h - 2); x.bezierCurveTo(w * 1.05, h * 0.7, w * 0.95, h * 0.25, w / 2, 2); x.bezierCurveTo(w * 0.05, h * 0.25, -w * 0.05, h * 0.7, w / 2, h - 2); x.fill();
      x.strokeStyle = 'rgba(210,235,160,.65)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(w / 2, h - 2); x.lineTo(w / 2, 6); x.stroke(); x.lineWidth = 1; x.strokeStyle = 'rgba(190,220,140,.35)'; for (let i = 0; i < 9; i++) { const yy = h - 24 - i * 24; x.beginPath(); x.moveTo(w / 2, yy); x.lineTo(w * 0.12, yy - 26); x.moveTo(w / 2, yy); x.lineTo(w * 0.88, yy - 26); x.stroke(); } }
    else if (kind === 'banana') { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#3f8a2c'); g.addColorStop(0.5, '#62ae44'); g.addColorStop(1, '#3a7e28'); x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, h); x.bezierCurveTo(w * 1.1, h * 0.8, w * 1.0, h * 0.2, w / 2, 0); x.bezierCurveTo(0, h * 0.2, -w * 0.1, h * 0.8, w / 2, h); x.fill();
      x.strokeStyle = 'rgba(30,70,20,.5)'; x.lineWidth = 1; for (let i = 0; i < 46; i++) { const yy = h - 6 - i * (h / 46); x.beginPath(); x.moveTo(w / 2, yy); x.lineTo(w * 0.02, yy - 22); x.moveTo(w / 2, yy); x.lineTo(w * 0.98, yy - 22); x.stroke(); }
      x.strokeStyle = 'rgba(190,225,130,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2, h); x.lineTo(w / 2, 0); x.stroke();
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; const rr = rng(4); for (let i = 0; i < 9; i++) { const yy = rr() * h; x.beginPath(); x.moveTo(w * 0.62, yy); x.lineTo(w * 1.05, yy - 6); x.lineTo(w * 1.05, yy + 8); x.fill(); x.beginPath(); x.moveTo(w * 0.38, yy + 20); x.lineTo(-w * 0.05, yy + 14); x.lineTo(-w * 0.05, yy + 28); x.fill(); } x.globalCompositeOperation = 'source-over'; }
    else { // coconut frond: rib along x, leaflets angled backwards
      x.strokeStyle = '#5a6a2a'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
      for (let i = 0; i < 70; i++) { const px = 8 + i * (w - 20) / 70, ln = (h / 2 - 2) * (1 - Math.pow(i / 70, 1.6) * 0.8); x.strokeStyle = i % 2 ? '#3a7a2a' : '#2f6a22'; x.lineWidth = 3.2; for (const sg of [-1, 1]) { x.beginPath(); x.moveTo(px, h / 2); x.lineTo(px + ln * 0.42, h / 2 + sg * ln); x.stroke(); } } }
  });
}
let LEAF_TEX = null, BANANA_TEX = null, FROND_TEX = null;
function leafMesh(count, seed, spread, size, cols, parent, pos, upBias = 0.3) {
  LEAF_TEX = LEAF_TEX || leafTex('leaf'); LEAF_TEX.wrapS = LEAF_TEX.wrapT = THREE.ClampToEdgeWrapping; LEAF_TEX.repeat.set(1, 1);
  const g = new THREE.PlaneGeometry(1, 1, 1, 4); g.translate(0, 0.5, 0); { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getY(i), 2) * 0.35); g.computeVertexNormals(); }
  const m = new THREE.MeshStandardMaterial({ map: LEAF_TEX, alphaTest: 0.5, roughness: 0.5, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(g, m, count); const r = rng(seed), q = new THREE.Quaternion(), e = new THREE.Euler(), m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3((r() - 0.5) * 2, (r() - 0.5) * 2 * (1 - upBias) + upBias * 0.8, (r() - 0.5) * 2).normalize(); const rad = Math.cbrt(r()) * spread;
    const p = dir.clone().multiplyScalar(rad); p.y *= 0.72; e.set((r() - 0.5) * 2.4, r() * 6.28, (r() - 0.5) * 2.4); q.setFromEuler(e);
    const s = size * (0.7 + r() * 0.8); m4.compose(p, q, new THREE.Vector3(s * 0.55, s, 1)); im.setMatrixAt(i, m4); c.set(cols[(r() * cols.length) | 0]).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.08); im.setColorAt(i, c);
  }
  im.position.copy(pos); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; parent.add(im); return im;
}
function palmTree(parent, x, z, h, seed, lean = 0.1) {
  FROND_TEX = FROND_TEX || leafTex('frond');
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); const r = rng(seed);
  const barkTex = texCanvas(256, (cx, s) => { cx.fillStyle = '#8a7a64'; cx.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 16) { cx.fillStyle = 'rgba(40,30,20,.55)'; cx.fillRect(0, i, s, 3); } speckle(cx, s, 2500, ['#6f5f4a', '#a09078'], 0.6, 2, 7); }, [1, h * 1.2]);
  const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 0.5) * lean * h * 0.5, t * h, 0)); }
  const curve = new THREE.CatmullRomCurve3(pts); const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.2, 12, false), new THREE.MeshStandardMaterial({ map: barkTex, roughness: 1, bumpMap: barkTex, bumpScale: 2 })); trunk.castShadow = true; g.add(trunk);
  const top = pts[pts.length - 1];
  for (let f = 0; f < 14; f++) {
    const fg = new THREE.Group(); fg.position.copy(top); fg.rotation.y = f / 14 * 6.283 + r() * 0.3; g.add(fg);
    const len = 3.8 + r() * 1.2, droop = 0.6 + r() * 0.7; const fgG = new THREE.PlaneGeometry(len, 1.9, 14, 2); fgG.translate(len / 2, 0, 0);
    { const p = fgG.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / len; p.setY(i, p.getY(i) * (1 - 0.3 * u) ); p.setZ(i, p.getZ(i)); const px = p.getX(i); p.setX(i, px); } }
    const fm = new THREE.Mesh(fgG, new THREE.MeshStandardMaterial({ map: FROND_TEX, alphaTest: 0.45, roughness: 0.55, side: THREE.DoubleSide, color: new THREE.Color().setHSL(0.27, 0.5 + r() * 0.1, 0.6 + r() * 0.2) })); fm.rotation.x = Math.PI / 2 * 0.75 + r() * 0.3; fm.castShadow = true;
    // bend the frond downward along its length
    { const p = fgG.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / len; p.setZ(i, p.getZ(i) - droop * u * u * 1.4); p.setY(i, p.getY(i) + Math.sin(u * 2.4) * 0.5); } fgG.computeVertexNormals(); }
    fg.add(fm);
  }
  for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x5a7a2a, roughness: 0.6 })); c.position.set(top.x + (r() - 0.5) * 0.4, top.y - 0.3, (r() - 0.5) * 0.4); g.add(c); }
  return g;
}
function bananaPlant(parent, x, z, seed) {
  BANANA_TEX = BANANA_TEX || leafTex('banana');
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); const r = rng(seed);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2.4, 14), new THREE.MeshStandardMaterial({ color: 0x8aa850, roughness: 0.7 })); stem.position.y = 1.2; stem.castShadow = true; g.add(stem);
  for (let i = 0; i < 9; i++) { const lg = new THREE.PlaneGeometry(1.0, 2.9, 4, 12); lg.translate(0, 1.45, 0); const p = lg.attributes.position; for (let v = 0; v < p.count; v++) { const yy = p.getY(v) / 2.9, xx = p.getX(v); p.setZ(v, -yy * yy * 1.1 + Math.abs(xx) * 0.1); } lg.computeVertexNormals();
    const lf = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ map: BANANA_TEX, alphaTest: 0.5, color: new THREE.Color().setHSL(0.26 + r() * 0.02, 0.55, 0.62 + r() * 0.1), roughness: 0.5, side: THREE.DoubleSide })); lf.position.y = 2.3; lf.rotation.order = 'YXZ'; lf.rotation.set(-0.7 - r() * 0.7, i / 9 * 6.28 + r() * 0.4, 0); lf.castShadow = true; g.add(lf); }
  return g;
}
function grassTufts(parent, count, seed, area) { // area: [x0,x1,z0,z1] or fn
  const bladeG = new THREE.BufferGeometry(); bladeG.setAttribute('position', new THREE.Float32BufferAttribute([-0.012, 0, 0, 0.012, 0, 0, -0.008, 0.2, 0, 0.008, 0.2, 0, 0, 0.4, 0], 3)); bladeG.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); bladeG.computeVertexNormals();
  const bm = new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }); bm.onBeforeCompile = sh => { sh.uniforms.uT = { value: 0 }; bm.userData.sh = sh; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position; float hh = position.y/0.4; vec4 ip = instanceMatrix[3]; float ph = ip.x*0.7+ip.z*0.9; transformed.x += sin(uT*1.6+ph)*0.07*hh*hh; transformed.z += cos(uT*1.3+ph*1.3)*0.04*hh*hh;`); };
  const im = new THREE.InstancedMesh(bladeG, bm, count); const r = rng(seed), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < count; i++) { const p = area(r); const sc = 0.6 + r() * 1.4; e.set((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.3); q.setFromEuler(e); m4.compose(new THREE.Vector3(p[0], 0, p[1]), q, new THREE.Vector3(sc, sc * (0.7 + r() * 0.8), sc)); im.setMatrixAt(i, m4); c.setHSL(0.20 + r() * 0.07, 0.45 + r() * 0.3, 0.2 + r() * 0.2); if (r() < 0.06) c.setHSL(0.13, 0.5, 0.45); im.setColorAt(i, c); }
  im.frustumCulled = false; parent.add(im); return bm;
}
function buildYard(scene) {
  const root = new THREE.Group(); scene.add(root); const Y = { root };
  // ---- ground: grass + swept earth yard ----
  const grassTex = texCanvas(1024, (x, s) => { x.fillStyle = '#5a7a2c'; x.fillRect(0, 0, s, s); speckle(x, s, 10000, ['#6f8f34', '#4e6b25', '#7d9a3c', '#8a8a3a', '#3f5a20'], 1, 3, 3); speckle(x, s, 400, ['#a89a52', '#6e5a30'], 2, 6, 4); }, [70, 50]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 400), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, bumpMap: grassTex, bumpScale: 1.2 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const earthTex = texCanvas(1024, (x, s) => { x.fillStyle = '#a88a64'; x.fillRect(0, 0, s, s); speckle(x, s, 16000, ['#b89870', '#94784f', '#a98a64', '#7c6446', '#c0a47c'], 1, 2.4, 5); for (let i = 0; i < 26; i++) { const rr = rng(i + 70); const gx = rr() * s, gy = rr() * s, gr = 40 + rr() * 90; const gg = x.createRadialGradient(gx, gy, 0, gx, gy, gr); gg.addColorStop(0, 'rgba(96,120,52,.34)'); gg.addColorStop(1, 'rgba(96,120,52,0)'); x.fillStyle = gg; x.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); } speckle(x, s, 300, ['#6a6a62', '#8a8a82'], 1.5, 4, 6);
    x.strokeStyle = 'rgba(120,90,56,.3)'; x.lineWidth = 1.5; const rr = rng(9); for (let i = 0; i < 160; i++) { const cx = rr() * s, cy = rr() * s, rad = 60 + rr() * 200; x.beginPath(); x.arc(cx, cy, rad, rr() * 6, rr() * 6 + 1.2); x.stroke(); }   // broom sweeps
    const g = x.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.5); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s); }, [1, 1]);
  const yardMat = new THREE.MeshStandardMaterial({ map: earthTex, roughness: 1, bumpMap: earthTex, bumpScale: 1.5, transparent: true, alphaMap: texCanvas(256, (x, s) => { const g = x.createRadialGradient(s / 2, s / 2, s * 0.28, s / 2, s / 2, s * 0.5); g.addColorStop(0, '#fff'); g.addColorStop(0.75, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, s, s); }, [1, 1]), depthWrite: false });
  yardMat.alphaMap.colorSpace = THREE.NoColorSpace; const yard = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), yardMat); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0.012, -1.5); yard.receiveShadow = true; root.add(yard);
  // stepping stones to the house
  for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.05, 14), new THREE.MeshStandardMaterial({ color: 0x8e8a80, roughness: 1 })); st.position.set(-5.6 + i * 0.3, 0.03, -2.0 + i * 0.1); st.rotation.y = i; st.receiveShadow = true; root.add(st); }
  // ---- stilt house ----
  const house = new THREE.Group(); house.position.set(-7.6, 0, -6.2); root.add(house); Y.house = house;
  const plank = new THREE.MeshStandardMaterial({ map: woodTexture('#a8855c', [2, 1], 12, 8), roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ map: woodTexture('#7a5a38', [1, 3], 14), roughness: 0.95 });
  for (const [px, pz] of [[-3.3, -2.2], [0, -2.2], [3.3, -2.2], [-3.3, 2.2], [0, 2.2], [3.3, 2.2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), dark); p.position.set(px, 0.75, pz); p.castShadow = true; house.add(p); }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 5.0), plank); deck.position.set(0, 1.5, 0); deck.castShadow = deck.receiveShadow = true; house.add(deck);
  const wallM = new THREE.MeshStandardMaterial({ map: woodTexture('#b89468', [3, 2], 15, 14), roughness: 0.92 });
  const wall = (w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), wallM); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; house.add(m); return m; };
  wall(7.2, 2.5, 0, 2.83, -2.4); wall(4.8, 2.5, -3.5, 2.83, 0, Math.PI / 2); wall(4.8, 2.5, 3.5, 2.83, 0, Math.PI / 2);
  wall(2.6, 2.5, -2.3, 2.83, 2.4); wall(2.6, 2.5, 2.3, 2.83, 2.4); wall(2.0, 0.5, 0, 4.1, 2.4);
  const trim = new THREE.MeshStandardMaterial({ map: woodTexture('#d8c9a8', [1, 1], 33), roughness: 0.85 });
  const bx = (w, h, d, x, yy, z, m, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, yy, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; house.add(o); return o; };
  const inside = new THREE.MeshStandardMaterial({ color: 0x120a05, roughness: 1 });
  bx(1.9, 2.3, 0.1, 0, 2.72, 2.2, inside);                                   // dark room behind the doorway
  for (const sx of [-1, 1]) bx(0.12, 2.35, 0.2, sx * 1.02, 2.76, 2.42, trim); bx(2.2, 0.14, 0.2, 0, 3.92, 2.42, trim);   // door frame
  const door = new THREE.Group(); door.position.set(-0.95, 0, 2.5); door.rotation.y = -1.25; house.add(door); { const d = bx(0.9, 2.2, 0.05, 0.45, 2.65, 0, dark); d.parent.remove(d); door.add(d); }
  for (const wx of [-2.3, 2.3]) {                                            // two windows with frames, sills and open shutters
    bx(0.95, 1.15, 0.06, wx, 3.0, 2.46, inside); for (const sx of [-1, 1]) bx(0.07, 1.25, 0.1, wx + sx * 0.5, 3.0, 2.5, trim); for (const sy of [-1, 1]) bx(1.07, 0.07, 0.1, wx, 3.0 + sy * 0.6, 2.5, trim); bx(1.2, 0.07, 0.2, wx, 2.35, 2.55, trim); bx(0.05, 1.12, 0.03, wx, 3.0, 2.5, trim);
    for (const sx of [-1, 1]) bx(0.5, 1.2, 0.04, wx + sx * 0.78, 3.0, 2.48, dark);
  }
  for (const wx of [-1.2, 1.5]) bx(0.08, 2.4, 0.06, wx, 2.83, -2.33, trim);
  for (let i = 0; i < 5; i++) bx(1.7, 0.13, 0.44, 0, 1.4 - i * 0.32, 2.72 + i * 0.4, plank);   // porch steps
  const roofM = new THREE.MeshStandardMaterial({ map: texCanvas(512, (x, s) => { x.fillStyle = '#8a4a34'; x.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 26) { x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(i, 0, 4, s); x.fillStyle = 'rgba(255,200,160,.14)'; x.fillRect(i + 5, 0, 3, s); } speckle(x, s, 2000, ['#6a3a2a', '#a06a4a', '#5a4a40'], 1, 4, 13); }, [3, 2]), roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide });
  for (const s of [1, -1]) { const rf = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.09, 3.35), roofM); rf.position.set(0, 4.78, s * 1.5); rf.rotation.x = s * 0.43; rf.castShadow = true; rf.receiveShadow = true; house.add(rf); }
  const gable = new THREE.Mesh(new THREE.BufferGeometry(), wallM); { const v = new Float32Array([-3.6, 4.08, 2.4, 3.6, 4.08, 2.4, 0, 5.4, 2.4, -3.6, 4.08, -2.4, 3.6, 4.08, -2.4, 0, 5.4, -2.4]); gable.geometry.setAttribute('position', new THREE.BufferAttribute(v, 3)); gable.geometry.setIndex([0, 1, 2, 5, 4, 3]); gable.geometry.computeVertexNormals(); gable.material = wallM.clone(); gable.material.side = THREE.DoubleSide; house.add(gable); }
  // under-house storage: firewood, jars, basket
  for (let i = 0; i < 18; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 })); lg.rotation.z = Math.PI / 2; lg.position.set(-2.6, 0.1 + Math.floor(i / 6) * 0.14, -1.4 + (i % 6) * 0.15 + (Math.floor(i / 6) % 2) * 0.07); lg.castShadow = true; house.add(lg); }
  for (const jx of [0.6, 1.3]) { const j = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0], [0.22, 0.02], [0.3, 0.3], [0.2, 0.55], [0.12, 0.62], [0.14, 0.7]].map(p => new THREE.Vector2(p[0], p[1])), 24), new THREE.MeshStandardMaterial({ color: 0x8a4a2a, roughness: 0.6 })); j.position.set(jx, 0.0, -0.8); j.castShadow = true; house.add(j); }
  // ---- durian tree (the gag tree) ----
  const tree = new THREE.Group(); tree.position.set(3.4, 0, -1.8); root.add(tree); Y.tree = tree;
  const bark = woodTexture('#5c4630', [1, 5], 31);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 6.2, 16), new THREE.MeshStandardMaterial({ map: bark, bumpMap: bark, bumpScale: 3, roughness: 1 })); tr.position.y = 3.1; tr.castShadow = true; tree.add(tr);
  for (const [bx, bz, by, len] of [[1.6, 0.4, 5.0, 3.4], [-1.7, -0.3, 5.4, 3.6], [0.4, 1.6, 4.8, 3.0], [-0.3, -1.6, 5.6, 3.2]]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, len, 10), new THREE.MeshStandardMaterial({ map: bark, roughness: 1 })); br.position.set(bx * 0.5, by + 0.4, bz * 0.5); br.rotation.set(bz * 0.35, 0, -bx * 0.35); br.castShadow = true; tree.add(br); }
  Y.canopy = leafMesh(1400, 77, 3.9, 1.0, ['#2c5a22', '#356a28', '#244c1c', '#3c7430'], tree, new THREE.Vector3(0, 7.0, 0), 0.5); Y.canopy.material.color.set(0xffffff);
  Y.canopy2 = leafMesh(700, 78, 4.4, 1.1, ['#2c5a22', '#3a7030'], tree, new THREE.Vector3(0.6, 5.6, 0.4), 0.2);
  // ---- coop (reban) ----
  const coop = new THREE.Group(); coop.position.set(7.6, 0, -1.0); root.add(coop); Y.coop = coop;
  for (const [px, pz] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), dark); p.position.set(px, 0.27, pz); p.castShadow = true; coop.add(p); }
  const cf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.5), plank); cf.position.y = 0.55; cf.castShadow = cf.receiveShadow = true; coop.add(cf);
  const cw = (w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), wallM); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; coop.add(m); };
  cw(1.9, 1.1, 0, 1.15, -0.7); cw(1.5, 1.1, -0.95, 1.15, 0, Math.PI / 2); cw(1.5, 1.1, 0.95, 1.15, 0, Math.PI / 2); cw(0.6, 1.1, -0.65, 1.15, 0.72); cw(0.6, 1.1, 0.65, 1.15, 0.72); cw(0.7, 0.35, 0, 1.52, 0.72);
  const cr = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.07, 1.9), roofM); cr.position.set(0, 1.85, 0); cr.rotation.x = 0.0; cr.castShadow = true; coop.add(cr); cr.rotation.z = 0.14;
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 1.4), plank); ramp.position.set(0, 0.28, 1.35); ramp.rotation.x = -0.4; ramp.castShadow = true; coop.add(ramp);
  const hay = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc9a54a, roughness: 1 })); hay.scale.set(1.3, 0.35, 1); hay.position.set(-0.4, 0.65, -0.3); coop.add(hay);
  // ---- bamboo fence ----
  const bamM = new THREE.MeshStandardMaterial({ map: texCanvas(128, (x, s) => { x.fillStyle = '#b8a45a'; x.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 22) { x.fillStyle = 'rgba(60,50,20,.55)'; x.fillRect(0, i, s, 3); } speckle(x, s, 400, ['#9a8844', '#cdb86a'], 0.5, 1.5, 17); }, [1, 4]), roughness: 0.55 });
  const nPol = 70, bam = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.04, 1.4, 8), bamM, nPol * 2); const m4 = new THREE.Matrix4(), rf = rng(5); let bi = 0;
  for (const z of [-9.5]) for (let i = 0; i < nPol; i++) { const x = -15 + i * 0.42; m4.makeTranslation(x, 0.68 + rf() * 0.08, z + (rf() - 0.5) * 0.06); bam.setMatrixAt(bi++, m4); }
  for (const x of [-12.2, 12.2]) for (let i = 0; i < 34; i++) { m4.makeTranslation(x + (rf() - 0.5) * 0.06, 0.68 + rf() * 0.08, -9.5 + i * 0.42 + 0.4); bam.setMatrixAt(bi++, m4); }
  bam.count = bi; bam.castShadow = true; root.add(bam);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 28, 8), bamM); rail.rotation.z = Math.PI / 2; rail.position.set(0, 1.05, -9.45); rail.castShadow = true; root.add(rail);
  const rail2 = rail.clone(); rail2.position.y = 0.45; root.add(rail2);
  // ---- palms, bananas, bushes, laundry ----
  palmTree(root, -13, -11.5, 10.5, 3, 0.12); palmTree(root, 11.5, -10.8, 9.5, 4, -0.1); palmTree(root, -2.5, -13, 11.5, 6, 0.08); palmTree(root, 15.5, -5.5, 10, 7, -0.14);
  bananaPlant(root, -3.2, -8.2, 21); bananaPlant(root, -11.0, -3.2, 22); bananaPlant(root, 10.4, -7.6, 23);
  for (const [bx, bz] of [[-4.6, -3.7], [-10.6, -1.0], [6.2, -4.0], [-0.8, -6.5]]) { const b = new THREE.Group(); b.position.set(bx, 0, bz); root.add(b); const r = rng(Math.floor(bx * 10));
    leafMesh(260, Math.floor(bx * 7) + 3, 0.9, 0.5, ['#2f6a24', '#3a7a2c', '#4a8a34', '#285c20'], b, new THREE.Vector3(0, 0.7, 0), 0.4);
    for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd0202a, roughness: 0.45, emissive: 0x2a0004 })); f.scale.set(1, 1, 0.5); f.position.set((r() - 0.5) * 1.5, 0.7 + r() * 0.7, 0.55 + r() * 0.3); f.lookAt(f.position.x * 3, f.position.y, 6); b.add(f); } }
  // clothes line with sarongs
  const poleA = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 8), dark); poleA.position.set(-3.0, 1.3, -4.6); poleA.castShadow = true; root.add(poleA); const poleB = poleA.clone(); poleB.position.set(1.0, 1.3, -4.9); root.add(poleB);
  const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-3.0, 2.5, -4.6), new THREE.Vector3(-1, 2.3, -4.75), new THREE.Vector3(1.0, 2.5, -4.9)]), 16, 0.008, 4), new THREE.MeshStandardMaterial({ color: 0xe8e4dc })); root.add(line);
  Y.laundry = []; { const clothTex = (kind, base, c2) => texCanvas(128, (x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); x.fillStyle = c2; if (kind === 0) for (let i = 0; i < s; i += 16) x.fillRect(0, i, s, 5); else if (kind === 1) { for (let i = 0; i < s; i += 20) { x.fillRect(i, 0, 4, s); x.fillRect(0, i, s, 4); } } else { for (let i = 0; i < s; i += 24) for (let j = 0; j < s; j += 24) { x.beginPath(); x.arc(i + 12, j + 12, 5, 0, 6.28); x.fill(); } } for (let i = 0; i < 900; i++) { x.fillStyle = 'rgba(0,0,0,.05)'; x.fillRect(Math.random() * s, Math.random() * s, 1, 2); } }, [1, 1]);
    for (const [lx, kind, base, c2, w] of [[-2.5, 1, '#3c5a7a', '#c8d4e0', 0.85], [-1.4, 0, '#c9b27a', '#8a6a34', 0.7], [-0.4, 1, '#7a2c2c', '#d8b070', 0.9], [0.55, 2, '#44705a', '#e0d8b0', 0.75]]) {
      const g = new THREE.PlaneGeometry(w, 1.05, 14, 10); g.translate(0, -0.525, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i); p.setZ(i, Math.sin(x * 9 + yy * 3) * 0.035 * (-yy)); p.setY(i, yy + Math.sin(x * 14) * 0.012); } g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: clothTex(kind, base, c2), roughness: 0.95, side: THREE.DoubleSide })); m.position.set(lx, 2.42 - Math.abs(lx + 1) * 0.04, -4.72 + (lx + 1) * -0.05); m.castShadow = true; root.add(m); Y.laundry.push(m);
      for (const sx of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.02), new THREE.MeshStandardMaterial({ color: 0xc8a050 })); pg.position.set(lx + sx * (w / 2 - 0.08), 2.46 - Math.abs(lx + 1) * 0.04, -4.72 + (lx + 1) * -0.05); root.add(pg); } } }
  // bucket + feed sack
  const bk = new THREE.Group(); const bkb = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.28, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f6fc0, roughness: 0.4, side: THREE.DoubleSide })); bkb.position.y = 0.14; bkb.castShadow = true; bk.add(bkb);
  const bkbase = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), new THREE.MeshStandardMaterial({ color: 0x2a5fa8, roughness: 0.45 })); bkbase.rotation.x = -Math.PI / 2; bkbase.position.y = 0.01; bk.add(bkbase);
  for (const yy of [0.04, 0.26]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(yy > 0.2 ? 0.17 : 0.13, 0.008, 8, 28), new THREE.MeshStandardMaterial({ color: 0x2a5fa8, roughness: 0.4 })); rim.rotation.x = Math.PI / 2; rim.position.y = yy; bk.add(rim); }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.8, roughness: 0.3 })); handle.position.y = 0.26; bk.add(handle); Y.bucket = bk; root.add(bk);
  // paddy field + hills + distant houses
  const paddy = new THREE.Mesh(new THREE.PlaneGeometry(260, 80), new THREE.MeshStandardMaterial({ map: texCanvas(512, (x, s) => { x.fillStyle = '#7e9a38'; x.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 6) { x.fillStyle = i % 12 ? 'rgba(120,150,50,.5)' : 'rgba(70,100,30,.5)'; x.fillRect(0, i, s, 3); } speckle(x, s, 4000, ['#a2b84a', '#5c7a28', '#c8c060'], 1, 3, 19); }, [30, 12]), roughness: 1 })); paddy.rotation.x = -Math.PI / 2; paddy.position.set(0, 0.015, -52); paddy.receiveShadow = true; root.add(paddy);
  for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(46 + i * 4, 28, 12, 0, 6.283, 0, 1.15), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.30 - i * 0.008, 0.28, 0.22 + i * 0.012), roughness: 1 })); h.scale.y = 0.42; h.position.set(-110 + i * 30, -1, -120 - (i % 3) * 22); root.add(h); }
  for (const [hx, hz] of [[-30, -34], [26, -40], [40, -30]]) { const hs = new THREE.Group(); hs.position.set(hx, 0, hz); const b = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), new THREE.MeshStandardMaterial({ color: 0x9a7a5a, roughness: 1 })); b.position.y = 2.5; hs.add(b); const rr2 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0x7a4a34, roughness: 0.7 })); rr2.rotation.y = Math.PI / 4; rr2.position.y = 5.1; hs.add(rr2); root.add(hs); }
  for (let i = 0; i < 40; i++) { const r = rng(i * 7); const tre = new THREE.Group(); tre.position.set(-70 + r() * 140, 0, -30 - r() * 40); const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4 + r() * 3, 8), new THREE.MeshStandardMaterial({ color: 0x4a3622 })); tk.position.y = 2.5; tre.add(tk); const cn = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 + r() * 1.6, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.27, 0.45, 0.22 + r() * 0.08), roughness: 1 })); cn.position.y = 6.2; tre.add(cn); root.add(tre); }
  // fallen leaves on the yard
  const lv = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshStandardMaterial({ color: 0x8a7a3a, roughness: 1, side: THREE.DoubleSide }), 160); const q = new THREE.Quaternion(), e = new THREE.Euler(); const rl = rng(61);
  for (let i = 0; i < 160; i++) { e.set(-Math.PI / 2 + (rl() - 0.5) * 0.3, rl() * 6.28, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3((rl() - 0.5) * 18, 0.02, -8 + rl() * 12), q, new THREE.Vector3(1, 1, 1)); lv.setMatrixAt(i, m4); }
  root.add(lv);
  Y.grassMat = [
    grassTufts(root, 9000, 91, r => { const side = r() < 0.5 ? -1 : 1; return [side * (12.6 + r() * 14), -12 + r() * 16]; }),
    grassTufts(root, 5000, 92, r => [-14 + r() * 28, -10.6 + r() * 1.4]),
    grassTufts(root, 2400, 93, r => { const a = r() * 6.28, d = 8.2 + r() * 2.6; return [Math.cos(a) * d * 1.5, -1.5 + Math.sin(a) * d * 0.9]; }),
    grassTufts(root, 900, 94, r => [-11.4 + r() * 7.4, -6.9 + r() * 0.8])];
  // neat touches: bench, flower pots, lantern, bicycle
  const bench = new THREE.Group(); bench.position.set(-5.2, 0, -4.9); root.add(bench); { const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.4), plank); seat.position.y = 0.46; seat.castShadow = true; bench.add(seat); for (const sx of [-0.6, 0.6]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 0.35), dark); lg.position.set(sx, 0.23, 0); lg.castShadow = true; bench.add(lg); } }
  for (let i = 0; i < 5; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xa8552e, roughness: 0.8 })); pot.position.set(-9.9 + i * 0.42, 0.11, -3.3); pot.castShadow = true; root.add(pot); leafMesh(14, 200 + i, 0.18, 0.28, ['#3a7a2c', '#4a8a34'], root, new THREE.Vector3(-9.9 + i * 0.42, 0.34, -3.3), 0.5); }
  const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffb050, emissiveIntensity: 1.6, roughness: 0.4 })); lant.position.set(-5.4, 3.3, -3.9); root.add(lant);
  const bic = new THREE.Group(); bic.position.set(9.6, 0, -8.6); bic.rotation.y = 0.5; root.add(bic); for (const wx of [-0.55, 0.55]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.016, 8, 36), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })); wh.position.set(wx, 0.35, 0); wh.castShadow = true; bic.add(wh); }
  { const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0x2f5fa0, metalness: 0.6, roughness: 0.4 })); fr.rotation.z = Math.PI / 2; fr.position.set(0, 0.62, 0); bic.add(fr); }
  // soft light shafts through the canopy
  const rayTex = texCanvas(128, (x, s) => { const g = x.createLinearGradient(0, 0, 0, s); g.addColorStop(0, 'rgba(255,236,190,0)'); g.addColorStop(0.15, 'rgba(255,236,190,.9)'); g.addColorStop(1, 'rgba(255,236,190,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s); const h = x.createLinearGradient(0, 0, s, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, s, s); }, [1, 1]);
  Y.rays = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + (i % 3) * 0.7, 11), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(-1.5 + i * 1.5, 4.5, -2.5 + (i % 2) * 2.4); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunDir.clone().negate()); m.rotateY(0.6 * (i % 3)); root.add(m); Y.rays.push(m); }
  // foreground foliage cards used for framing (moved in front of the lens per shot)
  Y.fg = new THREE.Group(); scene.add(Y.fg); leafMesh(40, 301, 0.5, 0.6, ['#2f6a24', '#3f8030', '#285c20'], Y.fg, new THREE.Vector3(0, 0, 0), 0.2); Y.fg.visible = false;
  return Y;
}
