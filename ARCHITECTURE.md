# Architecture

`node scripts/build.mjs` pastes every piece below into `src/page.html` at its
`@@` line and writes `index.html`. Pieces keep the original file's order; the
number prefix is that order. `tests/docs-map.test.mjs` checks that every file
in `src/` is listed here and that `index.html` matches a fresh build.

## Page

| File | Owns |
|---|---|
| `src/page.html` | Head (fonts, title), the rail, stage, timeline and toast markup; `@@` include lines for every piece |

## Styles — `src/css/`

| File | Owns |
|---|---|
| `src/css/01-base.css` | Theme tokens (dark and light), reset, base button/input, app grid |
| `src/css/02-rail.css` | The control rail: head, scrolling body, groups, icon buttons, seed readout |
| `src/css/03-segmented.css` | Segmented controls |
| `src/css/04-colour-tiles.css` | Colour tiles, the inline HSB picker and pipette, add button, ramp, and the slider rows (`.ctl`) |
| `src/css/05-dial.css` | Direction dial, plus the shared `.btn` styles and export grid |
| `src/css/06-stage.css` | Stage, pannable canvas wrap, card, size label |
| `src/css/07-zoom-pill.css` | Zoom pill under the card; also the content overlay, toast, preset chips, disabled buttons (the original file kept them here) |
| `src/css/08-sessions.css` | Saved-sessions list and the length row |
| `src/css/09-timeline.css` | Timeline panel, track, keys, playhead; the "recording" lock on the controls; touch tweaks |

## Script — `src/js/` (one shared scope, runs top to bottom)

| File | Owns |
|---|---|
| `src/js/01-colour-core.js` | `clamp`, hex ⇄ sRGB ⇄ Oklab ⇄ OKLCH, gamut mapping (`hex2lch`, `lch2hex`) |
| `src/js/02-colour-generation.js` | Tone families and the palette built from the chosen colours |
| `src/js/03-layout.js` | Seeded random (`mulberry32`) and where the soft-style colour points sit |
| `src/js/04-soft-shader.js` | Soft-style GLSL: field, grain, hatch, bloom (`VS`, `FS`, `HATCH_GLSL`) |
| `src/js/05-flow-shader.js` | Flow/Sky GLSL and the standalone `flowProgram` / `flowQuad` / `flowDraw` (also copied into the embed snippet) |
| `src/js/06-gl-context.js` | The WebGL context, uniforms, the flow program, `MAXBUF` |
| `src/js/07-state-presets.js` | `DEFAULTS`, the presets for every style, per-style look keys, live state `S` |
| `src/js/08-theme.js` | Light/dark toggle |
| `src/js/09-sliders.js` | Slider specs and `makeSlider` for every rail slider |
| `src/js/10-dial.js` | Direction dial drag and paint |
| `src/js/11-colour-tiles.js` | Colour tiles with the in-place HSB picker and pipette, add colour, paste hex list |
| `src/js/12-mode-style-presets.js` | One/several colours mode, Soft/Flow/Sky switch, preset chips |
| `src/js/13-playback.js` | Animation loop (`frame`), play/pause, clocks |
| `src/js/14-grain-type.js` | Grain type segmented control |
| `src/js/15-format-size.js` | Aspect ratios, exact pixel size, the zoom pill |
| `src/js/16-seed-shuffle-reset.js` | Seed readout, shuffle, content overlay toggle, `applyState`, Reset with undo |
| `src/js/17-render.js` | `currentStops`, flow params, `render`, `build` / `rebuildLight` |
| `src/js/18-canvas-view.js` | Fit and backing-store sizing (`resize`), wheel zoom, drag pan, click/double-click zoom |
| `src/js/19-export.js` | `toast`, PNG download, copy CSS, copy live embed code |
| `src/js/20-timeline-model.js` | Timeline state, tween lists, easing, Oklab colour mixing, `evalAt`, flow time |
| `src/js/21-timeline-ui.js` | Playhead/seek, auto-keying, track render and drag, length, copy/paste/delete keys |
| `src/js/22-sessions.js` | Saved sessions in localStorage (`gs-sessions`): save, save as new, load with undo, dirty dot |
| `src/js/23-video.js` | Video row and MP4/WebM recording with MediaRecorder |
| `src/js/24-keys-boot.js` | Copy hex, keyboard shortcuts (R, T, space), boot calls |

## Other files

| File | Owns |
|---|---|
| `index.html` | Built output — the page Marilyn opens. Don't edit |
| `scripts/build.mjs` | The build (`--check`, `--force`) |
| `scripts/.built.json` | sha256 of the last build, for the hand-edit guard |
| `tests/docs-map.test.mjs` | Map and freshness test |
| `gradient-studio-v4…v8.html` | Frozen older versions; new versions go in git, not new files |
