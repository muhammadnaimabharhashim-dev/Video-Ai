"""Builds docs/ai-video-prompts.md and an HTML page (copy buttons) from one data structure. Usage: make_prompt_pack.py <out.html>"""
import sys, html, json, os

STYLE = "cinematic, photorealistic, shot on a full-frame cinema camera with a 50mm lens, shallow depth of field, golden-hour backlight, natural motion blur, subtle film grain, 24 fps, 16:9"
CAT = "an orange tabby cat with a white chest and white paws, green eyes, short dense fur, slightly chubby, about 4 kg"
DOG = "a medium-sized golden-tan village dog with floppy ears, a dark muzzle and an athletic build, about 18 kg"
SET = "a rustic Southeast Asian kampung lane at golden hour: dirt road, weathered wooden fences, tall grass, palm trees, an old wooden porch"
NEG = "cartoon, 3D render look, text, subtitles, watermark, extra limbs, deformed paws, morphing animals, changing fur colour, cut mid-motion"

SHOTS = [
 dict(n=1, t="Beranda: anjing curi ikan", sec="6 s", cam="Slow dolly-in, low angle, shallow focus on the cat",
  p=f"{SET}. {CAT} sleeps curled on a woven mat on the porch, breathing gently, ear twitching. Beside it a white ceramic bowl holds a fresh silver fish. {DOG} tiptoes in from the right, lowers its head, quietly lifts the fish in its mouth and backs away, glancing at the cat. Slow dolly-in, low camera, dust motes in the sunlight. {STYLE}.",
  snd="Cicadas, soft wind, faint cat purr, tiny wooden creaks of paws on the porch"),
 dict(n=2, t="Mata kucing terbuka", sec="3 s", cam="Extreme close-up, rack focus",
  p=f"Extreme close-up of {CAT}: the eyelid snaps open, green eye with a slit pupil that contracts sharply, fur rim-lit by the setting sun, a blurred dog silhouette running away in the background. Rack focus from the whiskers to the eye. {STYLE}.",
  snd="Low heartbeat, a rising swell, a short angry hiss"),
 dict(n=3, t="Pengejaran: sisi", sec="5 s", cam="Handheld tracking shot at dog height",
  p=f"{SET}. Side tracking shot at ground level: {DOG} sprints along the dirt lane with a silver fish in its mouth, ears flapping, dust kicking up behind each paw; {CAT} bursts after it a few metres behind, fur streaked with speed. Wooden fence posts flicker through the foreground, blurred tall grass in the foreground. {STYLE}.",
  snd="Rapid paw thuds on dirt, heavy panting, a driving drum rhythm"),
 dict(n=4, t="Pengejaran: depan", sec="5 s", cam="Low front-facing angle, camera retreating",
  p=f"Low front-facing camera retreating at running speed: {DOG} runs straight toward the lens looking panicked, the fish swinging from its mouth, {CAT} furious a few metres behind with narrowed eyes and flattened ears. Long dirt lane with fences converging to a wooden gate in the background, dust haze glowing in the backlight. {STYLE}.",
  snd="Pounding paws, wind rush, dog whimper"),
 dict(n=5, t="Jerami meletup", sec="5 s", cam="Static wide, slow motion",
  p=f"Wide static shot, slow motion: {DOG} leaps gracefully over a round hay bale in the middle of the lane. A moment later {CAT} misjudges the jump and smashes straight into the bale, which explodes into golden straw filling the air. {STYLE}, 120 fps slow motion.",
  snd="Deep thump, a crunchy straw explosion, a comic cat yowl"),
 dict(n=6, t="Kucing berjerami", sec="3 s", cam="Tracking shot, medium",
  p=f"Tracking shot: {CAT} emerges from the straw cloud with pieces of straw stuck all over its fur and one piece on its head, still running with grim determination, spitting out straw. {STYLE}.",
  snd="Paw thuds, a comic sneeze, wind"),
 dict(n=7, t="Lopak lumpur", sec="5 s", cam="Ground-level, backlit, slow motion",
  p=f"Ground-level camera facing the setting sun beside a wide muddy puddle: {DOG} jumps over the puddle in a huge leap, {CAT} hits the water and hydroplanes on its belly, spinning in a full circle with a backlit spray of glittering droplets, then shakes off the water. {STYLE}, slow motion.",
  snd="A big splash, a long slide hiss, falling droplets, a cat shake"),
 dict(n=8, t="Pintu pagar: kucing menang", sec="8 s", cam="Slow push-in, then a low two-shot",
  p=f"{DOG} is cornered against a closed wooden farm gate at the end of the lane, ears flat, trembling. {CAT}, wet and fluffed up with its tail high, stalks closer and stares it down. The dog sadly drops the fish on the ground and sits. The cat sniffs the fish, picks it up gently in its mouth and walks away down the lane while the dog lies down with a long sigh. Slow push-in, then a low two-shot. {STYLE}.",
  snd="A tense low drone, a dog whimper, a fish plop, a soft cat growl, then a warm gentle melody"),
]
TIPS = [
 "Mula dengan 'image-to-video': jana dulu satu gambar kucing dan satu gambar anjing yang cantik, kemudian guna gambar yang sama sebagai rujukan untuk setiap klip supaya rupa mereka konsisten.",
 "Salin blok 'watak' (kucing dan anjing) dengan sama persis dalam setiap prompt. Jangan ubah perkataan, kerana itu yang menjaga warna bulu dan saiz.",
 "Jana 2 hingga 4 versi setiap syot, pilih yang terbaik. Klip 3 hingga 8 saat paling stabil; klip panjang mudah rosak.",
 "Gunakan prompt negatif (kalau alat itu ada) untuk mengelakkan rupa kartun dan kaki yang cacat.",
 "Sambung klip di CapCut atau DaVinci Resolve. Letak bunyi akhir (bunyi persekitaran dan muzik) di situ jika alat anda tiada audio sendiri.",
 "Alat video AI yang popular: Google Veo, OpenAI Sora, Kling, Runway, Luma, Hailuo. Ciri dan harga berubah dengan cepat, jadi semak dulu apa yang ada pada akaun anda.",
]

