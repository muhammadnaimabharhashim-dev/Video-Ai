"""Voice (offline TTS) + ambience + score + foley for cinematic/pakmat.html. Usage: audio_pakmat3d.py events.json out.wav mouth.json"""
import sys, json, wave, os
import numpy as np
from scipy.signal import butter, sosfilt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts
SR = 44100; DUR = 39.0
E = json.load(open(sys.argv[1]))
N = int(SR * DUR); rng = np.random.default_rng(7); t_ax = np.arange(N) / SR
def sos(kind, fc, o=2): return butter(o, fc, btype=kind, fs=SR, output='sos')
def lp(x, fc, o=2): return sosfilt(sos('low', fc, o), x)
def hp(x, fc, o=2): return sosfilt(sos('high', fc, o), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def env_ad(n, a, d): t = np.arange(n) / SR; return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / max(d, 1e-4))
def put(bus, t0, x, g=1.0):
    i = int(t0 * SR)
    if 0 <= i < len(bus): j = min(len(bus), i + len(x)); bus[i:j] += x[:j - i] * g
def smooth(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def slide(f0, f1, d, amp=0.25, kind='sine'):
    n = int(d * SR); f = np.linspace(f0, f1, n); ph = np.cumsum(f) / SR
    w = np.sin(2 * np.pi * ph) if kind == 'sine' else np.sign(np.sin(2 * np.pi * ph)) * 0.6
    return amp * w * np.minimum(np.arange(n) / (0.01 * SR), 1) * np.minimum((n - np.arange(n)) / (0.05 * SR), 1)
mf = lambda m: 440 * 2 ** ((m - 69) / 12)
amb, ambR, music, sfx = (np.zeros(N) for _ in range(4))

# --- voice lines: (start, text) must match LINES in animation/pak-mat.html ---
LINES = [
 (1.0,  "Assalamualaikum semua! Saya Pak Mat. Hari ini, saya nak tangkap ayam saya yang nakal!"),
 (9.0,  "Eh! Itu dia! Ayam! Jangan lari!"),
 (14.0, "Aduh... gelapnya! Siapa tutup lampu?"),
 (19.4, "Haa, apa pulak yang jatuh ni? Durian? Patutlah pening."),
 (25.0, "Hmm... ayam ni lapar agaknya. Nah, makan dulu. Lepas ni jangan lari lagi ya."),
 (32.6, "Wah! Telur emas! Pak Mat dah kaya raya!"),
]
voice = np.zeros(N)
for k, (t0, txt) in enumerate(LINES):
    x, sr = tts.synth(txt, 'ms+m3', 140, 35)
    x = x.astype(float) / 32768.0
    x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)   # resample to 44.1k
    end = t0 + len(x) / SR
    nxt = LINES[k + 1][0] if k + 1 < len(LINES) else DUR
    print(f"line {k+1}: {t0:.2f}-{end:.2f}s", "OK" if end < nxt - 0.1 else "OVERLAP!")
    i = int(t0 * SR); voice[i:i + len(x)] += x
voice = voice / max(1e-6, np.abs(voice).max()) * 0.95
# mouth openness per video frame (30fps) from the voice's smoothed envelope
FPS = 30; hop = SR // FPS
envl = np.array([np.sqrt(np.mean(voice[i:i + hop] ** 2)) for i in range(0, N, hop)])
envl = np.convolve(envl, [0.25, 0.5, 0.25], mode='same'); envl = np.clip(envl / max(1e-6, np.percentile(envl[envl > 0.01], 90)), 0, 1)
json.dump([round(float(v), 3) for v in envl], open(sys.argv[3], 'w'))
duck = np.convolve((np.abs(voice) > 0.01).astype(float), np.ones(SR // 5) / (SR // 5), mode='same')   # voice present
duck = 1 - 0.55 * np.clip(duck * 3, 0, 1)


# ---------------- ambience: wind, birds, cicadas, a far rooster ----------------
amb += lp(noise(N), 450) * (0.55 + 0.45 * np.sin(2 * np.pi * t_ax / 7.3 + 1)) * 0.13; ambR += lp(noise(N), 450) * (0.55 + 0.45 * np.sin(2 * np.pi * t_ax / 6.1)) * 0.13
leaves = hp(noise(N), 3000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * t_ax / 4.7))) * 0.012; amb += leaves; ambR += hp(noise(N), 3000) * 0.01
cic = bp(noise(N), 4200, 5400) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t_ax))) * (0.5 + 0.5 * np.sin(2 * np.pi * t_ax / 5.0)); amb += cic * 0.016; ambR += cic * 0.012
for k in range(30):
    t0 = rng.uniform(0.3, DUR - 1); n = int(0.18 * SR); tt = np.arange(n) / SR; f = rng.uniform(2200, 4200) * (1 + 0.35 * np.sin(2 * np.pi * rng.uniform(8, 18) * tt)) * (1 + 0.4 * tt)
    for rep in range(rng.integers(1, 4)): put(amb, t0 + rep * 0.22, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(n) * 0.026)
