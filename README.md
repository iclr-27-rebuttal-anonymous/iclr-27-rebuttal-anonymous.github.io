# Rolling Sink: Anonymous Video Supplement

Supplementary videos for the ICLR 2027 rebuttal.

The gallery contains 23 complete five-minute videos with their input prompts. Each player includes shortcuts to 00:00, 02:30, and 04:50. Search covers both video titles and prompts.

This is a static site with no build dependencies, third-party scripts, analytics, or embedded social-media players.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` to preview.

- `index.html`: page and accessible video cards, including the complete prompts.
- `assets/style.css` and `assets/app.js`: layout, search, filters, and video viewer.
- `assets/posters/`: frames sampled from the corresponding videos.
- `videos.json`: video catalog, complete prompts, and checksums of the delivered MP4 files.

The video image data, frame timing, and duration are preserved. MP4 headers have been moved to the start for seeking, and creation metadata has been removed. Media URLs and filenames use anonymous paths. Keep account credentials and private source-provenance records outside this repository.
