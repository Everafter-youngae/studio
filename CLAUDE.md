# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Everafter (永愛) is a static marketing site for a wedding-ceremony emcee ("사회") service, deployed via GitHub Pages. There is no build system, package manager, or framework — just hand-written HTML/CSS/JS served directly.

This repo is the public brand/landing site (hero, story, price, testimonials, inquiry form) plus a shareable one-page brand card. The client-facing tooling — MC script builder, couple questionnaire, script review, and post-ceremony "story" archive — lives in the sibling repo `Everafter-youngae/wedding-mc` (deployed at `everafter-youngae.github.io/wedding-mc/`), which is a separate codebase with its own visual language (functional/app-like, not the ivory/burgundy editorial look here) and its own CLAUDE.md. Don't assume shared components, styles, or data between the two repos.

The two repos now touch in three places, all loose couplings rather than shared code:

- This site's inquiry form writes to a Google Apps Script backend; wedding-mc's dashboard reads that same sheet to show new inquiries (see "Inquiry form" below).
- wedding-mc's dashboard has a 명함 보내기 action that hands out this repo's `/card/` URL.
- Footers here link out to wedding-mc's `story.html`, and wedding-mc links back to this homepage.

## Development

No build/lint/test tooling. Serve the directory and open a browser:

```
python3 -m http.server 8000
```

Changes to `.html`, `.css`, `.js` are reflected on refresh.

### Verifying UI changes

The Chrome browser extension is unreliable here — it intermittently refuses localhost ("Could not verify this site's safety category"), and when the Chrome window is backgrounded `document.visibilityState` goes `"hidden"`, which blanks screenshots *and* suspends IntersectionObserver, so scroll-reveal animations appear broken when they are fine. Both have caused real time to be wasted chasing non-bugs.

Headless Playwright avoids all of it and is available from the npx cache:

```
cd ~/.npm/_npx/db89d7302a373f10   # has playwright + playwright-core
node -e "const {chromium}=require('playwright'); ..."
```

Screenshots, IntersectionObserver, fonts and `page.evaluate` measurement all work first try. Prefer it for anything beyond a glance.

When checking alignment, measure **across** sections, not within one — comparing offsets relative to each section's own wrapper once hid a real hero/section misalignment, because every block correctly reported the same number inside its own container. Also note `html{scroll-behavior:smooth}` makes `window.scrollTo` animate; scripted scroll tests must pass `behavior:'instant'` or they silently never move.

This repo is copy- and design-heavy, and decisions land faster when options are *rendered* and shown side by side with a recommendation than when they are described — the swallow mark took eight silhouettes and the OG image three layouts, each settled in one round.

Sanity-checking `card/index.html` by counting tags or CSS braces? Strip comments first (`re.sub(r'<!--.*?-->','',h,flags=re.S)`) — its comments quote `<section>` and `<div class="ph">` as instructions, which a naive count reads as unclosed tags.

## Deployment

Deployed by **GitHub Actions** (`.github/workflows/pages.yml`, "Deploy static content to Pages"), which uploads the repo root on every push to `main`. It is not the older "Deploy from a branch" setting. `.nojekyll` stops Pages from Jekyll-processing the site. All links must stay relative so the site works both locally and on Pages.

**Every commit on `main` auto-pushes to `origin/main`** via a local `post-commit` hook (`.git/hooks/post-commit`, machine-local, not tracked). There is no staging branch or review step: whatever is committed goes live within a minute or two. Practical implications:

- Verify a change works *before* committing — don't commit half-finished work as a checkpoint.
- Never `git commit --amend` or rewrite history on `main` once the hook has pushed it.
- Check deploy status with `gh run list --limit 1`; the run takes ~15–25s. To block until it lands: `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status`.
- When verifying the live page, cache-bust (`curl -s "$URL?cb=$RANDOM"`) — without it you can read a stale copy mid-deploy and conclude the change never shipped.
- Commit subjects here are written in Korean ("대문 영상을 바다·수평선 클립으로 교체"). The English subjects in the log are from one session and are the odd ones out — match the Korean style.

