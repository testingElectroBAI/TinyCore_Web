# TinyCore_Web

Portfolio site of **Baibhab Das** (ElectroBAI) — a static, no-build page with a live
TinyCore Linux VM running in the browser via [v86](https://github.com/copy/v86)
(x86 → WebAssembly).

## Run locally

It must be served over HTTP (the VM fetches its wasm/BIOS/kernel files, which
does not work from `file://`). Any static server works:

```bash
python3 -m http.server 5501
# then open http://localhost:5501
```

The VS Code Live Server port is already set to `5501` in `.vscode/settings.json`.

## Project structure

```
TinyCore_Web/
├── index.html            markup only (sections are marked with comments)
├── assets/
│   └── letter-grid.svg   decorative background (loaded as an <img>)
├── css/                  loaded in this order — later files build on earlier ones
│   ├── base.css          reset, design tokens (:root), global element styles
│   ├── layout.css        nav, hero, buttons, hero terminal, section headers, footer
│   ├── sections.css      timeline, skills, GitHub repos + stats, contact,
│   │                     scroll animations, responsive (max-width: 768px) overrides
│   ├── loader.css        background layer and page loader
│   ├── tinycore.css      live VM widget
│   └── game.css          hidden "Module 6¾" game
├── js/                   plain deferred scripts, each a self-contained IIFE
│   ├── background.js     cursor/touch parallax for the background image
│   ├── animations.js     scroll-reveal observer + loader dismissal
│   ├── github.js         repo cards and stat counters from the GitHub API
│   ├── terminal.js       hero terminal CLI
│   ├── tinycore.js       lazy-loads v86 and boots the VM on click
│   └── game.js           hidden canvas game (footer `[ 6¾ ]` button)
├── v86/                  v86 emulator (libv86.js, v86.wasm, LICENSE-v86)
├── bios/                 seabios.bin, vgabios.bin
├── tinycore/             vmlinuz + custom_core.gz (custom TinyCore root filesystem)
└── terminal.svg          favicon
```

## Notes for editing

- **Script order matters.** `animations.js` must load before `github.js`: it
  creates the shared scroll observer and exposes it as `window.scrollObserver`,
  which `github.js` uses for the repo cards it adds after load. That is the only
  global the scripts create.
- **CSS order matters.** The files are split along the original cascade order, so
  keep the `<link>` order in `index.html`.
- **Asset paths are relative to `index.html`**, including the ones `tinycore.js`
  passes to v86 (`v86/`, `bios/`, `tinycore/`).
- **`#letterGrid`** is an `<img>`; `background.js` only sets its inline
  `width/height/left/top/transform`, so it works with any image source.

## Deployment

Configured for Vercel (`.vercelignore`, `/_vercel/insights/script.js`). It is a
static site — there is no build step.

## Licenses

v86 is BSD-2-Clause; see `v86/LICENSE-v86`.
