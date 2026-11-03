"""Procedural sound design for cinematic/index.html (ambience, score, foley synced to events.json).
Usage: audio_cinematic.py events.json out.wav"""
import sys, json, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
E = json.load(open(sys.argv[1]))
DUR = E['dur'] + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(11)
t_ax = np.arange(N) / SR

def sos(kind, fc, order=2):
    return butter(order, fc, btype=kind, fs=SR, output='sos')
def lp(x, fc, o=2): return sosfilt(sos('low', fc, o), x)
def hp(x, fc, o=2): return sosfilt(sos('high', fc, o), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def env_ad(n, a, d): t = np.arange(n) / SR; return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / max(d, 1e-4))
def mono(n): return np.zeros(n)
def put(bus, t0, x, gain=1.0):
    i = int(t0 * SR)
    if i < 0 or i >= len(bus): return
    j = min(len(bus), i + len(x)); bus[i:j] += x[:j - i] * gain
def smooth(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

amb, music, sfx = mono(N), mono(N), mono(N)
ambR = mono(N)

# ---------------- ambience ----------------
w = lp(noise(N), 500, 2); w *= 0.55 + 0.45 * np.sin(2 * np.pi * t_ax / 7.3 + 1) * np.sin(2 * np.pi * t_ax / 3.1)
amb += w * 0.16
ambR += lp(noise(N), 500, 2) * (0.55 + 0.45 * np.sin(2 * np.pi * t_ax / 6.1)) * 0.16
grass = hp(noise(N), 3500) * (0.5 + 0.5 * np.sin(2 * np.pi * t_ax / 2.3)) * 0.012; amb += grass; ambR += hp(noise(N), 3500) * 0.01
cic = bp(noise(N), 4200, 5200) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 36 * t_ax))) * (0.5 + 0.5 * np.sin(2 * np.pi * t_ax / 5.0)); amb += cic * 0.012
for k in range(34):                                    # birds
    t0 = rng.uniform(0.3, DUR - 1); n = int(0.18 * SR); tt = np.arange(n) / SR
    f = rng.uniform(2200, 4200) * (1 + 0.35 * np.sin(2 * np.pi * rng.uniform(8, 18) * tt)) * (1 + 0.4 * tt)
    for rep in range(rng.integers(1, 4)):
        put(amb, t0 + rep * 0.22, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(n) * 0.028)

# ---------------- score ----------------
def pad(freqs, t0, dur, gain=0.1):
    n = int(dur * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph = 2 * np.pi * f * (1 + det) * tt
            out += (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph))
    out = lp(out, 1400) * np.minimum(tt / 1.2, 1) * np.minimum((dur - tt) / 1.0, 1) * gain / len(freqs)
    put(music, t0, out)
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]]
tcur = 0.0; ci = 0
while tcur < E['dur'] + 1:
    pad([mid(m) for m in chords[ci % 4]], tcur, 4.2, 0.17); tcur += 4.0; ci += 1
# chase percussion (taiko-ish) + pulse
bpm = 142; beat = 60 / bpm
def kick(t0, g=1.0):
    n = int(0.35 * SR); tt = np.arange(n) / SR; f = 55 + 85 * np.exp(-tt * 28)
    put(music, t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * 0.9 * g)
def snare(t0, g=1.0):
    n = int(0.22 * SR); tt = np.arange(n) / SR
    put(music, t0, (bp(noise(n), 1200, 6000) * np.exp(-tt * 22) * 0.5 + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 28) * 0.4) * g)
def hat(t0, g=1.0):
    n = int(0.05 * SR); put(music, t0, hp(noise(n), 7000) * np.exp(-np.arange(n) / SR * 80) * 0.22 * g)
def tom(t0, g=1.0):
    n = int(0.5 * SR); tt = np.arange(n) / SR; f = 75 + 40 * np.exp(-tt * 12)
    put(music, t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6) * 0.8 * g)
t0 = E['leap'] + 0.2
k = 0
while t0 < E['stop'] + 0.2:
    bt = k % 8
    if bt in (0, 3, 4): kick(t0)
    if bt in (2, 6): snare(t0, 0.9)
    if bt in (1, 5, 7): tom(t0, 0.5)
    hat(t0, 0.6); hat(t0 + beat / 2, 0.35)
    t0 += beat; k += 1
