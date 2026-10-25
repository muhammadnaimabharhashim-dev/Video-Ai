"""Soundtrack + SFX for ayam-katak.html (fixed event times). Usage: audio_ayam.py out.wav"""
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

# --- music: bouncy pond theme (C major, swung feel) ---
def seq(t0, bpm, notes, inst, step=0.5):
    b = 60 / bpm
    for k, m in enumerate(notes):
        if m: add(t0 + k * step * b, inst(mf(m), step * b * 0.9))
bass = lambda f, d: tri(f, d, 0.24, 0.06)
lead = lambda f, d: square(f, d, 0.09, 0.3)
# 0-4: lazy hungry walk
seq(0, 96, [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 55, 0, 52, 0], bass)
seq(0.3, 96, [67, 0, 0, 71, 0, 0, 69, 0, 0, 65, 0, 0], lambda f, d: square(f, d, 0.06, 0.25, 0.1))
# 4-16: hop-chase
mel = [72, 0, 76, 79, 0, 76, 72, 0, 74, 77, 0, 74, 71, 0, 67, 0, 72, 76, 79, 84, 83, 0, 79, 76, 77, 0, 74, 71, 72, 0, 0, 0]
bs = [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 55, 0, 62, 0, 48, 0, 55, 0, 53, 0, 60, 0, 55, 0, 52, 0, 48, 0, 0, 0]
t = 4.0
while t < 16.0:
    seq(t, 170, mel, lead); seq(t, 170, bs, bass); t += 32 * 0.5 * 60 / 170
# 16-19: big-frog menace then chicken panic
seq(15.9, 120, [36, 0, 0, 36, 0, 0, 35, 0, 0, 35], lambda f, d: tri(f, d * 1.6, 0.4, 0.3), 1)
seq(17.2, 200, [84, 83, 81, 79, 84, 83, 81, 79, 84, 83, 81, 79], lambda f, d: square(f, d, 0.08, 0.5, 0.05), 0.5)
# 19-25: warm resolution
seq(19.0, 110, [72, 0, 76, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0], lambda f, d: square(f, d, 0.09, 0.5, 0.15), 1)
seq(19.0, 110, [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 48, 0, 0, 0], lambda f, d: tri(f, d, 0.25, 0.2), 1)

# --- sfx ---
add(1.5, slide(120, 70, 0.9, 0.5)); add(1.5, noise(0.9, 0.12, 2))          # stomach growl
add(2.0, slide(500, 900, 0.15, 0.2)); add(2.2, noise(0.08, 0.5, 10))        # frog tongue
add(2.7, slide(300, 700, 0.3, 0.2, 'sq'))                                   # drooling "wah"
add(3.6, slide(700, 200, 0.25, 0.2))                                        # gulp
add(4.0, slide(300, 900, 0.3, 0.2)); add(4.3, slide(900, 300, 0.2, 0.2))    # frog hop
add(4.6, noise(0.7, 0.8, 5)); add(4.6, slide(200, 60, 0.5, 0.4))            # byurr
for k in range(6): add(5.0 + k * 0.15, slide(900, 300, 0.1, 0.12))          # blub blub
add(5.0, slide(1500, 700, 0.4, 0.15, 'sq'))                                 # blee
add(5.6, slide(300, 900, 0.3, 0.2))
for k in range(10): add(7.6 + k * 0.1, noise(0.08, 0.25, 8))                # wing flaps
add(7.3, noise(0.3, 0.3, 4))                                                # shake-off
add(9.0, slide(80, 200, 0.4, 0.5))                                          # turtle rising
add(9.4, slide(200, 1600, 0.45, 0.3)); add(9.9, slide(1600, 300, 0.4, 0.2)) # BOING
add(10.4, noise(0.12, 0.7, 12)); add(10.4, tri(180, 0.15, 0.5))             # tok
add(11.1, slide(300, 900, 0.1, 0.35, 'sq'))                                 # pok
add(11.6, noise(0.25, 0.9, 10)); add(11.6, slide(500, 120, 0.25, 0.4))      # plak
add(11.8, noise(0.7, 0.7, 5)); add(11.8, slide(200, 60, 0.5, 0.4))          # byurr 2
for k in range(5): add(13.2 + k * 0.12, slide(500 + (k % 2) * 200, 380, 0.08, 0.2, 'sq'))   # nyam
add(13.2, slide(300, 900, 0.3, 0.2))                                        # chicken leap
add(14.3, slide(500, 700, 0.5, 0.15))                                       # huh?
add(15.8, slide(60, 130, 0.6, 0.5))                                         # bullfrog rises
for k in range(7): add(16.1 + k * 0.09, slide(90 + (k % 2) * 25, 60, 0.14, 0.55))   # KROAAAK
add(16.1, noise(0.9, 0.2, 2))
add(16.6, noise(0.5, 0.7, 5)); add(16.6, slide(900, 2200, 0.35, 0.25, 'sq'))  # squawk
add(17.0, slide(1800, 800, 0.5, 0.25, 'sq'))
add(19.0, slide(300, 900, 0.3, 0.2)); add(19.8, tri(150, 0.2, 0.5))         # hop onto big frog
add(21.0, noise(0.12, 0.6, 8)); add(21.0, slide(700, 200, 0.2, 0.3))        # hap
add(21.55, slide(500, 150, 0.6, 0.25, 'sq'))                                # aduh
for k, m in enumerate([67, 72, 76, 79]): add(22.4 + k * 0.17, square(mf(m), 0.4, 0.14, 0.5, 0.3))

mix = np.tanh(mix * 1.1) * 0.85
fade = np.ones(N); fade[-int(SR * 0.8):] = np.linspace(1, 0, int(SR * 0.8)); mix *= fade
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32000).astype('<i2').tobytes())
