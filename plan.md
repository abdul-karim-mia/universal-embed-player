# plan.md — universal-embed-player

## 0. Name Verification (completed 2026-07-09)

| Check | Result |
|---|---|
| `npx name-exists universal-embed-player` | ✅ "No package similar to 'universal-embed-player' found" |
| `npm view universal-embed-player` | ✅ 404 Not Found — name is free on the npm registry |
| Trademark scan | ✅ No vendor names (`youtube`, `dropbox`, `vimeo`, `google`, etc.) appear in the package name itself |
| URL-safe characters | ✅ Lowercase letters + hyphens only, valid as an npm package name, URL path segment, and CDN slug (`unpkg.com/universal-embed-player`) |

**Decision:** proceed with `universal-embed-player` as the published npm package name. Provider names (YouTube, Dropbox, etc.) are used only in docs/prose and in internal resolver IDs (e.g. `resolvers/youtube.ts`), never in the public package name, to avoid trademark exposure while remaining descriptive internally. If naming needs to change before publish, re-run the same three checks against the alternative.

---

## 0.1 Competitive Research (completed 2026-07-09)

Installed and read the actual source of the closest existing packages
(scratchpad research install, not a project dependency) to ground the design
in what already works instead of guessing:

| Package | What we took from it | What we explicitly reject |
|---|---|---|
| `embed-video` (npm) | Hostname + pathname regex detection using the native `URL` parser (`url.hostname`, `url.pathname`, `url.searchParams`) — simple, framework-free approach to provider detection. | It pulls in `lodash.escape`, `promise-polyfill`, and `fetch-ponyfill` for a task that needs none of them in a modern browser. This is the canonical anti-pattern we are designing against: three runtime dependencies to do `String.prototype.replace` and `fetch`, which every target browser already has natively. |
| `lite-youtube-embed` | **Zero runtime dependencies.** Native `HTMLElement` custom element, `connectedCallback` lifecycle, click-to-activate iframe injection, `<link rel=preconnect>` warm-up on hover/focus, conditional YT IFrame API loading only on Safari/mobile (where autoplay-on-click needs the JS API), `<noscript>` fallback iframe for SEO/no-JS. This is the direct model for our `light`/thumbnail-first mode (plan.md §9) — we adopt the "load nothing until interaction" behavior and the preconnect-on-hover trick verbatim as a pattern. |
| `react-player` v3 (dist inspection) | Its `patterns.js` gave us real, battle-tested regex, reused directly as a starting point for our own resolvers: extension-based detection for audio/video/HLS/DASH (`/\.(mp4\|og[gv]\|webm\|mov\|m4v)(#t=[,\d+]+)?($\|\?)/i` etc.), and host+path regex for YouTube (incl. `-nocookie`/`education` domains, `shorts/`, `live/`), Vimeo, Wistia, Mux, Spotify, Twitch, TikTok. Its `players.js` confirmed the per-provider `lazy(() => import(...))` code-splitting pattern we already planned in §4.4/§9 — validates rather than changes our approach. | Its own architecture now delegates each provider to a *separate npm package* per platform (`youtube-video-element`, `vimeo-video-element`, `hls-video-element`, `@mux/mux-player-react`, etc.) — 10 runtime dependencies. Good idea conceptually (standardize each provider behind the native `HTMLMediaElement` interface), wrong for our "as close to zero dependencies as possible" constraint — we implement the equivalent behind one file per provider in `src/core/resolvers`, in-repo, not as external installs. |
| `oembed.com` / oEmbed provider registry | Confirms 300+ providers is a real, previously-solved ecosystem (Microlink/Embedly/Iframely all maintain commercial versions of "any URL → embed"). Validates that a resolver-registry architecture is the standard approach and that hostname-based dispatch (not asking a server) is exactly how these are built. | We do not depend on any oEmbed discovery network call — a live HTTP round-trip per URL contradicts the "no-server, client-side regex" premise (plan.md §6) and defeats offline/CSP-strict environments. |
| Market scan (Mux / Cloudflare Stream / Bunny Stream, 2026) | All three "professional hosting" platforms ultimately expose playback as a plain `.m3u8` HLS manifest URL (Cloudflare: `.../manifest/video.m3u8`; Bunny: same `.m3u8` suffix; Mux: playback-ID-based manifest). This means our **generic HLS engine already covers these three** — no bespoke resolver needed when the developer pastes a direct manifest URL, only when they paste a *dashboard/embed page* URL, which needs a small host-specific regex to extract the ID and rebuild the manifest URL. | Rejects the idea (implied by `react-player`'s dependency list) that each pro host needs its own heavyweight player SDK/npm package — a manifest URL + our own HLS engine is sufficient for the free/OSS scope of this project. |

**Net effect on the plan:** §2 (provider matrix) and §9 (performance) are unchanged in spirit but now backed by working reference code; §0.2 below is new and formalizes the dependency ceiling this research justifies.

## 0.2 Dependency Strategy — "as close to zero as possible"

This is now a first-class constraint, not just a nice-to-have, directly motivated by watching `embed-video` and `plyr` bundle polyfills/utility libraries for things the platform already provides, and by `react-player` v3's 10-package dependency tree.

- **`src/core/*` (resolvers, controller, native/iframe engines, UI, events): zero runtime dependencies.** Everything is built on APIs already in every evergreen browser: `URL`/`URLSearchParams`, `fetch`, template literals, `customElements`, Shadow DOM, `postMessage`, `IntersectionObserver`. No lodash, no polyfill libraries, no Promise ponyfills (Promise has been native since 2016; targeting anything older is out of scope for a 2026 package).
- **`hls.js` and `dash.js` are the only two runtime dependencies in the entire package**, and even they are **optional peer dependencies, dynamically imported only at the moment a `.m3u8`/`.mpd` source is actually resolved.** A consumer who only ever embeds YouTube/Vimeo/cloud-storage links never downloads either library — verified by a bundle-analysis check in CI (§9a below). This is unavoidable: implementing a spec-compliant HLS/MSE parser and a DASH/MPD parser from scratch is a multi-year undertaking each, and reinventing them badly would be a correctness and security regression compared to using the two libraries the entire industry already relies on (Safari's native HLS support covers the Safari case without even needing `hls.js`, so the dependency is skipped there too, per §3/§9).
- **`package.json` shape:**
  ```json
  {
    "dependencies": {},
    "peerDependencies": {
      "hls.js": ">=1.5.0",
      "dash.js": ">=4.7.0"
    },
    "peerDependenciesMeta": {
      "hls.js": { "optional": true },
      "dash.js": { "optional": true }
    }
  }
  ```
- **`devDependencies` stay off the runtime bundle entirely** (TypeScript, a bundler, a linter, Playwright) — normal for any npm package, irrelevant to install size for consumers.
- **React/Vue adapters** (`src/react`, `src/vue`) declare `react`/`vue` as peer dependencies only (never bundled), same pattern as every other framework-adapter package on npm.
- **CI enforcement:** a bundle-size/dependency-count check (§9a) fails the build if `dependencies` in `package.json` becomes non-empty, or if a resolver/engine file outside `engines/hls.ts`/`engines/dash.ts` contains an `import` from `node_modules`. This turns "zero-dependency-as-much-as-possible" from an aspiration into something CI actually blocks on.

## 0.3 Extended Provider Roadmap (post-M8 stretch, informed by research)

Beyond the v1.0.0 matrix in §2, the oEmbed/market research surfaced providers worth a resolver once core ships, roughly in order of likely developer demand. These are **not** committed for v1.0.0 — listed here so scope decisions are made deliberately later, not discovered ad hoc:

| Provider | Category | Resolution approach (planned) |
|---|---|---|
| Twitch (VOD + clips + live channel) | Public social/live | Host+path regex (`twitch.tv/videos/ID`, `clips.twitch.tv/SLUG`, `twitch.tv/CHANNEL`); requires Twitch's embed `parent` query param tied to the consuming site's own hostname — must be read from `location.hostname` at runtime, documented clearly since it's an easy integration foot-gun. |
| TikTok | Public social | Path regex `tiktok.com/@user/video/ID`; iframe embed only, no direct file access. |
| Streamable | Public social / quick-share | `streamable.com/ID` → `streamable.com/e/ID` iframe. |
| Loom | Screen-recording SaaS | `loom.com/share/ID` → `loom.com/embed/ID` iframe. |
| Mux (dashboard/page URL variant) | Professional hosting | Extract playback ID from a Mux-hosted page URL and rebuild the standard `stream.mux.com/PLAYBACK_ID.m3u8` manifest URL, then hand off to the existing generic HLS engine (§0.1) — no new engine needed, only a new resolver. |
| Bunny Stream / Cloudflare Stream (dashboard/page URL variant) | Professional hosting | Same pattern as Mux: resolver extracts the ID and rebuilds the known `.m3u8` manifest path; generic HLS engine handles playback. |
| SoundCloud | Audio (adjacent, flagged for a future `universal-embed-player/audio` entry point, not the video core) | `soundcloud.com/user/track` iframe; explicitly out of scope for the video-focused v1.0.0 unless demand is confirmed. |
| Rumble, Bilibili, PeerTube, Archive.org | Public social (regional/alt-platform demand) | Same host+path regex pattern as existing social resolvers; lowest priority, added only if a user files a request — do not pre-build speculative resolvers per YAGNI (coding-style.md). |

**Rule for adding any of these later:** follow rules.md §2's resolver contract exactly — new file, new fixture, no new dependency, no synchronous network call during matching (the Mux/Cloudflare/Bunny "page URL" resolvers are the one case that might *look* like it needs a network call to resolve an ID to a manifest path; if the ID-to-manifest-URL mapping isn't derivable by pure string transform for a given provider, that provider is deferred rather than exempted from the no-network rule).

---

## 1. Vision

`universal-embed-player` is a free, open-source, framework-agnostic npm package that takes **one video URL from any source** and renders a clean, brand-free, hardware-accelerated player — with two lines of code and zero backend/proxy requirement.

```js
import { createPlayer } from 'universal-embed-player';
createPlayer('#container', { url: 'https://drive.google.com/file/d/XXXX/view' });
```

Everything happens client-side: URL → provider detection → stream resolution → mount decision (`<video>` vs `<iframe>`) → unified controls/events.

---

## 2. Architecture Overview

```
                        ┌─────────────────────────┐
  url string  ─────────▶│   Resolver Registry      │
                        │  (regex match per host)  │
                        └────────────┬─────────────┘
                                     │  ResolvedSource
                                     │  { type: 'video'|'iframe'|'hls'|'dash',
                                     │    src, embedUrl?, provider, meta }
                                     ▼
                        ┌─────────────────────────┐
                        │   Player Controller       │
                        │  chooses mount strategy   │
                        └────────────┬─────────────┘
                     ┌───────────────┼────────────────┐
                     ▼               ▼                ▼
            ┌───────────────┐ ┌─────────────┐ ┌────────────────┐
            │ NativeEngine   │ │ HlsEngine    │ │ IframeEngine    │
            │ <video> mp4/   │ │ hls.js /     │ │ YouTube/Vimeo/  │
            │ webm/cloud     │ │ native HLS   │ │ Wistia/Kaltura  │
            └───────┬───────┘ └──────┬───────┘ └────────┬────────┘
                    └────────────────┼──────────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │  Unified UI Layer         │
                        │  (Shadow DOM controls,    │
                        │   interaction shield,     │
                        │   CSS var theming)        │
                        └────────────┬─────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │  Unified Event Emitter    │
                        │  play/pause/timeupdate/   │
                        │  buffering/ended/error     │
                        └─────────────────────────┘
```

### 2.1 Core module boundaries (one concern per package/folder)

| Module | Responsibility |
|---|---|
| `core/resolvers/*` | Pure functions: URL string in → `ResolvedSource` out. No DOM. |
| `core/controller.ts` | Decides engine, owns lifecycle (mount/unmount/destroy). |
| `core/engines/native.ts` | `<video>` tag wrapper: MP4/WebM/cloud-storage direct links. |
| `core/engines/hls.ts` | Wraps `hls.js` (and native Safari HLS) for `.m3u8`. |
| `core/engines/dash.ts` | Wraps `dash.js` for `.mpd`. |
| `core/engines/iframe.ts` | Sandboxed iframe mount + interaction shield for YouTube/Vimeo/etc. |
| `core/ui/controls.ts` | Shadow-DOM custom control bar, theme via CSS variables. |
| `core/ui/shield.ts` | Invisible overlay: blocks right-click / "watch on X" clickthrough on iframes. |
| `core/events.ts` | Normalizes provider-specific postMessage/SDK events → standard HTML5-like events. |
| `core/lazy.ts` | Thumbnail-first loader; defers SDK script injection until interaction. |
| `adapters/react` | `<Player />` component wrapping `core/controller`. |
| `adapters/vue` | Vue 3 composable + component wrapping the same controller. |

**Why this separation:** resolvers must stay pure and independently testable (regex in, object out); the controller is the only piece allowed to touch the DOM lifecycle; engines are swappable/tree-shakeable; framework adapters are thin — all real logic lives in `core` so React/Vue/vanilla stay behind one contract.

---

## 3. Provider Resolver Matrix

Each resolver is a pure function `(url: string) => ResolvedSource | null`, registered in priority order, first match wins.

| Category | Provider | Detection strategy | Resolution strategy |
|---|---|---|---|
| Public Social | YouTube (standard, Shorts, unlisted) | regex on `youtube.com/watch?v=`, `youtu.be/`, `/shorts/` | Build `youtube-nocookie.com/embed/ID` iframe; lazy-load IFrame API |
| Public Social | Vimeo | regex on `vimeo.com/ID` (incl. private hash `/ID/HASH`) | `player.vimeo.com/video/ID` iframe via oEmbed-free URL build |
| Public Social | Dailymotion | regex on `dailymotion.com/video/ID` | `geo.dailymotion.com/player/x*.html?video=ID` iframe |
| Professional | Cloudflare Stream | regex on `cloudflarestream.com/ID` or customer subdomain | `iframe.cloudflarestream.com/ID` or signed HLS manifest URL |
| Professional | Wistia | regex on `wistia.com/medias/ID` or `fast.wistia.net` | Wistia embed iframe / Channel API |
| Professional | FastPix | regex on FastPix playback domain | Direct HLS manifest URL passthrough |
| Professional | Dacast | regex on `dacast.com` content ID pattern | Dacast embed iframe |
| Professional | JW Player | regex on JW hosted `content.jwplatform.com` | JW HLS/manifest passthrough |
| Professional | Kaltura | regex on `kaltura.com/.../entryId/ID` | Kaltura embed iframe (uiconf/partner ID parsing) |
| Cloud Storage | Google Drive | regex on `drive.google.com/file/d/ID` or `open?id=ID` | Rewrite → `drive.google.com/uc?export=view&id=ID` fed into `<video>` |
| Cloud Storage | Dropbox | regex on `dropbox.com/s/...` or `/scl/fi/...` | Replace `?dl=0` → `?raw=1` |
| Cloud Storage | OneDrive | regex on `1drv.ms` / `onedrive.live.com/embed` | Transform `/embed` params into direct `/download` URL |
| Cloud Storage | iCloud | regex on `icloud.com/iclouddrive` share links | Resolve redirect chain client-side (fetch w/ `redirect: follow`, fallback: instruct user to use direct share asset link — see §7 Risks) |
| Raw Infra | HLS | `.m3u8` extension/content-type sniff | `hls.js` or native `<video>` (Safari) |
| Raw Infra | DASH | `.mpd` extension | `dash.js` |
| Raw Infra | MP4/WebM/Ogg | file extension match | Native `<video src>` |

**Fallback rule:** if no resolver matches, treat the URL as a direct file link and attempt `<video>` mount; if that errors (`onerror`), surface a standardized `UnsupportedSourceError`.

---

## 4. Public API Surface (v1.0.0)

### 4.1 Vanilla / framework-agnostic core

```ts
import { createPlayer } from 'universal-embed-player';

const player = createPlayer('#container', {
  url: string,
  controls?: boolean,          // default true — use built-in unified UI
  light?: boolean | string,    // thumbnail-first mode; string = custom thumbnail URL
  autoplay?: boolean,
  muted?: boolean,
  loop?: boolean,
  playbackRates?: number[],    // e.g. [0.5, 1, 1.5, 2]
  volume?: number,             // 0..1, persisted via localStorage key per-instance
  theme?: {
    primaryColor?: string,
    accentColor?: string,
    fontFamily?: string,
  },
  shield?: boolean,            // default true — interaction shield over iframes
  onEvent?: (e: UnifiedPlayerEvent) => void,
});

player.play();
player.pause();
player.seekTo(seconds);
player.setVolume(0..1);
player.setPlaybackRate(rate);
player.destroy();
player.on('play' | 'pause' | 'ended' | 'buffering' | 'timeupdate' | 'error', handler);
```

### 4.2 React

```tsx
import { Player } from 'universal-embed-player/react';

<Player url={url} controls light theme={{ primaryColor: '#ff0000' }} onEvent={handleEvent} />
```

- SSR-safe: internal `useEffect`-gated mount; server render emits a placeholder/poster only.

### 4.3 Vue 3

```vue
<script setup>
import { Player } from 'universal-embed-player/vue';
</script>
<template>
  <Player :url="url" controls light :theme="{ primaryColor: '#ff0000' }" @event="handleEvent" />
</template>
```

### 4.4 Package export map (tree-shaking / SSR safety)

```
universal-embed-player            → core controller + all resolvers (full bundle)
universal-embed-player/core       → controller + types only, no resolvers preloaded
universal-embed-player/resolvers/youtube
universal-embed-player/resolvers/vimeo
universal-embed-player/resolvers/gdrive
...(one subpath export per resolver, so bundlers only include what's imported)
universal-embed-player/react
universal-embed-player/vue
```

All entries ship as ESM with `"sideEffects": false` in `package.json` so Vite/Rollup/webpack tree-shake unused resolvers.

---

## 5. Unified Event System

Map every provider's native events to one enum:

```ts
type UnifiedPlayerEvent =
  | { type: 'ready' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'buffering' }
  | { type: 'timeupdate', currentTime: number, duration: number }
  | { type: 'volumechange', volume: number, muted: boolean }
  | { type: 'ratechange', rate: number }
  | { type: 'ended' }
  | { type: 'error', code: string, message: string, provider: string };
```

- **Native `<video>`** → direct HTML5 event listeners (`timeupdate`, `waiting`, `ended`, etc.), 1:1 mapping.
- **iframe providers with postMessage APIs** (YouTube IFrame API, Vimeo Player.js) → load their JS SDK lazily, subscribe to native SDK events, translate into the unified shape.
- **iframe providers with no public JS API** (some cloud/professional embeds) → best-effort via `postMessage` sniffing where documented; otherwise expose only `ready`/`error` and document the gap explicitly (see §7 Risks — no silent guessing of unavailable states).

---

## 6. Styling & Theming

- Controls render inside a **Shadow DOM** root to avoid CSS leakage in both directions (host page styles can't break the player; player styles can't leak out).
- Theme values (`primaryColor`, `accentColor`, `fontFamily`, etc.) are written as CSS custom properties (`--uep-primary-color`) on the shadow host, consumed by the internal stylesheet — enables instant re-theme with no re-render of DOM structure.
- Advanced users can target documented `::part()` elements (`play-button`, `progress-bar`, `volume-slider`) for deep CSS customization without breaking encapsulation.

---

## 7. Interaction Shield & Brand Removal — Risks and Honest Constraints

This is the highest-risk area of the spec and must be scoped honestly:

- **What's actually possible:** an absolutely-positioned transparent overlay `div` on top of an iframe can intercept clicks and route them to our own controls (play/pause via postMessage to the provider SDK where supported), and can block right-click context menus on our own DOM.
- **What's NOT actually possible (cross-origin iframes):** we cannot reach *into* a YouTube/Vimeo iframe's own DOM to delete or restyle their native UI chrome (logo, "Watch on YouTube" corner link, end-screen suggested videos) — the browser's same-origin policy blocks it, full stop. No regex or JS trick removes vendor branding *inside* a cross-origin iframe.
- **What the player actually does instead, and must document as such:**
  1. Uses each provider's **official embed parameters** to minimize chrome where the provider allows it (e.g. YouTube `modestbranding=1&rel=0&controls=0` via `youtube-nocookie.com`, Vimeo `title=0&byline=0&portrait=0&controls=0`).
  2. Places the transparent interaction shield above the iframe so end users interact only with **our** custom control bar, which sends commands to the provider's JS API (play/pause/seek/volume) — visually, the user never touches the vendor's native control bar because ours is what's clickable.
  3. For providers whose embed parameters still show a corner watermark/logo (YouTube always shows *some* brand mark by ToS), the shield can visually mask a small fixed-position corner region *only if the provider's Terms of Service permit it* — this must be a per-provider documented, opt-in flag (`allowBrandMasking`), off by default, because masking required attribution can violate a provider's embed ToS and is a legal risk, not just a technical one.
  4. Native `<video>`-based sources (cloud storage, direct MP4/HLS/DASH) have **zero** vendor chrome by construction — no iframe, no third-party skin — so these are the sources where "100% brand-free" is fully and honestly true.
- **Plan requirement:** README and in-code docs must state plainly that "brand-free" is guaranteed for native/HLS/DASH sources, and "brand-minimized, ToS-compliant" (not "brand-free") for iframe-based sources. This avoids shipping a false promise and avoids ToS violations against YouTube/Vimeo/etc.

---

## 8. Cloud Storage Resolvers — Known Fragility

Flag explicitly (do not hide from users):

- Google Drive `uc?export=view&id=` links: rate-limited for high-traffic files, can show an interstitial "can't scan for viruses" page for files >100MB, and Google can change this endpoint without notice. Document as **best-effort**, add a `onResolveError` callback so host apps can show a fallback message.
- Dropbox `?raw=1`: only works for direct file links, not for folder shares; large files may still redirect to a preview page rather than raw bytes.
- OneDrive: URL shapes vary between personal (`1drv.ms`) and SharePoint/business tenants; `/download` transform needs two code paths.
- iCloud: public share links resolve through a redirect chain that can require a JS-executed redirect (not a static regex rewrite) — this resolver is the most likely to break and should be marked **experimental** in v1.0.0, with a clear README caveat rather than a silent failure.

All four cloud resolvers must ship with integration tests against **recorded fixture URLs/responses** (not live network calls in CI, since these are third-party services outside our control and can rate-limit/break CI).

---

## 9. Performance Strategy

- **Thumbnail-first (`light` mode):** render a `<img>`/`<div>` poster with a play button; provider SDK scripts (YouTube IFrame API, Vimeo Player.js, hls.js) are only `import()`-ed and injected on first user interaction. Directly targets Lighthouse "reduce unused JavaScript" / "minimize main-thread work" audits, following the `lite-youtube-embed` pattern.
- **Code-split resolvers:** only the resolver matching the given URL's host is loaded per subpath export; the "full bundle" entry point loads all resolvers for convenience but documents the tree-shakeable subpath alternative for size-sensitive apps.
- **No polling:** all state comes from native events/postMessage callbacks, never `setInterval` state scraping.
- **SSR guard:** controller checks `typeof window === 'undefined'` and no-ops until client mount; React/Vue adapters gate DOM work behind `useEffect`/`onMounted`.

---

## 10. Testing Strategy (target: 80%+ coverage per house testing.md rules)

| Layer | Type | Approach |
|---|---|---|
| Resolvers | Unit | Table-driven tests: fixture URL in → expected `ResolvedSource` out, for every provider incl. edge cases (Shorts, unlisted, private Vimeo hash, Drive `open?id=`, Dropbox `/scl/fi/`). |
| Controller | Unit | Mock engines; assert correct engine chosen per resolved source `type`. |
| Engines | Integration | Native `<video>` engine tested via `jsdom`/`happy-dom` + a real headless-browser pass (Playwright) for actual playback events on a public domain test asset. |
| UI/Shadow DOM | Integration | Playwright: verify shadow root isolation, CSS var theming applies, `::part()` overrides work. |
| Event system | Unit | Simulate provider postMessage payloads → assert unified event shape. |
| React/Vue adapters | Unit + Integration | Testing Library (React) / Vue Test Utils; SSR render smoke test (no window access thrown). |
| E2E | Playwright | Critical flow: mount player with a real public YouTube URL, real Google Drive test file, real static MP4 → play, pause, seek, destroy, verify no memory/DOM leak (listener cleanup asserted on `destroy()`). |
| Cloud resolver fragility | Fixture-based | Record known-good responses/redirect chains as fixtures; do not hit live third-party endpoints in CI. |

TDD workflow per house rules: write resolver/controller tests first (RED), implement (GREEN), refactor, then run `code-reviewer`/`security-reviewer` agents before commit.

---

## 11. Security Considerations

- **iframe sandboxing:** all iframe engines set `sandbox="allow-scripts allow-same-origin allow-presentation"` (minimum needed set, no `allow-top-navigation`, no `allow-popups` unless a specific provider requires it — document per-provider exceptions).
- **XSS via URL input:** the `url` prop is user/developer-supplied; resolvers must validate against an allow-list of expected URL shapes per provider before ever interpolating into `src`/`iframe.src`/`innerHTML` — never string-concatenate raw untrusted input into markup. Reject and emit `error` event on malformed input rather than best-effort rendering.
- **No `innerHTML` from remote data:** control bar and shield are built via DOM APIs / templates with static markup only; any dynamic text (e.g. error messages) is set via `textContent`, never `innerHTML`.
- **CSP compatibility:** document required `frame-src`/`media-src`/`connect-src` CSP directives per provider in the README so integrators aren't surprised by CSP blocks.
- **No secrets/keys shipped:** package requires no API keys for the free tier of any listed provider; if a future Pro tier needs one (e.g., signed Cloudflare Stream URLs), it must be passed in by the host app at runtime, never bundled.

---

## 12. Milestones

| Phase | Deliverable |
|---|---|
| **M0 — Setup** | Repo scaffold, `package.json` export map, build tooling (tsup/Vite lib mode), lint/test harness, `plan.md`/`rules.md` (this doc set). |
| **M1 — Core resolvers** | Implement + unit-test all resolvers in §3 against fixtures. No UI yet. |
| **M2 — Controller + native engine** | `createPlayer` mounts `<video>` for MP4/WebM/cloud-storage sources; basic play/pause/seek API; unified events for native path. |
| **M3 — HLS/DASH engines** | Integrate `hls.js`/`dash.js`; feature-detect native HLS (Safari) vs MSE fallback. |
| **M4 — iframe engine + shield** | YouTube/Vimeo/Dailymotion iframe mounts; interaction shield; ToS-compliant chrome minimization per §7. |
| **M5 — Unified UI layer** | Shadow-DOM control bar, CSS variable theming, `::part()` exposure. |
| **M6 — Lazy/thumbnail-first mode** | `light` prop, deferred SDK loading, Lighthouse benchmark pass. |
| **M7 — React + Vue adapters** | `<Player>` components, SSR safety verified in a Next.js + Nuxt smoke app. |
| **M8 — Professional hosting providers** | Cloudflare Stream, Wistia, FastPix, Dacast, JW Player, Kaltura resolvers + iframe embeds. |
| **M9 — Hardening** | Security review pass (§11), CSP docs, error taxonomy finalized, fixture-based cloud-resolver tests, dependency-ceiling CI check (§0.2) green. |
| **M10 — v1.0.0 release** | README, API docs site, examples (Vite, Next.js, Nuxt, Astro), publish to npm, tag release. |

---

## 13. Open Risks Requiring Explicit Sign-off Before M10

1. **iCloud resolver** may not be reliably automatable client-side (§8) — decide whether to ship as "experimental/best-effort" or cut from v1.0.0 scope entirely.
2. **"Brand-free" claim** must be rewritten per §7 nuance before any public marketing copy ships, to avoid overpromising and avoid provider ToS violations.
3. **Provider ToS review** (YouTube, Vimeo, Dropbox, Google Drive, OneDrive) for embedding/hotlinking terms should get a lightweight legal skim before v1.0.0 launch — not a blocker for development, but a blocker for public announcement.