# plucked ostinato (A minor pentatonic) during chase
pent = [57, 60, 62, 64, 67, 69, 67, 64]
t0 = E['cut'][2]; k = 0
while t0 < E['stop'] - 0.3:
    m = pent[(k * 3) % len(pent)] + (12 if k % 7 == 0 else 0); n = int(0.22 * SR); tt = np.arange(n) / SR
    put(music, t0, np.sin(2 * np.pi * mid(m) * tt + 1.2 * np.sin(2 * np.pi * mid(m) * 2 * tt) * np.exp(-tt * 18)) * np.exp(-tt * 12) * 0.16)
    t0 += beat / 2; k += 1
# riser into the chase
n = int((E['leap'] + 0.3 - 4.2) * SR); tt = np.arange(n) / SR
put(music, 4.2, lp(noise(n), 3000) * (tt / tt[-1]) ** 2.2 * 0.22)
put(music, 4.2, np.sin(2 * np.pi * np.cumsum(80 + 400 * (tt / tt[-1]) ** 2) / SR) * (tt / tt[-1]) ** 2 * 0.12)
# tension tail after the stop, then a warm resolution
n = int((E['take'] - E['stop']) * SR); tt = np.arange(n) / SR
put(music, E['stop'], np.sin(2 * np.pi * 55 * tt) * 0.12 * np.minimum(tt, 1) + np.sin(2 * np.pi * 58.3 * tt) * 0.09 * np.minimum(tt, 1))
for k, tk in enumerate(np.arange(E['stop'] + 0.5, E['drop'] - 0.2, 0.9)):
    n2 = int(0.05 * SR); put(music, tk, np.sin(2 * np.pi * 1800 * np.arange(n2) / SR) * np.exp(-np.arange(n2) / SR * 90) * 0.05)
pad([mid(m) for m in [48, 55, 60, 64, 67]], E['take'] - 0.2, 6.5, 0.2)
for k, m in enumerate([76, 79, 81, 79, 76, 72]):       # soft celesta-like closing motif
    n = int(1.2 * SR); tt = np.arange(n) / SR
    put(music, E['take'] + 0.8 + k * 0.55, (np.sin(2 * np.pi * mid(m) * tt) + 0.3 * np.sin(2 * np.pi * mid(m) * 4 * tt) * np.exp(-tt * 8)) * np.exp(-tt * 2.2) * 0.12)
# slow-motion: darken the music and push it down
slow_env = np.zeros(N)
for a, b in E['slow']: slow_env += smooth(a - 0.1, a + 0.15, t_ax) * (1 - smooth(b - 0.15, b + 0.1, t_ax))
music = music * (1 - 0.4 * slow_env) * 0 + (lp(music, 450) * slow_env * 0.9 + music * (1 - slow_env))

# ---------------- foley ----------------
def thud(t0, amp, cat=False, wood=False):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    if wood:
        x = bp(noise(n), 800, 2600) * np.exp(-tt * 70) * 0.5 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 50) * 0.3
    elif cat:
        x = bp(noise(n), 300, 1800) * np.exp(-tt * 90) * 0.35 + np.sin(2 * np.pi * 120 * tt) * np.exp(-tt * 60) * 0.2
    else:
        x = bp(noise(n), 200, 1600) * np.exp(-tt * 55) * 0.5 + np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 38) * 0.55
    put(sfx, t0, x, amp)
for tt_, a in E['dogSteps']: thud(tt_, 0.35 + 0.65 * a)
for tt_, a in E['catSteps']: thud(tt_, 0.25 + 0.5 * a, cat=True)
for tt_ in np.arange(0.5, 2.2, 0.42): thud(tt_, 0.5, wood=True)              # dog claws on the porch
for tt_ in np.arange(3.05, 3.95, 0.45): thud(tt_, 0.4, wood=True)
# sniffing + the snatch
for tt_ in np.arange(E['sniff'][0], E['sniff'][1], 0.22):
    n = int(0.12 * SR); put(sfx, tt_, bp(noise(n), 900, 3800) * np.hanning(n) * 0.2)
