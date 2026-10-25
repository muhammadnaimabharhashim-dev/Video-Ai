"""Voice (offline TTS) + music + SFX for pak-mat.html. Usage: audio_pakmat.py out.wav mouth.json"""
import sys, json, wave
import os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts
SR = 44100; DUR = 39.0
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(7)

def add(t0, sig):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N: mix[i:j] += sig[:j - i]
def env(n, a=0.005, r=0.08):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def square(f, d, amp=0.12, duty=0.5, r=0.08):
    n = int(d * SR); ph = (np.arange(n) * f / SR) % 1
    return amp * np.where(ph < duty, 1, -1) * env(n, r=min(r, d))
def tri(f, d, amp=0.2, r=0.1):
    n = int(d * SR); ph = (np.arange(n) * f / SR) % 1
    return amp * (4 * np.abs(ph - 0.5) - 1) * env(n, r=min(r, d))
def noise(d, amp=0.3, decay=6):
    n = int(d * SR); return amp * rng.standard_normal(n) * np.exp(-np.linspace(0, decay, n))
def slide(f0, f1, d, amp=0.25, kind='sine'):
    n = int(d * SR); f = np.linspace(f0, f1, n); ph = np.cumsum(f) / SR
    w = np.sin(2 * np.pi * ph) if kind == 'sine' else np.sign(np.sin(2 * np.pi * ph)) * 0.6
    return amp * w * env(n, r=0.05)
mf = lambda m: 440 * 2 ** ((m - 69) / 12)

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
json.dump([round(float(v), 3) for v in envl], open(sys.argv[2], 'w'))
duck = np.convolve((np.abs(voice) > 0.01).astype(float), np.ones(SR // 5) / (SR // 5), mode='same')   # voice present
duck = 1 - 0.55 * np.clip(duck * 3, 0, 1)

# --- music: gentle kampung-style plucked loop ---
def seq(t0, bpm, notes, inst, step=0.5):
    b = 60 / bpm
    for k, m in enumerate(notes):
        if m: add(t0 + k * step * b, inst(mf(m), step * b * 0.9))
pl = lambda f, d: tri(f, d, 0.16, 0.25)
bs = lambda f, d: tri(f, d, 0.2, 0.08)
mel = [67, 69, 72, 69, 67, 64, 67, 0, 69, 72, 76, 72, 69, 67, 64, 0]
bas = [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 53, 0, 60, 0]
t = 0.0
while t < 36.5:
    fast = 9 < t < 14.5 or 35.5 < t
    bpm = 150 if fast else 110
    seq(t, bpm, mel, pl); seq(t, bpm, bas, bs); t += 16 * 0.5 * 60 / bpm
music = mix.copy() * duck; mix[:] = 0

# --- sfx ---
for k in range(6): add(0.1 + k * 0.15, noise(0.07, 0.25, 12))                       # footsteps in
add(8.7, slide(900, 300, 0.4, 0.2, 'sq')); add(8.9, slide(900, 400, 0.3, 0.2, 'sq'))   # chicken bawk
for k in range(10): add(9.0 + k * 0.17, noise(0.05, 0.25, 15))                       # running
add(11.4, slide(800, 500, 0.2, 0.2, 'sq')); add(11.6, slide(800, 500, 0.2, 0.2, 'sq'))   # kok kok
add(12.95, noise(0.2, 0.8, 10)); add(12.95, tri(110, 0.2, 0.7))                      # BUK
add(13.55, sum(np.sin(2 * np.pi * f * np.arange(int(SR * 0.9)) / SR) * np.exp(-np.linspace(0, 7, int(SR * 0.9))) for f in (1800, 2700, 3900)) * 0.12)  # klontang
add(17.4, slide(300, 700, 0.2, 0.2)); add(18.2, noise(0.15, 0.4, 12))
add(19.1, noise(0.15, 0.8, 12)); add(19.1, tri(90, 0.25, 0.8)); add(19.2, slide(1200, 400, 0.4, 0.2))   # durian BUK
add(23.5, slide(600, 1500, 0.25, 0.25))                                              # idea ting
for k in range(6): add(26.3 + k * 0.08, noise(0.04, 0.3, 20))                        # grains
for k in range(14): add(27.2 + k * 0.17, noise(0.05, 0.35, 18))                      # peck peck
add(31.8, slide(300, 900, 0.15, 0.3)); add(32.05, sum(np.sin(2 * np.pi * f * np.arange(int(SR * 0.7)) / SR) * np.exp(-np.linspace(0, 6, int(SR * 0.7))) for f in (1568, 2093, 3136)) * 0.12)  # ting
add(36.0, slide(900, 300, 0.2, 0.3, 'sq')); add(35.9, noise(0.1, 0.5, 12))           # peck toe + auch
for k, m in enumerate([67, 72, 76, 79]): add(36.9 + k * 0.17, square(mf(m), 0.4, 0.14, 0.5, 0.3))
sfx = mix.copy()

out = np.tanh((music * 1.0 + sfx * 0.9) * 1.0 + voice * 0.95) * 0.9
fade = np.ones(N); fade[-int(SR * 0.8):] = np.linspace(1, 0, int(SR * 0.8)); out *= fade
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32000).astype('<i2').tobytes())
