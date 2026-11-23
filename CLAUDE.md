# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Everafter (永愛) is a static marketing site for a wedding-ceremony emcee ("사회") service, deployed via GitHub Pages. There is no build system, package manager, or framework — just hand-written HTML/CSS/JS served directly.

This repo is the public brand/landing site (hero, story, price, testimonials, inquiry form) plus a shareable one-page brand card. The client-facing tooling — MC script builder, couple questionnaire, script review, and post-ceremony "story" archive — lives in the sibling repo `Everafter-youngae/wedding-mc` (deployed at `everafter-youngae.github.io/wedding-mc/`), which is a separate codebase with its own CLAUDE.md. It used to carry a different visual language (wine/gold, cool greys); as of 2026-09-12 it shares this repo's palette via `BRAND.md` — ivory ground, sky-ink accents, night-family dark screens. Its layouts stay functional/app-like, but the colours and type are the same system. Don't assume shared components, styles, or data between the two repos.

The two repos now touch in three places, all loose couplings rather than shared code:

- This site's inquiry form writes to a Google Apps Script backend; wedding-mc's dashboard reads that same sheet to show new inquiries (see "Inquiry form" below).
- wedding-mc's dashboard has a 명함 보내기 action that hands out this repo's `/card/` URL.
- Footers here link out to wedding-mc's `story.html`, and wedding-mc links back to this homepage.

A third, private repo `Everafter-youngae/everafter-instagram` posts to the Instagram account through the official Graph API. It touches this repo in one place: Instagram fetches media from a public URL rather than accepting an upload, so that tool commits its 1080×1350 JPEGs into **`assets/ig/`** here and hands Instagram the Pages URL. Two consequences — a commit landing in `assets/ig/` that you didn't make is that tool, not a stray edit; and the card renderer there copies this site's `:root` tokens, so a palette change here has to be carried over.

## Brand design system

The homepage hero already *is* the BRAND.md reference hero — Sky `#64AAC3` ground, Banana `#FFEBB0` `EVERAFTER` in Poppins 800, ink `YOUNGAE` and body. Don't propose "moving it to the brand direction"; read `home.css` before saying anything about how the homepage looks.

**`BRAND.md` 가 모든 디자인 판단의 최우선 기준입니다.** 색·타이포그래피·구성
원칙이 거기 있고, 세 레포(studio · wedding-mc · everafter-instagram)가 같은
시스템을 공유합니다. UI 를 고치기 전에 읽으세요.

특히 색을 쓰기 전에 BRAND.md 의 "읽히는 글자의 규칙"을 확인하세요. 시그니처
조합인 Banana/Sky 와 Ivory/Sky 는 대비가 2.2~2.6:1 이라 **본문으로 쓸 수
없습니다.** Sky 바탕 위 글자는 Charcoal, Sky 를 글자로 쓸 때는 `#357289`
입니다. 거대한 워드마크만 예외입니다.

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

## 사회자 시뮬레이션 (`taste/`)

Voice 구간의 개식사 재생기 아래, 이름을 넣으면 픽셀 예식장에서 사회자의 실제 목소리로 1분짜리 예식(착석 안내 → 개식 선언 → 신랑 입장 → 신부 입장 → 행진)이 열리는 자리입니다. 화면에 보이는 이름은 "사회자 시뮬레이션"이고, 폴더·id 에 남은 `taste` 는 처음 이름("결혼식 맛보기")의 흔적입니다.

