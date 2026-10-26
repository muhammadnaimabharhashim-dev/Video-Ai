// Procedural rural lane: ground, grass, trees, fence, hay bale, puddle, porch, props, particles.
function texCanvas(size, paint, repeat) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const x = cv.getContext('2d'); paint(x, size);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) t.repeat.set(repeat[0], repeat[1]); return t;
}
function speckle(x, s, n, cols, rmin, rmax, seed) { const r = rng(seed); for (let i = 0; i < n; i++) { x.fillStyle = cols[(r() * cols.length) | 0]; const rad = rmin + r() * (rmax - rmin), px = r() * s, py = r() * s; for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) { x.beginPath(); x.arc(px + ox, py + oy, rad, 0, 6.283); x.fill(); } } }
const WORLD = { items: {}, dust: null };

function buildWorld() {
  const root = new THREE.Group(); scene.add(root);
  // ---- ground ----
  const grassTex = texCanvas(1024, (x, s) => { x.fillStyle = '#5d7a2e'; x.fillRect(0, 0, s, s); speckle(x, s, 9000, ['#6f8f34', '#4e6b25', '#7d9a3c', '#8a8a3a', '#3f5a20'], 1, 3, 3); speckle(x, s, 500, ['#a89a52', '#6e5a30'], 2, 6, 4); }, [60, 40]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, bumpMap: grassTex, bumpScale: 1.2 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const laneTex = texCanvas(1024, (x, s) => {
    x.fillStyle = '#b8925f'; x.fillRect(0, 0, s, s); speckle(x, s, 14000, ['#c9a572', '#a07a4a', '#b8966a', '#8a6a42', '#d6b684'], 1, 3.2, 5); speckle(x, s, 400, ['#6a6a66', '#8a8a84'], 2, 5, 6);
    for (const cy of [s * 0.30, s * 0.70]) { const g = x.createLinearGradient(0, cy - 40, 0, cy + 40); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(0.5, 'rgba(60,40,20,.55)'); g.addColorStop(1, 'rgba(60,40,20,0)'); x.fillStyle = g; x.fillRect(0, cy - 40, s, 80); }   // wheel ruts
    const g2 = x.createLinearGradient(0, 0, 0, s); g2.addColorStop(0, 'rgba(70,95,40,.85)'); g2.addColorStop(0.16, 'rgba(70,95,40,0)'); g2.addColorStop(0.84, 'rgba(70,95,40,0)'); g2.addColorStop(1, 'rgba(70,95,40,.85)'); x.fillStyle = g2; x.fillRect(0, 0, s, s);
  }, [90, 1]);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(400, 5.4), new THREE.MeshStandardMaterial({ map: laneTex, roughness: 1, bumpMap: laneTex, bumpScale: 2 })); lane.rotation.x = -Math.PI / 2; lane.position.set(150, 0.012, 0); lane.receiveShadow = true; root.add(lane);

  // ---- grass blades (instanced, swaying) ----
  const bladeG = new THREE.BufferGeometry(); bladeG.setAttribute('position', new THREE.Float32BufferAttribute([-0.012, 0, 0, 0.012, 0, 0, -0.008, 0.18, 0, 0.008, 0.18, 0, 0, 0.36, 0], 3)); bladeG.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); bladeG.computeVertexNormals();
  const NB = 42000, bm = new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide, vertexColors: false });
  bm.onBeforeCompile = sh => { sh.uniforms.uT = { value: 0 }; bm.userData.sh = sh;
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position; float hh = position.y/0.36; vec4 ip = instanceMatrix[3]; float ph = ip.x*0.7+ip.z*0.9; transformed.x += sin(uT*1.6+ph)*0.07*hh*hh; transformed.z += cos(uT*1.3+ph*1.3)*0.04*hh*hh;`); };
  const blades = new THREE.InstancedMesh(bladeG, bm, NB); blades.frustumCulled = false; const r = rng(77), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < NB; i++) {
    const side = r() < 0.5 ? 1 : -1, zz = side * (3.9 + Math.pow(r(), 1.6) * 24), xx = -8 + r() * 150;
    const sc = 0.6 + r() * 1.5; e.set((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.3); q.setFromEuler(e); m4.compose(new THREE.Vector3(xx, 0, zz), q, new THREE.Vector3(sc, sc * (0.7 + r() * 0.8), sc)); blades.setMatrixAt(i, m4);
    c.setHSL(0.20 + r() * 0.07, 0.45 + r() * 0.3, 0.20 + r() * 0.20); if (r() < 0.08) c.setHSL(0.13, 0.5, 0.45); blades.setColorAt(i, c);
  }
  root.add(blades); WORLD.blades = bm;
  // ---- trees ----
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x4a3622, roughness: 1 });
  const rt2 = rng(5);
  const leafTex = texCanvas(256, (x, s) => { x.fillStyle = '#3a6a2a'; x.fillRect(0, 0, s, s); speckle(x, s, 1400, ['#4f8a34', '#2c5a20', '#6aa040', '#3a7a2c'], 3, 9, 8); }, [3, 3]);
  for (let i = 0; i < 46; i++) {
    const side = i % 2 ? 1 : -1, x = -10 + (i / 46) * 150 + (rt2() - 0.5) * 6, z = side * (9 + rt2() * 22), h = 6 + rt2() * 5, g = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, h, 10), trunkM); tr.position.y = h / 2; tr.castShadow = true; g.add(tr);
    for (let k = 0; k < 6; k++) { const geo = new THREE.IcosahedronGeometry(2.0 + rt2() * 1.6, 2); const pos = geo.attributes.position, nn = rng(k + i * 7); for (let v = 0; v < pos.count; v++) { const f = 1 + (nn() - 0.5) * 0.35; pos.setXYZ(v, pos.getX(v) * f, pos.getY(v) * f * 0.85, pos.getZ(v) * f); } geo.computeVertexNormals();
      const lm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: leafTex, color: new THREE.Color().setHSL(0.25 + rt2() * 0.06, 0.5, 0.45 + rt2() * 0.15), roughness: 0.9 })); lm.position.set((rt2() - 0.5) * 3.2, h + (rt2() - 0.2) * 2.4, (rt2() - 0.5) * 3.2); lm.castShadow = true; g.add(lm); }
    g.position.set(x, 0, z); root.add(g);
  }
  // distant hills
  for (let i = 0; i < 7; i++) { const hill = new THREE.Mesh(new THREE.SphereGeometry(40 + i * 5, 24, 12, 0, 6.283, 0, 1.2), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.27, 0.35, 0.27 + i * 0.01), roughness: 1 })); hill.scale.y = 0.38; hill.position.set(-20 + i * 28, -1, -110 - (i % 3) * 20); root.add(hill); }
  // ---- wood textures ----
  const woodTex = (base, rep) => texCanvas(512, (x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); const rr = rng(11); for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(${rr() > 0.5 ? '40,25,10' : '200,170,120'},${0.08 + rr() * 0.14})`; x.lineWidth = 1 + rr() * 3; x.beginPath(); const y = rr() * s; x.moveTo(0, y); x.bezierCurveTo(s * 0.3, y + (rr() - 0.5) * 14, s * 0.7, y + (rr() - 0.5) * 14, s, y + (rr() - 0.5) * 8); x.stroke(); } }, rep);
  const fenceM = new THREE.MeshStandardMaterial({ map: woodTex('#8a6a45', [1, 1]), roughness: 0.95 });
  // fence along both sides of lane
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.25, 0.12), fenceM, 130), railG = new THREE.BoxGeometry(2.5, 0.09, 0.05);
  const rails = new THREE.InstancedMesh(railG, fenceM, 130 * 2);
  let pi = 0, ri = 0;
  for (const z of [3.5, -3.5]) for (let i = 0; i < 65; i++) { const x = -6 + i * 2.5; m4.compose(new THREE.Vector3(x, 0.62, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (i % 3) * 0.03, (i % 5 - 2) * 0.012)), new THREE.Vector3(1, 1, 1)); posts.setMatrixAt(pi++, m4);
    for (const y of [0.45, 0.95]) { m4.compose(new THREE.Vector3(x + 1.25, y + (i % 4) * 0.01, z + 0.07 * (z > 0 ? -1 : 1)), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); rails.setMatrixAt(ri++, m4); } }
  posts.castShadow = rails.castShadow = true; root.add(posts, rails);
  // end gate (closed) across the lane
  const gate = new THREE.Group(); gate.position.set(112, 0, 0);
  for (const z of [-2.6, 2.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 0.22), fenceM); p.position.set(0, 0.8, z); p.castShadow = true; gate.add(p); }
  for (const y of [0.3, 0.7, 1.1, 1.45]) { const rr2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 5.2), fenceM); rr2.position.set(0, y, 0); rr2.castShadow = true; gate.add(rr2); }
  const diag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 6.0), fenceM); diag.rotation.x = 0.7; diag.position.set(0.02, 0.9, 0); gate.add(diag); root.add(gate);
  // ---- hay bale ----
  const strawTex = texCanvas(512, (x, s) => { x.fillStyle = '#c9a54a'; x.fillRect(0, 0, s, s); const rr = rng(21); for (let i = 0; i < 1200; i++) { x.strokeStyle = ['#e0c060', '#a8862e', '#d8b850', '#8a6a22'][(rr() * 4) | 0]; x.lineWidth = 1 + rr() * 1.6; x.beginPath(); const px = rr() * s, py = rr() * s; x.moveTo(px, py); x.lineTo(px + (rr() - 0.5) * 60, py + (rr() - 0.5) * 8); x.stroke(); } }, [2, 1]);
  const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 36), new THREE.MeshStandardMaterial({ map: strawTex, roughness: 1, bumpMap: strawTex, bumpScale: 3 })); bale.rotation.x = Math.PI / 2; const baleG = new THREE.Group(); baleG.add(bale); bale.castShadow = bale.receiveShadow = true; baleG.position.set(58, 0.62, 0); root.add(baleG); WORLD.bale = baleG;
  // ---- puddle ----
  const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ color: 0x2c2216, roughness: 0.08, metalness: 0.0, clearcoat: 1, envMapIntensity: 0.7 })); pud.rotation.x = -Math.PI / 2; pud.scale.set(3.6, 1.7, 1); pud.position.set(88, 0.02, 0.2); pud.receiveShadow = true; root.add(pud); WORLD.puddle = pud;
  // ---- porch ----
  const porchWood = new THREE.MeshStandardMaterial({ map: woodTex('#9a7a52', [3, 1]), roughness: 0.9 });
  const porch = new THREE.Group(); porch.position.set(-1, 0, 0); root.add(porch);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 3.4), porchWood); floor.position.set(0, 0.2, -0.8); floor.receiveShadow = floor.castShadow = true; porch.add(floor);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 3.4), new THREE.MeshStandardMaterial({ color: 0x3a2a18 })); l.position.set(-3.0 + i, 0.402, -0.8); porch.add(l); }
  const wall = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 0.18), new THREE.MeshStandardMaterial({ map: woodTex('#b48e5c', [3, 1]), roughness: 0.95 })); wall.position.set(0, 2.0, -2.5); wall.receiveShadow = true; porch.add(wall);
  for (const x of [-3.3]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), porchWood); p.position.set(x, 2.0, 0.8); p.castShadow = true; porch.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 4.2), new THREE.MeshStandardMaterial({ color: 0x7a3a2a, roughness: 0.8 })); roof.position.set(0, 3.7, -0.7); roof.castShadow = true; porch.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.7 })); door.position.set(1.6, 1.45, -2.38); porch.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.06), new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffc870, emissiveIntensity: 0.6, roughness: 0.3 })); win.position.set(-1.8, 1.9, -2.4); porch.add(win);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 1.0), new THREE.MeshStandardMaterial({ map: texCanvas(256, (x, s) => { x.fillStyle = '#a03a30'; x.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 16) { x.fillStyle = i % 32 ? '#e8d0a0' : '#3a5a8a'; x.fillRect(i, 0, 8, s); } }), roughness: 1 })); mat.position.set(0.3, 0.41, -0.5); mat.receiveShadow = true; porch.add(mat);
  // bowl + fish
  const bowlPts = [[0.001, 0], [0.09, 0], [0.12, 0.012], [0.17, 0.05], [0.19, 0.075], [0.185, 0.078], [0.165, 0.06], [0.11, 0.025], [0.001, 0.02]].map(p => new THREE.Vector2(p[0], p[1]));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 40), new THREE.MeshPhysicalMaterial({ color: 0xeaf0f4, roughness: 0.12, clearcoat: 1, side: THREE.DoubleSide })); bowl.castShadow = true; bowl.position.set(1.6, 0.41, -0.2); porch.add(bowl); WORLD.bowl = bowl;
  const fish = new THREE.Group(); const fb = new THREE.Mesh(ellipsoid(0.115, 0.03, 0.04, 28, 14), new THREE.MeshPhysicalMaterial({ color: 0x9fb4c4, roughness: 0.28, metalness: 0.35, clearcoat: 0.8 })); fb.castShadow = true; fish.add(fb);
  const ft = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 3), new THREE.MeshStandardMaterial({ color: 0x7f97aa, roughness: 0.4, side: THREE.DoubleSide })); ft.rotation.z = Math.PI / 2; ft.scale.z = 0.25; ft.position.x = -0.145; fish.add(ft);
  const fe = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 })); fe.position.set(0.085, 0.01, 0.034); fish.add(fe);
  const bb = new THREE.Mesh(ellipsoid(0.08, 0.012, 0.03, 20, 10), new THREE.MeshStandardMaterial({ color: 0xe6edf0, roughness: 0.5 })); bb.position.set(0.0, -0.022, 0); fish.add(bb);
  fish.position.set(1.6, 0.5, -0.2); fish.rotation.y = 0.5; porch.add(fish); WORLD.fish = fish; WORLD.porch = porch;
  // pot plant + crates for set dressing
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.34, 20), new THREE.MeshStandardMaterial({ color: 0xa8552e, roughness: 0.85 })); pot.position.set(-2.6, 0.57, -1.9); pot.castShadow = true; porch.add(pot);
  for (let i = 0; i < 14; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3, 0.55, 0.28 + (i % 3) * 0.05), roughness: 0.7 })); lf.scale.set(1, 0.18, 0.4); const a = i * 0.9; lf.position.set(-2.6 + Math.cos(a) * 0.2, 0.9 + (i % 4) * 0.07, -1.9 + Math.sin(a) * 0.2); lf.rotation.set(0.5, a, 0.6); porch.add(lf); }
  return root;
}

// ---- particles ----
function softSprite(col) { return texCanvas(64, (x, s) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, col + 'ff'); g.addColorStop(0.5, col + '88'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }); }
function makeParticles(max, color, additive) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 3), 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(max), 1)); geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(max), 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { map: { value: softSprite(color) }, scale: { value: H / 2 } },
    vertexShader: `attribute float aSize, aAlpha; varying float vA; uniform float scale; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = aSize*scale/(-mv.z)*1.9; vA = aAlpha; }`,
    fragmentShader: `uniform sampler2D map; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(c.rgb*1.0, c.a*vA); }` });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); pts.userData.max = max; pts.userData.n = 0; return pts;
}
function setParticles(p, list) { const g = p.geometry, P = g.attributes.position.array, S = g.attributes.aSize.array, A = g.attributes.aAlpha.array, n = Math.min(list.length, p.userData.max);
  for (let i = 0; i < n; i++) { const o = list[i]; P[i * 3] = o.x; P[i * 3 + 1] = o.y; P[i * 3 + 2] = o.z; S[i] = o.s; A[i] = o.a; } for (let i = n; i < p.userData.max; i++) A[i] = 0;
  g.attributes.position.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aAlpha.needsUpdate = true; }
