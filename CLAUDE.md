# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Everafter (永愛) is a static marketing site for a wedding-ceremony emcee ("사회") service, deployed via GitHub Pages. There is no build system, package manager, or framework — just hand-written HTML/CSS/JS served directly.

## Development

There is no build/lint/test tooling in this repo. To preview locally, serve the directory with any static file server and open in a browser, e.g.:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html`. Changes to `.html`, `.css`, or `.js` are reflected on refresh — no compilation step.

## Deployment

Deployed via GitHub Pages directly from the `main` branch, root folder (`Settings → Pages → Deploy from a branch → main /(root)`). All links must stay relative so the site works both locally and on Pages.

**Every commit on `main` auto-pushes to `origin/main`** via a local `post-commit` git hook (`.git/hooks/post-commit`, not tracked by git — machine-local only). There is no staging branch or review step: whatever is committed goes live on GitHub Pages within about a minute. Practical implications:

- Verify a change actually works (see Development above) *before* committing — don't commit half-finished work as a checkpoint.
- Never use `git commit --amend` or history rewrites on `main` here; the hook only fires on new commits, and rewriting history after it already pushed will fight with the remote.
- If working from a machine without this hook installed, push manually after committing.

## Architecture

- `index.html` — main landing page (hero + story sections)
- `ask.html` — inquiry/contact form page
- `review.html` — client testimonials page
- `style.css` — single shared stylesheet for all pages
- `script.js` — single shared script for all pages
- Image assets (`hero-tulip.png`, `ocean.jpeg`, `pond.jpeg`) — **note: these currently live at the repo root, but all HTML `<img>` tags reference them via an `assets/` prefix (e.g. `src="assets/hero-tulip.png"`), which does not exist.** Be aware of this mismatch when touching images — either the markup or the file locations need to agree.

### Shared page structure

Every page follows the same skeleton: a fixed `.site-header` with the `EVERAFTER` brand mark and a `.site-nav` (mobile nav toggled via `.menu-toggle` / `#site-nav.open`), a `<main>`, and a shared `<footer>`. `index.html` is the full scrolling one-pager; `ask.html` and `review.html` are subpages using the `.subpage` body class and header variants (`solid-header`, `light-header`).

### `script.js` behaviors (shared across all pages, guarded by element existence checks)

- **Progress label** (`index.html` only): an `IntersectionObserver` watches `[data-progress]` sections and updates `#progressCopy` text to reflect the most visible section.
- **Reveal-on-scroll**: any element with class `.reveal` gets `.visible` added via `IntersectionObserver` once it enters the viewport (fade/slide-in), then unobserves itself.
- **Image zoom-on-scroll**: `.image-zoom` elements toggle `.is-visible` based on intersection, driving a CSS scale transition.
- **Parallax**: `updateParallax()` runs on scroll to shift `.parallax-media` and scale/fade the `.hero-media`/`.hero-copy` on `index.html`. Respects `prefers-reduced-motion`.
- **Mobile nav toggle**: click handling for `.menu-toggle` / `#site-nav`.
- **Inquiry form** (`ask.html`): on submit, builds a plain-text summary of the form fields and copies it to the clipboard via `navigator.clipboard.writeText` (no backend — the user is expected to paste it into KakaoTalk/DM). Falls back to an error message if clipboard access fails.

### `style.css` conventions

- CSS custom properties in `:root` define the palette (`--ivory`, `--charcoal`, `--burgundy`, etc.) and font stacks (`--serif-en` = Cormorant Garamond, `--serif-ko` = Noto Serif KR, `--sans` = Noto Sans KR). Reuse these variables rather than hardcoding colors/fonts.
- Fonts are loaded from Google Fonts via `<link>` tags in each page's `<head>`.
- Single stylesheet covers desktop-first styles with breakpoints at `901px`, `900px`, and `600px` (mobile overrides are additive, layered at the bottom of the file — "Multi-page additions" section covers `ask.html`/`review.html`-specific styles).
- All body text is Korean-first (`word-break:keep-all`), with English/serif accents for eyebrow labels and numerals.
