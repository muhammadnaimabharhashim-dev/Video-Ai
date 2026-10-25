# Video-Ai: Kucing Kejar Anjing

Video animasi kartun lucu (25 detik, 1280x720, 30fps, dengan musik & efek suara).

- `output/kucing-kejar-anjing.mp4` – hasil akhir
- `animation/index.html` – animasi (canvas); buka di browser untuk pratinjau langsung
- `tools/render.js` – render frame demi frame dengan Playwright
- `tools/audio.py` – sintesis musik/SFX (numpy)

Bangun ulang:
```
node tools/render.js frames 30
python3 tools/audio.py frames/events.json audio.wav
ffmpeg -framerate 30 -i frames/f%05d.png -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest output/kucing-kejar-anjing.mp4
```

## Video 2: Ayam vs Katak

- `output/ayam-vs-katak.mp4` – hasil akhir (25 detik)
- `animation/ayam-katak.html` – animasinya; `tools/audio_ayam.py` – musik/SFX-nya

```
node tools/render.js frames 30 - animation/ayam-katak.html
python3 tools/audio_ayam.py audio.wav
ffmpeg -framerate 30 -i frames/f%05d.png -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest output/ayam-vs-katak.mp4
```

## Video 4: Pak Mat dan Ayam (watak lelaki bercakap)

Watak lelaki di skrin yang bercakap dengan suara TTS luar talian (espeak-ng, suara robot bahasa Melayu). Mulutnya bergerak mengikut amplitud suara.

- `output/pak-mat-dan-ayam.mp4` – hasil akhir (39 saat)
- `animation/pak-mat.html` – animasi; `tools/tts.py` – pembungkus TTS; `tools/audio_pakmat.py` – suara + muzik + SFX, dan `mouth.json`
- Skrip suara ada dalam senarai `LINES` pada `tools/audio_pakmat.py` dan `animation/pak-mat.html` (kedua-duanya mesti sama)

```
pip install espeakng-loader numpy
python3 tools/audio_pakmat.py audio.wav mouth.json
MOUTH_JSON=mouth.json node tools/render.js frames 30 - animation/pak-mat.html
ffmpeg -framerate 30 -i frames/f%05d.png -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest output/pak-mat-dan-ayam.mp4
```