- **한 파일, 두 쓰임.** `taste/index.html` 은 혼자서도 열리는 페이지(공유 링크용, 자체 들어가는 화면 있음)이면서, 홈페이지에서는 `<iframe src="taste/?embed=1">` 로 품깁니다. `?embed` 가 붙으면 들어가는 화면과 워터마크를 감춥니다. 이름 입력은 `index.html` 의 `#tasteForm` 이 받고, `home.js` 가 **누르는 그 순간에** 틀 안의 `tasteStart(g,b)` 를 직접 부릅니다 — 휴대폰은 손가락이 닿은 호출 흐름 안에서만 소리를 열어 주기 때문입니다. `postMessage` 나 `setTimeout` 으로 바꾸면 아이폰에서 소리가 안 납니다.
- **그림은 전부 코드가 그립니다.** 이미지 파일이 없습니다. `Grid`(점 찍는 도구) → `chibi()`(인물) · `bust()`(대사 상자의 사회자 얼굴) · `buildBg()`(예식장). 예식장은 고정된 한 장이 아니라 `layout()` 이 화면 크기에 맞춰 줄·칸 수를 새로 계산합니다.
- **저작권 기준 (지킬 것).** 인물·배경은 이 파일의 원작, 화풍만 2000년대 아바타풍. 신랑·신부 입장곡은 새로 지은 선율, 행진곡은 멘델스존 결혼행진곡(1842, 퍼블릭 도메인)을 음표 단위로 합성. 박수·웅성임도 합성음입니다. **기존 가요·팝의 멜로디나 음원, 실제 예식 영상의 소리(배경 음악·하객 목소리가 섞임)를 넣지 않습니다.** 대사 글꼴 Galmuri 는 SIL OFL.
- **목소리 파일.** `assets/audio/taste/{wait,open,groom,bride,march}.m4a` 와 `names/g_<신랑이름>.m4a`("지금부터, ○○님과") · `names/b_<신부이름>.m4a`("○○님의 결혼식을 시작하겠습니다."). 신랑·신부 조각이 **둘 다** 있을 때만 이어 붙여 이름을 부르고 자막에도 이름을 넣습니다. 하나라도 없으면 `open.m4a`("두 사람의 결혼식을…")로 말하고 자막도 그 문장입니다 — 자막은 언제나 들리는 말과 같아야 합니다. 파일 이름의 한글은 NFC 여야 합니다(리눅스 서버는 자모가 풀린 이름을 다른 파일로 봅니다).
- **울림은 파일에 굽지 않습니다.** 녹음은 마른 채로 두고, 재생할 때 `HALL` 상수(잔향·되울림·낮은 음 보강)로 입힙니다. "에코가 과하다/밋밋하다"는 요청은 그 숫자만 고치면 됩니다.
- **시계.** `wait()`·걸음·자막은 `setTimeout` 이 아니라 화면이 보일 때만 가는 `clock` 을 봅니다. 화면 밖으로 밀려나거나 탭이 가려지면 그림·소리·순서가 함께 멈춥니다. 새 연출을 넣을 때 `setTimeout` 을 쓰면 그것만 혼자 흘러가 어긋납니다.
- **이름을 추가로 녹음하면** 조용한 방에서 같은 거리로 녹음 → 문장별로 잘라 앞뒤 무음 정리·크기 맞춤 → 위 경로에 넣으면 끝입니다. 그리고 `taste/index.html` 의 `NAMES` 목록에 그 이름을 적습니다 — 목록에 없는 이름은 파일을 찾으러 가지도 않습니다(입력한 이름이 요청 주소에 실려 서버 기록에 남지 않게 하려는 것). 이 맥에는 `ffmpeg` 가 없어 `afconvert` 와 파이썬으로 처리했습니다.
- 입력한 이름은 어디에도 보내거나 저장하지 않습니다. 집계를 붙이게 되더라도 이름 자체는 남기지 않습니다.
- 소리는 헤드리스 검증으로 확인할 수 없습니다. Playwright 에서 m4a 를 디코드하려면 `chromium.launch({channel:'chrome'})` (번들 Chromium 은 AAC 가 없음), 그리고 `--mute-audio` 를 꼭 붙이세요 — 안 붙이면 사용자의 스피커로 실제 소리가 납니다.

## Architecture

- `index.html` — landing one-pager (hero, story, Beautiful Curiosity band, ceremony, what-we-do, voice sample, price)
- `ask.html` — inquiry form
- `review.html` — testimonials
- `card/index.html` — **brand card**, served at `/studio/card/` (see below)
- `home.css`, `home.js` — **`index.html` only.** The homepage was rebuilt on its own stylesheet; it no longer loads `style.css`/`script.js`.
- `style.css`, `script.js` — now only `ask.html` and `review.html`; `card/` uses neither
- `apps-script/` — source and setup docs for the Apps Script backend (not executed from this repo)
- `assets/` — photos, the voice sample, and the generated `og-*.jpg` link thumbnails

