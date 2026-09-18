# TinyCore-in-browser — working prototype

## What's real vs. what you need to drop in

Everything in this bundle except two files was pulled and verified for real,
inside a sandboxed build environment that only has network access to package
registries (npm, PyPI, GitHub) — not to tinycorelinux.net or its mirrors. So:

**Verified and included:**
- `v86/libv86.js` + `v86/v86.wasm` — the actual v86 runtime, pulled straight
  from the `v86` npm package (currently `0.5.461`, BSD-2-Clause). Not a CDN
  reference — vendored locally so it doesn't depend on anyone else's uptime.
- `bios/seabios.bin` + `bios/vgabios.bin` — the real BIOS binaries v86 needs
  to boot anything, pulled from the official `copy/v86` repo.
- `index.html` — wired against v86's **actual current TypeScript API**
  (`v86.d.ts` from the same npm package), not older `V86Starter`-era examples
  you'll find scattered across forks and blog posts.

**Not included — the one piece I couldn't reach from here:**
- `tinycore/vmlinuz` and `tinycore/core.gz` — TinyCore's official host
  wasn't reachable from my build sandbox (network allowlist reasons on my
  end, not a real block on yours). Grab them yourself, it's two files:

```bash
cd tinycore/
curl -LO https://distro.ibiblio.org/tinycorelinux/16.x/x86/release/distribution_files/vmlinuz
curl -LO https://distro.ibiblio.org/tinycorelinux/16.x/x86/release/distribution_files/core.gz
```

Check tinycorelinux.net/downloads.html first — swap `16.x` for whatever the
current release branch is by the time you read this (TinyCore ships roughly
yearly; 16.1 was current as of mid-2025, with a 17.0 line in testing since
early 2026). Grab the **Core** edition specifically, not `TinyCore` or
`CorePlus` — those are the GUI and installer variants.

## Run it

Needs to be served over HTTP, not opened as `file://` — v86 loads everything
via XHR and most browsers block that against the local filesystem.

```bash
cd tinycore-portfolio/
python3 -m http.server 8000
# open http://localhost:8000
```

## What I could not verify from this sandbox

I wired the `V86` constructor call against the real, current `.d.ts` — options,
types, and defaults are accurate as of v86 `0.5.461`. What I have **not** seen
with my own eyes is an actual boot to a shell prompt, because that needs the
two TinyCore files this sandbox couldn't reach. Two things to sanity-check on
your first real run once they're in place:

1. **`memory_size: 32MB`** — should be enough for Core with zero extensions,
   but if the kernel stalls or panics on boot, bump it to 64MB before
   debugging anything else.
2. **No `cmdline` set** — Core has no X11 to accidentally launch, so this
   should land you straight at a console login. If it doesn't, check v86's
   `docs/` for kernel cmdline flags other Linux demos use.

## Where this diverges from the earlier plan (intentionally, for now)

- **No boot-button lazy-load of the *page* itself** — the button still gates
  emulator startup (nothing loads until clicked), but I haven't wired
  dynamic `import()`/script-injection to defer fetching `libv86.js` itself.
  Trivial to add once you're integrating this into the real portfolio build.
- **No iframe isolation** — this is a standalone page so you can test it in
  isolation first. Wrap it in an `<iframe sandbox="allow-scripts">` when it
  moves into the actual site, per the earlier plan.
