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