Cache-busting query strings run on **two independent tracks** now. `ask.html` and `review.html` load `style.css?v=N` and `script.js?v=N` — bump N in *both pages* when either file changes. `index.html` loads `home.css?v=M` and `home.js?v=M` on its own counter. The two numbers are not in step (v17 vs v5 as of 2026-09-11), so read the current value out of the page you are touching rather than assuming. `card/` is exempt: its CSS and JS are inline.

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
- **Parallax**: `updateParallax()` shifts `.parallax-media` and scales/fades the hero. Respects `prefers-reduced-motion`. Note this is `script.js`, so it applies to `ask.html`/`review.html` only — the homepage hero moved to `home.css`/`home.js` and has no photo or parallax.

The `.hero-media` / `.hero-overlay` / `.hero-copy` rules still sitting in `style.css`, and the hero half of `updateParallax()`, are **leftovers from the photo hero the homepage used to have**. Nothing loads them any more. Left in place rather than deleted blind — check before reusing those class names.
- **Voice sample** (`index.html`): custom transport for `#voiceAudio` — play/pause and a hand-built slider. It deliberately avoids `<input type=range>`: some mobile browsers draw a handle there that `-webkit-tap-highlight-color` can't suppress. Pointer gestures wait to see whether a drag is horizontal before capturing it, or the 20px bar swallows vertical page scrolling.
- **Mobile nav toggle**, **date input masking** (`0000.00.00`), **inquiry form** (above).

### `style.css` conventions

- `:root` custom properties define the palette (`--ivory` `#FFFDF5`, `--ivory-soft` `#FFF8E4`, `--charcoal`, `--muted`, `--accent` `#357289` Glacier Blue with `--accent-deep`/`--accent-bright`, `--banana`, `--line`) and font stacks (`--serif-en` Cormorant Garamond, `--serif-ko` Noto Serif KR, `--sans` Noto Sans KR). Reuse these rather than hardcoding.
- Fonts load from Google Fonts via `<link>` in each page's `<head>`.
- Desktop-first with breakpoints at `901px`, `900px`, `600px`; mobile overrides are additive and layered at the bottom, where a "Multi-page additions" section covers `ask.html`/`review.html`.
- Body text is Korean-first (`word-break:keep-all`), with English/serif accents for eyebrow labels and numerals. `.lines > span` is the helper that breaks a paragraph into evenly spaced lines.

## Brand assets and link previews

- **Favicon** is an inline SVG data URI of a swallow (제비) on a Glacier Blue tile (`#3A7D96`), identical across all four pages. Swallows return to the same nest each year and carry letters in the old stories, which is why the mark was chosen. It is drawn as SVG rather than set as the `𓅪` character — that codepoint renders as a vertical stroke where a font exists at all, and the Egyptian Hieroglyphs block ships on almost no phone, so it would be tofu for most visitors.
- Most photos in `assets/` are portrait (`hero-duck.jpg` 0.64, `leaves.jpg` 0.67) while `og:image` is cropped to **1.91:1** by KakaoTalk and Twitter, so pointing at one yields a thin band through its middle. Every page ships a purpose-built 1200×630 thumbnail instead — `og-duck.jpg` (index, ask), `og-garden.jpg` (review), `og-card-duck.jpg` (card). Match that when adding a page: give the portrait photo a vertical panel with the brand line and headline beside it, nothing cropped. They are made by rendering an HTML layout at 1200×630 with Playwright (`page.locator('.og').screenshot({type:'jpeg', quality:86})` → ~40KB). Check any image's ratio with `sips -g pixelWidth -g pixelHeight <file>`; there is no ImageMagick here.
- **KakaoTalk caches previews by image URL**, so ship a *new* filename rather than overwriting an existing one. A changed title alone may still need a manual cache reset at <https://developers.kakao.com/tool/debugger/sharing>.
- The Instagram handle is **`everafter_youngae`** (it was `ever.after_youngae` until 2026-08-09). It appears in page footers, the `ig.me/m/` DM deep link on `ask.html`, the card's contact row, and two form-failure messages in `script.js` — grep the whole repo if it ever changes again.
- Each page loads GoatCounter (`everafter.goatcounter.com`) from `<head>` for analytics.
