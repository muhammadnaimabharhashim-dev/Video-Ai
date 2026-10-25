"""Synthesize a playful soundtrack + sound effects synced to events.json. Usage: audio.py events.json out.wav"""
import sys, json, wave
import numpy as np
SR = 44100; DUR = 25.0
ev = json.load(open(sys.argv[1]))
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

# --- music (bar = 4 beats) ---
def seq(t0, bpm, notes, inst, step=0.5):
    b = 60 / bpm
    for k, m in enumerate(notes):
        if m: add(t0 + k * step * b, inst(mf(m), step * b * 0.9))
# Sneaky intro (0-4.1): tiptoe bass + plinks
seq(0, 100, [48, 0, 55, 0, 51, 0, 55, 0, 48, 0, 55, 0, 53, 0, 50, 0, 48, 0, 55, 0, 51, 0, 55, 0], lambda f, d: tri(f, d, 0.22, 0.12), 0.5)
seq(0.3, 100, [72, 0, 0, 75, 0, 0, 72, 0, 0, 70, 0, 0, 67, 0, 0, 70, 0], lambda f, d: square(f, d, 0.05, 0.25, 0.1), 0.5)
# Chase theme (4.1-15.2): fast, bouncy
chase_mel = [72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 76, 79, 83, 79, 76, 72,
             74, 77, 81, 77, 74, 77, 81, 86, 84, 81, 77, 81, 84, 81, 77, 74]
chase_bass = [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 53, 0, 60, 0, 55, 0, 62, 0, 55, 0, 62, 0, 48, 0, 55, 0, 52, 0, 55, 0]
t = 4.1; bpm = 190
while t < 15.2:
    seq(t, bpm, chase_mel, lambda f, d: square(f, d, 0.1, 0.35), 0.5)
    seq(t, bpm, chase_bass, lambda f, d: tri(f, d, 0.25, 0.05), 0.5)
    t += 16 * 0.5 * 60 / bpm
# Tension (15.2-20): descending creeping
seq(15.2, 110, [60, 0, 59, 0, 58, 0, 57, 0, 56, 0, 55, 0, 54, 0, 53, 0], lambda f, d: tri(f, d * 1.5, 0.25, 0.2), 0.5)
# Cute resolution (20-25)
seq(20.0, 120, [72, 76, 79, 76, 77, 81, 84, 81, 79, 83, 86, 83, 84, 0, 79, 0, 72, 0, 0, 0],
    lambda f, d: square(f, d, 0.09, 0.5, 0.1), 0.5)
seq(20.0, 120, [48, 0, 55, 0, 53, 0, 57, 0, 55, 0, 59, 0, 48, 0, 55, 0, 48, 0, 0, 0], lambda f, d: tri(f, d, 0.22, 0.12), 0.5)

# --- sfx ---
add(1.95, slide(900, 300, 0.2, 0.2))                      # steal (gulp)
add(2.8, slide(200, 800, 0.25, 0.25))                     # wake
add(3.0, square(880, 0.25, 0.15))                         # !
add(3.2, slide(600, 160, 0.4, 0.2, 'sq'))
add(4.3, noise(0.9, 0.18, 3)); add(4.3, slide(120, 700, 0.8, 0.12, 'sq'))   # zoom
add(ev['crash'] - 0.4, slide(300, 900, 0.3, 0.18))        # hup / boing
add(ev['crash'], noise(0.7, 0.8, 5)); add(ev['crash'], slide(180, 40, 0.5, 0.5))   # crash
for k in range(5): add(ev['crash'] + 0.15 + k * 0.1, square(300 + k * 90, 0.06, 0.2))
add(ev['slip'], slide(300, 1400, 0.5, 0.3)); add(ev['slip'] + 0.5, slide(1400, 150, 0.8, 0.3))  # wheee
add(ev['slip'] + 1.3, noise(0.2, 0.7, 12))
for k in range(3): add(ev['slip'] + 1.4 + k * 0.28, slide(700, 500, 0.2, 0.15))   # dizzy
for k, f in enumerate([2100, 3150, 4200, 5300]): add(ev['bucket'], np.sin(2 * np.pi * f * np.arange(int(SR * 0.9)) / SR) * 0.15 * np.exp(-np.linspace(0, 8, int(SR * 0.9))))
add(ev['bucket'], noise(0.15, 0.7, 10))
add(ev['skid'], noise(0.8, 0.35, 1.5) * np.linspace(0.3, 1, int(SR * 0.8)))
add(ev['pop'], slide(200, 1200, 0.18, 0.3)); add(ev['pop'] + 0.05, noise(0.1, 0.5, 10))
add(ev['drop'], slide(900, 200, 0.4, 0.2))
for k in range(8): add(ev['take'] + 0.2 + k * 0.14, slide(500 + (k % 2) * 250, 350, 0.08, 0.2, 'sq'))   # nyam nyam
add(ev['jump'], slide(300, 1100, 0.5, 0.25)); add(ev['jump'] + 0.8, tri(120, 0.2, 0.5))
add(20.9, slide(500, 220, 1.0, 0.18))                      # sigh
for k, m in enumerate([72, 76, 79, 84]): add(22.4 + k * 0.17, square(mf(m), 0.4, 0.14, 0.5, 0.3))   # tamat jingle

mix = np.tanh(mix * 1.1) * 0.85
fade = np.ones(N); fade[-int(SR * 0.8):] = np.linspace(1, 0, int(SR * 0.8)); mix *= fade
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32000).astype('<i2').tobytes())
