"""Original CodeQuest area music: five loops in the Orbit sound family (electric piano, pads, soft bass). No samples or third-party music.
Usage: python3 scripts/compose-area-loops.py OUTDIR   -> writes loop-<name>.wav files; encode with ffmpeg (see docs/music.md)."""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
from pathlib import Path
SR = 44100
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(t, d, a=.02, r=.3): return np.minimum(t / max(a, .001), 1) * np.minimum(np.maximum(d - t, 0) / max(r, .001), 1)
def pad(m, d):
    t = np.arange(int(d * SR)) / SR; f = hz(m); out = []
    for side in [-1, 1]:
        x = sum(np.sin(2 * np.pi * f * (1 + side * .0015 + k * .0006) * t + k * .7) / 5 for k in [-2, -1, 0, 1, 2])
        x += .17 * np.sin(2 * np.pi * f * 2 * t + .1 * np.sin(t * 2)) + .045 * np.sin(2 * np.pi * f * 3 * t)
        out.append(x * env(t, d, .65, .8) * (.88 + .12 * np.sin(t * 1.2 + side)))
    return np.stack(out, axis=1)
def keys(m, d, decay=2.5):
    t = np.arange(int(d * SR)) / SR; f = hz(m)
    mod = 2.2 * np.exp(-t * 3) * np.sin(2 * np.pi * f * 2 * t)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * decay) + .12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 6)
    return x * env(t, d, .006, .15)
def bell(m, d):
    t = np.arange(int(d * SR)) / SR; f = hz(m)
    x = (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4) + .25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)) * np.exp(-t * 2.2)
    return x * env(t, d, .003, .2)
def lead(m, d):
    t = np.arange(int(d * SR)) / SR; f = hz(m)
    phase = 2 * np.pi * f * t + .025 * np.sin(2 * np.pi * 4.7 * t)
    x = np.sin(phase) + .22 * np.sin(2 * phase) * np.exp(-t * 3) + .07 * np.sin(3 * phase)
    return x * env(t, d, .035, .18) * (.65 + .35 * np.exp(-t * 2))
def bass(m, d):
    t = np.arange(int(d * SR)) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .15 * np.sin(2 * np.pi * f * 2 * t)) * env(t, d, .015, .1) * np.exp(-t * .8)
def kick():
    t = np.arange(int(.36 * SR)) / SR
    return np.sin(2 * np.pi * (45 * t + 70 * .028 * (1 - np.exp(-t / .028)))) * np.exp(-t * 15) * env(t, .36, .003, .025)
def noise(rng, d, cut, decay):
    t = np.arange(int(d * SR)) / SR; x = rng.normal(0, 1, len(t))
    x = signal.sosfilt(signal.butter(2, cut, fs=SR, btype='highpass', output='sos'), x)
    return x * np.exp(-t * decay) * env(t, d, .002, .02)

def compose(name, bpm, chords, roots, phrases, *, bars=16, seed=1, pad_lvl=.032, keys_pat=None, keys_lvl=.065, keys_oct=12, bass_lvl=.15,
            drums=0.0, hats=0.0, lead_lvl=.09, lead_from=0, bells=None, bell_lvl=.05, delay=.18, four_floor=False, seed_note=0):
    rng = np.random.default_rng(seed); beat = 60 / bpm; bar = 4 * beat; length = bars * bar + 4
    mix = np.zeros((int(length * SR), 2))
    def put(x, start, level=1, pan=0):
        i = int(start * SR); n = min(len(x), len(mix) - i)
        if n <= 0: return
        p = (pan + 1) * np.pi / 4
        if x.ndim == 1: mix[i:i + n, 0] += x[:n] * level * np.cos(p); mix[i:i + n, 1] += x[:n] * level * np.sin(p)
        else: mix[i:i + n] += x[:n] * level
    steps = len(keys_pat) if keys_pat else 0
    for b in range(bars):
        s = b * bar; c = chords[b % len(chords)]
        if pad_lvl:
            for m in c: put(pad(m, bar + .6), s, pad_lvl)
        for k in range(steps):
            idx = keys_pat[k]
            if idx is None: continue
            put(keys(c[idx % len(c)] + keys_oct, bar / steps * 1.7), s + k * bar / steps, keys_lvl, (-1 if k % 2 else 1) * .36)
        if bass_lvl:
            for off, d in [(0, 1.3), (1.5, .4), (2, 1.3), (3.5, .4)] if drums < 1 else [(0, .9), (1, .9), (2, .9), (3, .9)]:
                put(bass(roots[b % len(roots)], d * beat), s + off * beat, bass_lvl)
        if drums:
            offs = [0, 1, 2, 3] if four_floor else ([0, 2, 2.75] if b % 2 else [0, 1.5, 2])
            for off in offs: put(kick(), s + off * beat, .2 * drums)
            for off in [1, 3]: put(noise(rng, .19, 1400, 28), s + off * beat, .045 * drums, .08)
        if hats:
            for k in range(8): put(noise(rng, .06, 7000, 80), s + (k * .5 + (.025 if k % 2 else 0)) * beat, hats * (1.5 if k % 2 else 1), (-1 if k % 2 else 1) * .5)
        if lead_lvl and b >= lead_from:
            for off, m, d in phrases[(b - lead_from) % len(phrases)]:
                put(lead(m, d * beat + .18), s + off * beat, lead_lvl, -.08)
        if bells and b % bells[0] == bells[0] - 1:
            for off, m in bells[1]: put(bell(m, 1.6), s + off * beat, bell_lvl, .6 if m % 2 else -.6)
    dry = mix.copy()
    for sec, g, sw in [(beat * .75, delay, True), (beat * 1.5, delay / 2, False), (.071, .09, True), (.113, .07, False), (.173, .05, True), (.257, .04, False), (.389, .035, True)]:
        n = int(sec * SR); mix[n:] += dry[:-n, ::-1] * g if sw else dry[:-n] * g
    mix = signal.sosfilt(signal.butter(2, 32, fs=SR, btype='highpass', output='sos'), mix, axis=0)
    mix = np.tanh(mix * 1.15)
    period = int(bars * bar * SR); tail = mix[period:].copy(); mix = mix[:period]; mix[:len(tail)] += tail
    diff = mix[-1] - mix[0]; n = 256; mix[-n:] -= np.linspace(0, 1, n)[:, None] * diff
    mix *= .88 / max(np.max(np.abs(mix)), .001)
    return mix, len(mix) / SR

