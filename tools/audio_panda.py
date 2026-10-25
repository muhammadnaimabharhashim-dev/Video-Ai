"""Soundtrack + SFX for panda-skate.html (fixed event times). Usage: audio_panda.py out.wav"""
import sys, json, wave
import numpy as np
SR = 44100; DUR = 25.0
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

# --- music: skate-punk-ish bouncy loop ---
def seq(t0, bpm, notes, inst, step=0.5):
    b = 60 / bpm
    for k, m in enumerate(notes):
        if m: add(t0 + k * step * b, inst(mf(m), step * b * 0.9))
bass = lambda f, d: tri(f, d, 0.26, 0.05)
lead = lambda f, d: square(f, d, 0.09, 0.25)
# 0-2.6 nervous
seq(0, 90, [48, 0, 0, 48, 0, 0, 49, 0, 0, 48, 0, 0], bass, 0.5)
seq(0.2, 90, [72, 0, 71, 0, 72, 0, 71, 0, 72, 0], lambda f, d: square(f, d, 0.05, 0.25, 0.1), 0.5)
# 2.6-14: cruising groove, then big-ramp build
mel = [67, 0, 72, 74, 76, 0, 74, 72, 67, 0, 72, 74, 79, 0, 76, 74, 69, 0, 72, 76, 77, 0, 76, 72, 71, 0, 67, 71, 74, 0, 0, 0]
bs = [48, 0, 48, 0, 55, 0, 55, 0, 48, 0, 48, 0, 55, 0, 55, 0, 53, 0, 53, 0, 60, 0, 60, 0, 55, 0, 55, 0, 50, 0, 50, 0]
t = 2.6
while t < 18.2:
    seq(t, 160, mel, lead); seq(t, 160, bs, bass); t += 32 * 0.5 * 60 / 160
# 18.4 fanfare + cheerful tail
for k, m in enumerate([72, 72, 72, 76, 79, 84]): add(18.4 + k * 0.13, square(mf(m), 0.35, 0.16, 0.5, 0.2))
seq(19.2, 120, [72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 76, 72], lambda f, d: square(f, d, 0.08, 0.5, 0.1), 0.5)
seq(19.2, 120, [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 55, 0], bass, 1)

# --- sfx ---
for k in range(8): add(0.8 + k * 0.1, slide(500, 480, 0.06, 0.08, 'sq') * (1 if k % 2 else 0.6))   # shaky knees
add(2.6, noise(1.2, 0.12, 0.5) * np.linspace(0.2, 1, int(SR * 1.2)))          # wheels start
add(5.2, noise(0.08, 0.3, 10)); add(5.3, noise(0.08, 0.3, 10)); add(5.4, noise(0.08, 0.3, 10))  # munch
add(7.4, slide(250, 1100, 0.5, 0.3))                                         # jump whoosh
add(8.3, noise(0.2, 0.7, 10)); add(8.3, tri(110, 0.2, 0.6))                  # butt landing
add(8.3, noise(1.7, 0.2, 1.0))                                               # sliding scrape
for k in range(14): add(10.0 + k * 0.11, noise(0.05, 0.4, 20))               # running steps
add(8.6, slide(900, 300, 0.4, 0.15, 'sq'))                                   # "oh no"
add(11.9, tri(160, 0.12, 0.6)); add(11.9, slide(600, 1200, 0.2, 0.2))        # catch board
add(12.0, slide(500, 900, 0.3, 0.2))
add(13.9, noise(0.5, 0.5, 2) * np.linspace(0.2, 1, int(SR * 0.5)))
add(14.0, slide(150, 1600, 1.2, 0.3)); add(15.2, slide(1600, 400, 1.2, 0.25)) # long WUAAAH whistle
for k, f in enumerate([420, 520]): add(14.9 + k * 0.22, slide(f, f * 0.8, 0.2, 0.3, 'sq'))   # honk honk
add(16.4, slide(300, 1500, 0.35, 0.35)); add(16.4, noise(0.1, 0.6, 10))       # BOING + squeak
add(16.7, slide(1500, 500, 0.3, 0.2))
add(18.4, noise(1.6, 0.35, 1.2)); add(18.4 + 0.3, noise(1.4, 0.3, 1.0))      # applause
for k in range(14): add(18.5 + k * 0.1, noise(0.05, 0.4, 20))
add(20.2, noise(0.1, 0.6, 12))                                               # bite
for k in range(6): add(20.3 + k * 0.17, slide(300, 220, 0.1, 0.25, 'sq'))    # chew
add(21.0, slide(400, 150, 0.5, 0.3, 'sq'))                                   # sad trombone
add(21.5, slide(300, 90, 0.8, 0.3, 'sq'))
for k, m in enumerate([67, 72, 76, 79]): add(22.4 + k * 0.17, square(mf(m), 0.4, 0.14, 0.5, 0.3))

mix = np.tanh(mix * 1.1) * 0.85
fade = np.ones(N); fade[-int(SR * 0.8):] = np.linspace(1, 0, int(SR * 0.8)); mix *= fade
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32000).astype('<i2').tobytes())
