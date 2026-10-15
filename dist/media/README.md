# BEYOND media assets

Stage 2 accepts these optional local files:

- `clip1.mp4` — existing hero background
- `nebula-flow.mp4` — optional local Google Flow nebula background video
- `nebula-poster.svg` — fallback poster used before `nebula-flow.mp4` exists

The journey never requests a remote video URL. If `nebula-flow.mp4` is not present,
the layered CSS nebula remains visible behind the poster/video layer. Add future
videos to this folder without loading them into the page until their scene is reached.
