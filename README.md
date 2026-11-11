# Rolling Sink

An anonymous page containing 23 complete videos and their input prompts. Prompts are always visible. Videos autoplay silently when visible and pause offscreen; manually paused videos remain paused.

The site has no build dependencies, third-party scripts, or analytics.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` to preview.

- `index.html`: videos and complete prompts.
- `assets/style.css`: responsive layout.
- `assets/app.js`: viewport loading and autoplay.
- `assets/nojs.css`: native video fallback when JavaScript is disabled.
- `assets/posters/`: preview frames.
- `videos.json`: catalog and video checksums.

The video image data, frame timing, and duration are preserved. MP4 headers have been moved to the start for seeking, and creation metadata has been removed. Media URLs and filenames use anonymous paths. Keep account credentials and private source-provenance records outside this repository.
