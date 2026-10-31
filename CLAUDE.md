# Gradient Studio

A gradient maker in one self-contained page: Soft, Flow and Sky styles drawn
with WebGL, presets per style, saved sessions (localStorage), a keyframe
timeline and MP4/WebM recording. Marilyn opens `index.html` by double-click
from disk — no server, no launcher, no dependencies. Keep it that way.

## Edit `src/`, never `index.html`

`index.html` is built. The sources are:

- `src/page.html` — the page markup, with `@@ css/…` / `@@ js/…` lines where each piece goes
- `src/css/NN-*.css` — styles, in page order
- `src/js/NN-*.js` — the script, in page order. All pieces join into **one**
  classic `<script>` and share one top-level scope; order matters and boot runs
  last. They are not modules.

After any change to `src/`, rebuild and test:

```bash
node scripts/build.mjs
node --test tests/*.test.mjs
```

The build refuses to overwrite an `index.html` that was edited by hand; move
the edit into `src/` (or pass `--force` to discard it). A new piece needs a
`@@` line in `src/page.html` — the build fails on a file it does not include.

## Rules

- Docs change with the code. Adding, removing, renaming or repurposing a file
  in `src/` means updating its line in `ARCHITECTURE.md` in the same commit —
  the test fails otherwise.
- Git history is the version record. Don't copy the page into a new
  `gradient-studio-vN.html`; commit instead. The old `gradient-studio-v4…v8.html`
  files are frozen snapshots — leave them alone (only v4–v6 are tracked).
- `.gitignore` ignores everything by default (licensed fonts, brand assets);
  new tracked paths must be allowlisted there.
- Don't merge, push or deploy without Marilyn's OK.
