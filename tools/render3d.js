// Render a cinematic/*.html page frame-by-frame with Playwright (software WebGL).
// Usage: node tools/render3d.js <outDir> <fps> <times|-> [html] [startFrame] [endFrame]
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2], fps = +(process.argv[3] || 30), only = process.argv[4] && process.argv[4] !== '-' ? process.argv[4].split(',').map(Number) : null;
  const html = process.argv[5] || 'cinematic/index.html'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  if (process.env.SUB) await page.addInitScript(n => { window.SUB = n; }, +process.env.SUB);
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.type(), m.text().slice(0, 300)); });
  await page.goto('file://' + path.resolve(__dirname, '..', html));
  await page.waitForFunction(() => window.render, null, { timeout: 60000 });
  const dur = await page.evaluate(() => window.DURATION); fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify(await page.evaluate(() => window.EVENTS || {}))); const el = await page.$('#out');
  const shot = async (t, file) => { if (process.env.SIM) t = await page.evaluate(t => realOf(t), t); await page.evaluate(t => render(t), t); await el.screenshot({ path: file }); };
  if (only) for (const t of only) { const t0 = Date.now(); await shot(t, path.join(out, `t${t}.png`)); console.log('t', t, ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  else { const n = Math.round(dur * fps), a = +(process.argv[6] || 0), b = Math.min(n, +(process.argv[7] || n)); for (let i = a; i < b; i++) { await shot(i / fps, path.join(out, `f${String(i).padStart(5, '0')}.png`)); if (i % 30 === 0) console.log('frame', i, '/', n); } }
  await browser.close();
})();