def md():
    o = ["# Pek skrip video AI: Kucing Kejar Anjing", "",
         "Prompt dalam bahasa Inggeris kerana kebanyakan alat video AI memberi hasil terbaik dengan bahasa itu. Jana setiap syot satu per satu, kemudian sambung.", "",
         "## Cara guna", ""] + [f"{i+1}. {t}" for i, t in enumerate(TIPS)] + ["", "## Blok watak dan gaya (ulang dalam setiap prompt)", "",
         f"- Kucing: {CAT}", f"- Anjing: {DOG}", f"- Latar: {SET}", f"- Gaya: {STYLE}", f"- Prompt negatif: {NEG}", "", "## Senarai syot", ""]
    for s in SHOTS:
        o += [f"### Syot {s['n']}: {s['t']} ({s['sec']})", f"Kamera: {s['cam']}", "", f"**Prompt**: {s['p']}", "", f"**Bunyi**: {s['snd']}", ""]
    return "\n".join(o)

os.makedirs('docs', exist_ok=True); open('docs/ai-video-prompts.md', 'w').write(md())

e = html.escape
cards = ""
for s in SHOTS:
    cards += f'''<article class="shot" id="s{s['n']}">
  <header><span class="num">Syot {s['n']}</span><h3>{e(s['t'])}</h3><span class="meta">{e(s['sec'])} · {e(s['cam'])}</span></header>
  <textarea id="p{s['n']}" readonly rows="6">{e(s['p'])}</textarea>
  <p class="snd"><b>Bunyi:</b> {e(s['snd'])}</p>
  <button class="copy" data-t="p{s['n']}" type="button">Salin prompt</button>
</article>'''
tips = "".join(f"<li>{e(t)}</li>" for t in TIPS)
bible = "".join(f'<div class="row"><dt>{k}</dt><dd id="b{i}">{e(v)}</dd><button class="copy sm" data-t="b{i}" type="button">Salin</button></div>' for i, (k, v) in enumerate([("Kucing", CAT), ("Anjing", DOG), ("Latar", SET), ("Gaya", STYLE), ("Prompt negatif", NEG)]))
page = f'''<title>Pek Prompt Video AI</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Source+Sans+3:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>
/* Layout: one narrow column, a "slate" header, then one card per shot. Prompts live in read-only text areas with copy buttons. */
:root{{--bg:#f6f6f3;--fg:#17191d;--muted:#5d636d;--card:#ffffff;--line:#d9dad5;--accent:#c47a00;--accent-fg:#ffffff;--code:#f0f0eb;
--display:"Bricolage Grotesque","Segoe UI",system-ui,sans-serif;--body:"Source Sans 3","Segoe UI",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#111316;--fg:#ececea;--muted:#a1a7b0;--card:#1a1d21;--line:#2d3138;--accent:#f0a830;--accent-fg:#16130a;--code:#14161a;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#111316;--fg:#ececea;--muted:#a1a7b0;--card:#1a1d21;--line:#2d3138;--accent:#f0a830;--accent-fg:#16130a;--code:#14161a;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font-family:var(--body);font-size:1.05rem;line-height:1.55;padding-block:32px 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:28px}}
h1{{font-family:var(--display);font-weight:800;font-size:clamp(1.9rem,6vw,2.7rem);line-height:1.08;margin:0;text-wrap:balance}}
h2{{font-family:var(--display);font-size:1.3rem;margin:0 0 10px}}
.lede{{color:var(--muted);margin:10px 0 0;max-width:62ch}}
section.box{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px}}
ol{{margin:0;padding-left:1.2rem;display:flex;flex-direction:column;gap:8px}} li{{max-width:70ch}}
dl{{margin:0;display:flex;flex-direction:column;gap:12px}}
.row{{display:grid;grid-template-columns:7.5rem 1fr auto;gap:6px 12px;align-items:start}}
dt{{font-weight:600;color:var(--muted)}} dd{{margin:0;font-family:var(--mono);font-size:.84rem;background:var(--code);padding:8px 10px;border-radius:6px;min-width:0;overflow-wrap:anywhere}}
.shot{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px}}
.shot header{{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}}
.num{{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);font-weight:400}}
h3{{font-family:var(--display);font-size:1.15rem;margin:0}} .meta{{color:var(--muted);font-size:.9rem;flex-basis:100%}}
textarea{{width:100%;box-sizing:border-box;font-family:var(--mono);font-size:.84rem;line-height:1.5;background:var(--code);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:10px;resize:vertical}}
.snd{{margin:0;color:var(--muted);font-size:.95rem}}
button.copy{{align-self:flex-start;background:var(--accent);color:var(--accent-fg);border:0;border-radius:6px;padding:9px 16px;font:600 .95rem var(--body);cursor:pointer}}
button.copy.sm{{padding:6px 10px;font-size:.85rem}} button.copy:focus-visible{{outline:3px solid var(--fg);outline-offset:2px}}
button.copy[data-done]{{filter:saturate(.6)}}
@media (max-width:560px){{.row{{grid-template-columns:1fr}}}}
</style>
<main>
<header><h1>Pek prompt video AI: Kucing Kejar Anjing</h1>
<p class="lede">Lapan syot, siap dengan prompt untuk alat video AI sebenar (Veo, Sora, Kling, Runway dan seumpamanya). Prompt dalam bahasa Inggeris kerana itu memberi hasil terbaik. Jana setiap syot satu per satu, kemudian sambungkan.</p></header>
<section class="box"><h2>Cara guna</h2><ol>{tips}</ol></section>
<section class="box"><h2>Blok watak dan gaya</h2><dl>{bible}</dl></section>
{cards}
</main>
<script>
document.querySelectorAll('button.copy').forEach(function(b){{b.addEventListener('click',function(){{
  var el=document.getElementById(b.dataset.t), txt=el.value!==undefined?el.value:el.textContent, old=b.textContent;
  function done(){{b.textContent='Disalin';b.setAttribute('data-done','1');setTimeout(function(){{b.textContent=old;b.removeAttribute('data-done');}},1600);}}
  function fallback(){{ if(el.select){{el.focus();el.select();}} else {{var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}} b.textContent='Pilih lalu salin';setTimeout(function(){{b.textContent=old;}},2200); }}
  try{{ navigator.clipboard.writeText(txt).then(done,fallback); }}catch(e){{ fallback(); }}
}});}});
</script>'''
open(sys.argv[1], 'w').write(page)
print('ok', len(page))