**Other sessions push to this repo while you work.** Run `git fetch origin && git log --oneline main..origin/main` *before* starting anything substantial, not just before pushing — a feature was once built here in full and then thrown away because an equivalent had already shipped from elsewhere. If the auto-push is rejected and your commit was never pushed, rebasing it onto `origin/main` is safe.

Related: the working tree may hold **someone else's in-progress edits**. Stage deliberately (`git add <paths>`) rather than `git add -A`, and check `git status` before committing so you don't sweep unfinished work into your commit.

That churn also ages this file faster than you'd expect — four of the behaviour notes below were wrong within a week of being written, describing a hero video and a progress label that had since been deleted. Grep the code before relying on one, and fix it in place when it turns out stale.

## Architecture

- `index.html` — landing one-pager (hero, story, Beautiful Curiosity band, ceremony, what-we-do, voice sample, price)
- `ask.html` — inquiry form
- `review.html` — testimonials
- `card/index.html` — **brand card**, served at `/studio/card/` (see below)
- `style.css`, `script.js` — shared by the three top-level pages; `card/` uses neither
- `apps-script/` — source and setup docs for the Apps Script backend (not executed from this repo)
- `assets/` — photos, the voice sample, and the generated `og-*.jpg` link thumbnails

`index.html`, `ask.html` and `review.html` load `style.css?v=N` and `script.js?v=N` — **bump N in all three whenever either file changes**, or returning visitors keep the stale copy. It moves often (v11 → v16 in a week), so read the current value out of the pages rather than assuming. `card/` is exempt: its CSS and JS are inline.

### `card/index.html` — the brand card

A single self-contained file (inline `<style>` and `<script>`, no `style.css`/`script.js`) at `/studio/card/`. It is the link handed to someone over KakaoTalk on first contact, so it has to read as the brand rather than as an ad. It deliberately keeps the site's palette and font tokens — the `:root` block is copied from `style.css` — but runs a much wider spacing rhythm (84→140px sections, 560px measure, hairline rules on one flat background) to slow reading down.

Things worth knowing before editing it:

- **Copy is lifted from `index.html`, not written fresh.** The four service cards and their prices come from the Price section's "더할 수 있는 것" list (and mirror its name-left/price-right layout); the Process steps come from "What we do" plus the Everafter Letter note. If you change that copy on the homepage, change it here too.
- **본식 사회 links to `#price` instead of printing 390,000원**, because the homepage deliberately keeps that figure behind a toggle.
- **Reveal animations only engage when JS is alive.** `<script>document.documentElement.classList.add('js-anim')</script>` runs in `<head>`, and `.reveal` is only hidden under `html.js-anim`. Without this a script failure leaves the card blank — which happened. The hero animates on load rather than waiting on IntersectionObserver, because font-loading reflow was leaving the first screen empty.
- **Don't put opacity on a `.reveal` element itself** — `html.js-anim .reveal.visible{opacity:1}` outranks it. Put it on a child.
- **`.wrap` needs its explicit `width:100%`.** Inside `.hero` it lays out as a flex item and everywhere else as a block; without a definite width the two paths can resolve the auto margins differently and the left edge drifts.
- **Sections 04 (photos) and 05 (testimonials) are `hidden`**, waiting on real photos and more client records. Remove the attribute to enable, and move Contact's index back from `04` to `06` when you do.

### Inquiry form (`ask.html` → Google Apps Script)

The form no longer copies text to the clipboard for the visitor to paste into a DM. It `POST`s to a Google Apps Script web app whose URL sits in `INQUIRY_ENDPOINT` at the top of the form block in `script.js`. The script appends a row to a Google Sheet and emails a notification.

- `apps-script/inquiry-handler.gs` is a **reference copy, not executed from here** — it must be pasted into the Apps Script project bound to the sheet and redeployed. `apps-script/README.md` has the deployment steps and the post-deploy authorization flow (a new script must be authorized once or every request 403s).
- Apps Script sends no CORS headers, so the `fetch` uses `mode:'no-cors'` and **cannot read the response**. A request that leaves without a network error is reported as success; real confirmation is the email or the sheet.
- The form carries a honeypot field (`website`, moved offscreen by `.hp-field`) checked on both ends, and records `consentAt`/`consentVer` alongside the privacy-consent checkbox. Bump `PRIVACY_VER` in `script.js` whenever the consent wording in `ask.html` changes. `apps-script/개인정보처리방침-초안.md` holds the policy draft.
- The same script exposes `doGet(?inquiries=1&token=)` and a `updateStatus` POST for wedding-mc's dashboard, guarded by an `ADMIN_TOKEN` script property that must match the one set in wedding-mc.