n = int(0.18 * SR); put(sfx, E['bite'], bp(noise(n), 500, 3500) * env_ad(n, 0.005, 0.05) * 0.8)
put(sfx, E['bite'] + 0.02, np.sin(2 * np.pi * 140 * np.arange(int(0.1 * SR)) / SR) * np.exp(-np.arange(int(0.1 * SR)) / SR * 40) * 0.5)
# cat purring, heartbeat, hiss
purr = bp(noise(N), 60, 260) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 24 * t_ax))) * (1 - smooth(3.4, 4.2, t_ax)) * 0.055 * (0.8 + 0.2 * np.sin(2 * np.pi * t_ax / 2.4)); sfx += purr
for k, tb in enumerate(np.arange(E['eyes'], E['cut'][1] - 0.1, 0.62 - 0.0 * 1)):
    n = int(0.22 * SR); tt = np.arange(n) / SR; amp = 0.4 + 0.5 * (tb - E['eyes']) / 2
    put(sfx, tb, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 20) * amp); put(sfx, tb + 0.19, np.sin(2 * np.pi * 48 * tt) * np.exp(-tt * 24) * amp * 0.7)
n = int(0.9 * SR); put(sfx, E['eyesOpen'] + 0.1, hp(noise(n), 3200) * env_ad(n, 0.12, 0.28) * 0.35)
# dog yelps + barks at the start of the chase
def bark(t0, g=1.0, pitch=1.0):
    n = int(0.22 * SR); tt = np.arange(n) / SR; f = pitch * (520 - 260 * tt / 0.22)
    src = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + noise(n) * 0.25
    put(sfx, t0, (bp(src, 500, 1100, 2) * 0.7 + bp(src, 1400, 2400, 2) * 0.35) * env_ad(n, 0.01, 0.08) * g)
bark(E['eyesOpen'] + 0.25, 1.2, 1.2); bark(E['cut'][1] + 0.2, 1.1, 1.15); bark(E['cut'][1] + 0.55, 1.0, 1.1)
# cat leap + whooshes
def whoosh(t0, dur, g=0.4, lo=300, hi=3000):
    n = int(dur * SR); tt = np.arange(n) / SR; x = noise(n); f = lo + (hi - lo) * np.sin(np.pi * tt / dur)
    out = np.zeros(n); b = 512
    for i in range(0, n, b): out[i:i + b] = bp(x[i:i + b], max(80, f[i] * 0.6), f[i] * 1.4, 1) if i + b <= n else 0
    put(sfx, t0, out * np.hanning(n) * g)
whoosh(E['leap'], 0.8, 0.9); whoosh(E['jump1'], 0.8, 0.7, 250, 1800); whoosh(E['jump2'], 0.9, 0.7, 250, 1800)
# hay crash
n = int(2.4 * SR); tt = np.arange(n) / SR
put(sfx, E['crash'], (noise(n) * np.exp(-tt * 3.2) * 0.5 + np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 7) * 0.9))
clicks = np.zeros(n)
for _ in range(220): clicks[int(rng.uniform(0, 2.2) ** 1.3 / 2.2 ** 0.3 * SR)] = rng.uniform(0.2, 1)
put(sfx, E['crash'], hp(sosfilt(sos('low', 6000), clicks), 800) * 0.6)
# cat yowl (meow) after the crash
def meow(t0, g=1.0, dur=0.9, f0=520):
    n = int(dur * SR); tt = np.arange(n) / SR; contour = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 0.8
    f = f0 * (0.8 + 0.7 * contour) * (1 + 0.02 * np.sin(2 * np.pi * 6 * tt)); ph = np.cumsum(f) / SR * 2 * np.pi
    src = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.35 * np.sin(3 * ph) + 0.2 * np.sin(4 * ph)
    form = bp(src, 700, 1300, 2) + 0.6 * bp(src, 1800, 2800, 2) + 0.3 * src
    put(sfx, t0, form * np.hanning(n) ** 0.5 * 0.22 * g)
