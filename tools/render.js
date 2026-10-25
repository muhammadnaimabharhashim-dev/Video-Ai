// Render animation/index.html frame-by-frame to PNGs (+ events.json for audio sync).
// Usage: node tools/render.js <outDir> [fps] [onlyTimes comma list|-] [html file, default animation/index.html]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2], fps = +(process.argv[3] || 30);
  const only = process.argv[4] && process.argv[4] !== '-' ? process.argv[4].split(',').map(Number) : null;
  const html = process.argv[5] || 'animation/index.html';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { window.__RENDER_ONLY = true; });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto('file://' + path.resolve(__dirname, '..', html));
  const dur = await page.evaluate(() => window.DURATION);
  fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify(await page.evaluate(() => window.EVENTS)));
  const el = await page.$('#c');
  if (only) {
    for (const t of only) { await page.evaluate(t => render(t), t); await el.screenshot({ path: path.join(out, `t${t}.png`) }); }
  } else {
    const n = Math.round(dur * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => render(t), i / fps);
      await el.screenshot({ path: path.join(out, `f${String(i).padStart(5, '0')}.png`) });
    }
  }
  await browser.close();
})();