### Shared page structure (top-level pages)

Fixed `.site-header` with the `EVERAFTER` brand mark and `.site-nav` (mobile nav via `.menu-toggle` / `#site-nav.open`), a `<main>`, and a shared `<footer>`. `index.html` is the scrolling one-pager; `ask.html` and `review.html` use the `.subpage` body class and header variants (`solid-header`, `light-header`). `card/` shares none of this — it has no header or nav at all.

### `script.js` behaviors (guarded by element existence checks)

- **Reveal-on-scroll**: `.reveal` gets `.visible` on intersection, then unobserves.
- **Image zoom-on-scroll**: `.image-zoom` toggles `.is-visible`.
- **Parallax**: `updateParallax()` shifts `.parallax-media` and scales/fades the hero. Respects `prefers-reduced-motion`.
- **Voice sample** (`index.html`): custom transport for `#voiceAudio` — play/pause and a hand-built slider. It deliberately avoids `<input type=range>`: some mobile browsers draw a handle there that `-webkit-tap-highlight-color` can't suppress. Pointer gestures wait to see whether a drag is horizontal before capturing it, or the 20px bar swallows vertical page scrolling.
- **Mobile nav toggle**, **date input masking** (`0000.00.00`), **inquiry form** (above).

### `style.css` conventions

- `:root` custom properties define the palette (`--ivory` `#f4efe8`, `--ivory-soft`, `--charcoal`, `--muted`, `--burgundy` `#711f1b`, `--line`) and font stacks (`--serif-en` Cormorant Garamond, `--serif-ko` Noto Serif KR, `--sans` Noto Sans KR). Reuse these rather than hardcoding.
- Fonts load from Google Fonts via `<link>` in each page's `<head>`.
- Desktop-first with breakpoints at `901px`, `900px`, `600px`; mobile overrides are additive and layered at the bottom, where a "Multi-page additions" section covers `ask.html`/`review.html`.
- Body text is Korean-first (`word-break:keep-all`), with English/serif accents for eyebrow labels and numerals. `.lines > span` is the helper that breaks a paragraph into evenly spaced lines.

## Brand assets and link previews

- **Favicon** is an inline SVG data URI of a swallow (제비) on a burgundy tile, identical across all four pages. Swallows return to the same nest each year and carry letters in the old stories, which is why the mark was chosen. It is drawn as SVG rather than set as the `𓅪` character — that codepoint renders as a vertical stroke where a font exists at all, and the Egyptian Hieroglyphs block ships on almost no phone, so it would be tofu for most visitors.
- Most photos in `assets/` are portrait (`hero-duck.jpg` 0.64, `leaves.jpg` 0.67) while `og:image` is cropped to **1.91:1** by KakaoTalk and Twitter, so pointing at one yields a thin band through its middle. Every page ships a purpose-built 1200×630 thumbnail instead — `og-duck.jpg` (index, ask), `og-garden.jpg` (review), `og-card-duck.jpg` (card). Match that when adding a page: give the portrait photo a vertical panel with the brand line and headline beside it, nothing cropped. They are made by rendering an HTML layout at 1200×630 with Playwright (`page.locator('.og').screenshot({type:'jpeg', quality:86})` → ~40KB). Check any image's ratio with `sips -g pixelWidth -g pixelHeight <file>`; there is no ImageMagick here.
- **KakaoTalk caches previews by image URL**, so ship a *new* filename rather than overwriting an existing one. A changed title alone may still need a manual cache reset at <https://developers.kakao.com/tool/debugger/sharing>.
- The Instagram handle is **`everafter_youngae`** (it was `ever.after_youngae` until 2026-08-09). It appears in page footers, the `ig.me/m/` DM deep link on `ask.html`, the card's contact row, and two form-failure messages in `script.js` — grep the whole repo if it ever changes again.
- Each page loads GoatCounter (`everafter.goatcounter.com`) from `<head>` for analytics.