def rooster(t0, g):
    n = int(1.5 * SR); tt = np.arange(n) / SR; f = 520 + 380 * np.sin(np.pi * np.clip(tt / 0.5, 0, 1)) - 250 * np.clip((tt - 0.5) / 1.0, 0, 1)
    ph = np.cumsum(f) / SR * 2 * np.pi; src = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
    put(amb, t0, bp(src, 500, 3000) * np.hanning(n) * 0.09 * g)
rooster(3.2, 0.7); rooster(21.5, 0.5)

# ---------------- score: soft pad + plucked guitar (Karplus-Strong) ----------------
def pad(freqs, t0, dur, gain=0.1):
    n = int(dur * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.0, 0.004): ph = 2 * np.pi * f * (1 + det) * tt; out += np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    put(music, t0, lp(out, 1500) * np.minimum(tt / 1.5, 1) * np.minimum((dur - tt) / 1.2, 1) * gain / len(freqs))
def pluck(f, dur=1.4, g=0.2):
    n = int(dur * SR); d = int(SR / f); buf = rng.uniform(-1, 1, d); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % d]; buf[i % d] = 0.4985 * (buf[i % d] + buf[(i + 1) % d])
    return out * g * np.exp(-np.arange(n) / SR * 1.2)
chords = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]]
tcur, ci = 0.0, 0
while tcur < DUR: pad([mf(m) for m in chords[ci % 4]], tcur, 4.4, 0.16); tcur += 4.0; ci += 1
pent = [69, 72, 74, 76, 79, 76, 74, 72]
bpm = 96; beat = 60 / bpm; t0 = 1.0; k = 0
while t0 < DUR - 2:
    busy = E['henBolt'] < t0 < 18.8 or 24.5 < t0 < 36.4
    if k % 2 == 0 or busy: put(music, t0, pluck(mf(pent[(k * 3 + (k // 8)) % 8] - (12 if k % 5 == 0 else 0)), 1.2, 0.12 if busy else 0.07))
    t0 += beat / 2; k += 1
for tb in np.arange(E['henBolt'] + 0.3, 18.8, beat):         # soft chase percussion
    n = int(0.3 * SR); tt = np.arange(n) / SR; put(music, tb, np.sin(2 * np.pi * np.cumsum(60 + 60 * np.exp(-tt * 25)) / SR) * np.exp(-tt * 9) * 0.5)
    n = int(0.06 * SR); put(music, tb + beat / 2, hp(noise(n), 6000) * np.exp(-np.arange(n) / SR * 80) * 0.12)
pad([mf(m) for m in [48, 55, 60, 64, 67]], E['eggup'] - 0.3, 6.0, 0.2)

# ---------------- foley ----------------
def step(t0, g=1.0, hen=False):
    n = int(0.1 * SR); tt = np.arange(n) / SR
    if hen: put(sfx, t0, bp(noise(n), 1500, 4500) * np.exp(-tt * 120) * 0.1 * g)
    else: put(sfx, t0, (bp(noise(n), 200, 1800) * np.exp(-tt * 60) * 0.35 + np.sin(2 * np.pi * 75 * tt) * np.exp(-tt * 40) * 0.25) * g)
for t_ in E['manSteps']: step(t_, 1.0)
for t_ in E['henSteps']: step(t_, 1.0, True)
def cluck(t0, g=1.0, pitch=1.0):
    n = int(0.16 * SR); tt = np.arange(n) / SR; f = pitch * (700 - 250 * tt / 0.16); src = np.sign(np.sin(np.cumsum(f) / SR * 2 * np.pi)) * 0.5 + noise(n) * 0.15
    put(sfx, t0, (bp(src, 600, 1500) * 0.6 + bp(src, 1800, 2800) * 0.25) * env_ad(n, 0.008, 0.05) * g * 0.5)
for tb in (6.0, 8.5, 8.7, 8.95, 11.4, 11.65, 12.7, 13.0, 19.8, 21.1, 22.6): cluck(tb, 1.0, 1.0 + rng.uniform(-0.1, 0.1))
for tb in np.arange(28.0, 31.0, 1.3): cluck(tb, 0.7)
n = int(0.5 * SR); put(sfx, E['lay'] - 0.2, bp(noise(n), 500, 2500) * env_ad(n, 0.1, 0.2) * 0.4)       # laying effort
for tb in np.arange(10.1, 13.0, 0.22): n = int(0.05 * SR); put(sfx, tb, bp(noise(n), 300, 2500) * np.exp(-np.arange(n) / SR * 90) * 0.1)   # fabric flap (running)
# trip, fall, bucket
n = int(0.35 * SR); tt = np.arange(n) / SR
put(sfx, E['trip'] - 0.05, hp(noise(n), 1200) * np.exp(-tt * 18) * 0.35)                               # kick the bucket
put(sfx, E['trip'] + 0.4, (bp(noise(n), 100, 900) * np.exp(-tt * 14) * 0.8 + np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 12) * 0.9))   # body thud
nn = int(1.1 * SR); put(sfx, 13.55, sum(np.sin(2 * np.pi * f * np.arange(nn) / SR) * np.exp(-np.linspace(0, 7, nn)) for f in (1200, 1830, 2650, 3700)) * 0.09)   # bucket clang
put(sfx, 17.4, bp(noise(int(0.3 * SR)), 300, 2500) * 0.25); nn = int(1.0 * SR); put(sfx, 18.2, sum(np.sin(2 * np.pi * f * np.arange(nn) / SR) * np.exp(-np.linspace(0, 8, nn)) for f in (1200, 1830, 2650)) * 0.07)
# durian drop + bonk
nn = int(0.8 * SR); put(sfx, E['durFall'], lp(noise(nn), 900) * np.linspace(0, 1, nn) ** 3 * 0.08)
nn = int(0.4 * SR); tt = np.arange(nn) / SR; put(sfx, E['bonk'], (np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 14) * 1.0 + bp(noise(nn), 150, 1200) * np.exp(-tt * 22) * 0.6))
put(sfx, E['bonk'] + 0.35, np.sin(2 * np.pi * np.cumsum(500 - 200 * np.linspace(0, 1, int(0.4 * SR))) / SR) * np.exp(-np.linspace(0, 5, int(0.4 * SR))) * 0.15)   # dizzy wobble
for tb in (E['bonk'] + 0.4, E['bonk'] + 0.75): nn = int(0.2 * SR); put(sfx, tb, np.sin(2 * np.pi * 120 * np.arange(nn) / SR) * np.exp(-np.arange(nn) / SR * 30) * 0.3)   # durian bounces
# sack, grains, pecking
nn = int(0.4 * SR); put(sfx, 24.5, bp(noise(nn), 300, 3000) * env_ad(nn, 0.1, 0.12) * 0.25)
for tb in np.arange(26.2, 29.6, 0.07): n = int(0.03 * SR); put(sfx, tb, hp(noise(n), 4000) * np.exp(-np.arange(n) / SR * 120) * 0.08)
for tb in np.arange(27.1, 30.0, 0.18): n = int(0.05 * SR); put(sfx, tb, bp(noise(n), 800, 3500) * np.exp(-np.arange(n) / SR * 90) * 0.25)
# golden egg
nn = int(0.12 * SR); put(sfx, E['lay'] + 0.15, np.sin(2 * np.pi * 180 * np.arange(nn) / SR) * np.exp(-np.arange(nn) / SR * 30) * 0.3)
nn = int(1.6 * SR); put(sfx, E['lay'] + 0.25, sum(np.sin(2 * np.pi * f * np.arange(nn) / SR) * np.exp(-np.linspace(0, 5, nn)) for f in (1568, 2093, 3136, 4186)) * 0.07)
for tb in np.arange(E['eggup'] + 0.6, 35.8, 0.37): nn = int(0.5 * SR); put(sfx, tb, np.sin(2 * np.pi * (3500 + 500 * rng.random()) * np.arange(nn) / SR) * np.exp(-np.linspace(0, 8, nn)) * 0.03)   # sparkle
# peck on the toe + auch handled by the voice-free yelp
put(sfx, 35.95, bp(noise(int(0.06 * SR)), 800, 3500) * 0.4); put(sfx, 36.0, slide(900, 300, 0.2, 0.2, 'sq'))

# ---------------- mix & master ----------------
L = amb + music * 0.9 + sfx * 0.9 + voice * 0.95; R = ambR + music * 0.9 + sfx * 0.9 + voice * 0.95
fade = np.ones(N); fade[:int(0.4 * SR)] = np.linspace(0, 1, int(0.4 * SR)); fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))
out = np.stack([np.tanh(L * 1.15) * fade, np.tanh(R * 1.15) * fade], 1); out = out / max(1e-6, np.abs(out).max()) * 0.9
with wave.open(sys.argv[2], 'wb') as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((out * 32767).astype('<i2').tobytes())
print('audio ok')