LOOPS = {
 # home, dashboard, achievements: bright major, light groove
 "home": dict(bpm=110, chords=[[48, 55, 59, 64, 67], [43, 50, 55, 59, 62], [45, 52, 55, 60, 64], [41, 48, 53, 57, 60]], roots=[36, 31, 33, 29],
              phrases=[[(0, 76, .7), (1, 79, .45), (1.75, 83, .8), (3, 79, .7)], [(.25, 81, .5), (1, 79, .6), (2, 76, .45), (2.75, 72, .9)], [(0, 76, .65), (1, 72, .4), (1.75, 76, .8), (3, 79, .6)], [(0, 77, .5), (1, 74, .5), (2, 72, 1.6)]],
              keys_pat=[0, 2, 3, 1, 4, 3, 2, 4], drums=.8, hats=.012, seed=11, lead_from=2, bells=(4, [(2.5, 88), (3.25, 84)])),
 # map and lessons: slow, calm, no drums, long pads, sparse piano
 "lesson": dict(bpm=80, chords=[[50, 57, 60, 64, 69], [46, 53, 57, 62, 65], [41, 48, 52, 57, 60], [48, 55, 59, 64, 67]], roots=[38, 34, 29, 36],
                phrases=[[(0, 72, 1.5), (2, 76, 1.5)], [(0, 74, 1.2), (2.5, 72, 1.2)], [(0, 69, 2), (3, 72, .9)], [(0, 71, 1.5), (2, 67, 2)]],
                keys_pat=[0, None, 2, None, 3, None, 1, None], keys_lvl=.05, drums=0, hats=0, bass_lvl=.11, pad_lvl=.04, lead_lvl=.055, lead_from=4, delay=.22, seed=22),
 # games: faster, playful arpeggios and four on the floor
 "games": dict(bpm=126, chords=[[52, 59, 62, 67, 71], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [50, 57, 62, 66, 69]], roots=[40, 36, 31, 38],
               phrases=[[(0, 79, .5), (.5, 83, .5), (1, 86, .75), (2, 83, .5), (2.5, 79, .5), (3, 76, .9)], [(0, 74, .5), (.5, 79, .5), (1, 83, .75), (2, 86, .5), (2.5, 83, .5), (3, 79, .9)], [(0, 76, .5), (.5, 79, .5), (1, 83, .5), (1.5, 88, .75), (3, 86, .9)], [(0, 83, .5), (.5, 79, .5), (1, 76, .5), (1.5, 79, .5), (2, 74, 1.6)]],
               keys_pat=[0, 2, 3, 2, 4, 2, 3, 2, 0, 2, 3, 2, 4, 3, 2, 1], keys_lvl=.05, drums=.9, hats=.016, four_floor=True, bass_lvl=.13, lead_lvl=.085, lead_from=2, seed=33),
 # exams and quizzes: quiet, minimal, nothing that competes with reading
 "exam": dict(bpm=68, chords=[[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]], roots=[33, 29, 36, 31],
              phrases=[[(1, 76, 2)], [(0, 72, 2.5)], [(2, 69, 1.5)], [(0, 71, 3)]], keys_pat=[0, None, None, None, 3, None, None, None], keys_lvl=.04, drums=0, hats=0,
              bass_lvl=.07, pad_lvl=.034, lead_lvl=.035, lead_from=4, delay=.2, seed=44),
 # shop and rewards: sparkly, bell arpeggios, soft pulse
 "shop": dict(bpm=100, chords=[[43, 50, 54, 59, 62], [42, 50, 54, 57, 62], [40, 47, 52, 59, 62], [48, 55, 59, 62, 66]], roots=[31, 30, 28, 36],
              phrases=[[(0, 83, .5), (.5, 86, .5), (1, 90, .8), (2, 86, .5), (2.5, 83, .5), (3, 79, .9)], [(0, 81, .5), (.5, 83, .5), (1, 86, .8), (2, 83, .5), (3, 78, 1)], [(0, 79, .5), (.5, 83, .5), (1, 86, .8), (2, 90, 1.2)], [(0, 88, .5), (1, 86, .5), (2, 83, 1.6)]],
              keys_pat=[0, 2, 4, 3, 2, 3, 4, 2], keys_lvl=.055, drums=.5, hats=.009, bass_lvl=.12, lead_lvl=.07, lead_from=2, bells=(2, [(1.5, 95), (2.25, 91), (3, 98)]), bell_lvl=.04, seed=55),
}
if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "."); out.mkdir(parents=True, exist_ok=True)
    for name, cfg in LOOPS.items():
        mix, secs = compose(name, **cfg)
        wavfile.write(str(out / f"loop-{name}.wav"), SR, (mix * 32767).astype(np.int16))
        print(f"{name}: {secs:.1f}s, {cfg['bpm']} BPM")