meow(E['crash'] + 0.9, 1.0, 0.9, 500); meow(E['cut'][4] + 0.5, 0.7, 0.6, 600)
# puddle: splash, slide hiss, droplets, shake
n = int(1.6 * SR); tt = np.arange(n) / SR
put(sfx, E['puddle'] - 0.15, (bp(noise(n), 400, 6500) * env_ad(n, 0.02, 0.35) * 0.9 + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 9) * 0.5))
n = int((E['slideEnd'] - E['puddle']) * SR); tt = np.arange(n) / SR; put(sfx, E['puddle'], bp(noise(n), 600, 3500) * np.exp(-tt * 1.2) * 0.35)
for _ in range(34):
    tb = rng.uniform(E['puddle'] + 0.2, E['puddle'] + 3.5); n = int(0.07 * SR); tt = np.arange(n) / SR; f = rng.uniform(900, 2200)
    put(sfx, tb, np.sin(2 * np.pi * np.cumsum(f * (1 + 6 * tt)) / SR) * np.exp(-tt * 55) * 0.12)
n = int(0.7 * SR); tt = np.arange(n) / SR
put(sfx, E['shake'], (bp(noise(n), 1500, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 34 * tt))) * np.exp(-tt * 3) * 0.5 + hp(noise(n), 2500) * np.exp(-tt * 6) * 0.3))
# dog skid at the gate
n = int(2.0 * SR); tt = np.arange(n) / SR
put(sfx, E['stop'] - 2.0, bp(noise(n), 500, 2800) * (1 - tt / 2.0) * np.minimum(tt / 0.2, 1) * 0.35)
# cornered: dog whimper, cat growl, fish plop, sniff, bite, sigh
def whimper(t0, g=1.0):
    n = int(0.7 * SR); tt = np.arange(n) / SR; f = 900 - 450 * tt / 0.7 + 25 * np.sin(2 * np.pi * 9 * tt)
    ph = np.cumsum(f) / SR * 2 * np.pi; src = np.sin(ph) + 0.3 * np.sin(2 * ph)
    put(sfx, t0, bp(src, 500, 1600, 2) * np.hanning(n) * 0.28 * g)
for tk in (E['stop'] + 1.0, E['stop'] + 2.0, E['drop'] - 0.4): whimper(tk, 0.9)
n = int(2.2 * SR); tt = np.arange(n) / SR
put(sfx, E['stop'] + 0.2, lp(np.sign(np.sin(2 * np.pi * (95 + 8 * np.sin(2 * np.pi * 5 * tt)) * tt)) * 0.4 + noise(n) * 0.2, 380) * np.hanning(n) * 0.35)
n = int(0.25 * SR); tt = np.arange(n) / SR
put(sfx, E['drop'] + 0.28, np.sin(2 * np.pi * np.cumsum(350 - 220 * tt / 0.25) / SR) * np.exp(-tt * 18) * 0.5 + bp(noise(n), 300, 1800) * np.exp(-tt * 40) * 0.4)
for tb in (E['drop'] + 1.4, E['drop'] + 1.7, E['take'] - 0.6):
    n = int(0.13 * SR); put(sfx, tb, bp(noise(n), 900, 3800) * np.hanning(n) * 0.2)
n = int(0.25 * SR); put(sfx, E['take'], bp(noise(n), 600, 3200) * env_ad(n, 0.01, 0.06) * 0.7)
for k in range(5): n = int(0.1 * SR); put(sfx, E['take'] + 0.35 + k * 0.17, bp(noise(n), 700, 2600) * env_ad(n, 0.005, 0.03) * 0.3)
n = int(1.1 * SR); tt = np.arange(n) / SR; put(sfx, E['lie'], lp(noise(n), 900) * np.hanning(n) * 0.25 * np.sin(np.pi * tt / 1.1))

# ---------------- mix & master ----------------
L = amb * 1.0 + music * 0.9 + sfx * 0.9
R = ambR * 1.0 + music * 0.9 + sfx * 0.9
fade = np.ones(N); fade[:int(0.5 * SR)] = np.linspace(0, 1, int(0.5 * SR)); fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))
out = np.stack([np.tanh(L * 1.2) * fade, np.tanh(R * 1.2) * fade], 1); out = out / max(1e-6, np.abs(out).max()) * 0.9
with wave.open(sys.argv[2], 'wb') as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((out * 32767).astype('<i2').tobytes())
print('audio ok', len(out) / SR, 's')
