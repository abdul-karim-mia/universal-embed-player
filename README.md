# universal-embed-player

A framework-agnostic, **dependency-free** video embed resolver and player.
Feed it one URL — YouTube, Vimeo, Dropbox, HLS, DASH, or a plain MP4 — and
it detects the host, resolves the real playable source, and mounts a
unified player with one API.

```js
import { createPlayer } from 'universal-embed-player';

createPlayer('#container', { url: 'https://www.dropbox.com/scl/fi/XXXX/video.mp4?dl=0' });
```

No proxy server. No client-side dependency except the two libraries
(`hls.js`, `dashjs`) that only load when you actually use HLS/DASH.

---

## Supported sources

| Category | Providers |
|---|---|
| Public social video | YouTube (standard, Shorts, unlisted, live), Vimeo (incl. private-hash links) |
| Professional hosting | Wistia, Cloudflare Stream, FastPix, JW Player, Kaltura |
| Cloud storage | Dropbox |
| Raw infrastructure | HLS (`.m3u8`), DASH (`.mpd`), MP4/WebM/Ogg/MOV |

Mux, Bunny Stream, and Cloudflare Stream's own manifest URLs need no special
resolver at all — paste the `.m3u8` directly and the generic HLS engine
handles it.

## Install

```bash
npm install universal-embed-player
```

HLS and DASH support are optional peer dependencies — only install what you
actually use:

```bash
npm install hls.js   # only if you'll play .m3u8 sources on non-Safari browsers
npm install dashjs   # only if you'll play .mpd sources
```

React, Vue, and Svelte are also optional peer dependencies, needed only if
you import the corresponding framework adapter below. The Web Component
adapter needs no extra install at all — it's pure platform API.

## Usage

### Vanilla / framework-agnostic

```js
import { createPlayer } from 'universal-embed-player';

const player = createPlayer('#container', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  controls: true,
  theme: { primaryColor: '#ff0000' },
  onEvent: (event) => console.log(event.type, event),
});

await player.ready;       // resolves once the engine has mounted
player.play();
player.pause();
player.seekTo(30);
player.setVolume(0.5);
player.setPlaybackRate(1.5);
player.destroy();
```

### React

```jsx
import { Player } from 'universal-embed-player/react';

<Player url={url} controls theme={{ primaryColor: '#ff0000' }} onEvent={handleEvent} />
```

SSR-safe — the interactive player only mounts client-side (inside
`useEffect`). Unlike the empty-`<div>` server render this used to produce,
the server-rendered HTML now includes a real poster image linking to `url`
(see [Video SEO](#video-seo) below) — it's swapped out for the real player
the moment client-side mounting completes.

### Vue 3

```vue
<script setup>
import { Player } from 'universal-embed-player/vue';
</script>
<template>
  <Player :url="url" controls :theme="{ primaryColor: '#ff0000' }" @event="handleEvent" />
</template>
```

Same SSR behavior as the React adapter above.

### Svelte

```svelte
<script>
  import { Player } from 'universal-embed-player/svelte';
</script>

<Player url={url} controls theme={{ primaryColor: '#ff0000' }} onEvent={handleEvent} />
```

Requires Svelte 5+ (runes syntax — `$props`/`$state`/`$effect`; no Svelte
3/4 legacy-syntax support). Same SSR-safe behavior as React/Vue above:
`onMount` gates the real player, so a SvelteKit server render emits the
same poster+link+JSON-LD fallback rather than an empty container.

### Web Component

Works in any framework — or none — with no adapter of its own:

```js
import 'universal-embed-player/webcomponent'; // registers <uep-player>
```

```html
<uep-player url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" controls></uep-player>
```

```html
<!-- Angular needs to be told about the unknown element: -->
<!-- @Component({ ..., schemas: [CUSTOM_ELEMENTS_SCHEMA] }) -->
```

Complex options (`theme`, `seo`, `playbackRates`) accept either a JSON-string
attribute or a JS property:

```js
const el = document.querySelector('uep-player');
el.theme = { primaryColor: '#ff0000' };
el.seo = { name: 'My video title' };
el.addEventListener('uep-play', (e) => console.log(e.detail));
el.addEventListener('uep-buffering', (e) => console.log(e.detail));
```

Or register under your own tag name instead of the default `uep-player` —
import from `.../webcomponent/element`, not `.../webcomponent`, since a
custom element class can only ever be passed to `customElements.define()`
once; importing from the plain `webcomponent` entry would already have
registered it as `uep-player` first and thrown on the second call:

```js
import { UepPlayerElement } from 'universal-embed-player/webcomponent/element';
customElements.define('my-video', UepPlayerElement);
```

Every `PlayerOptions` key is available as both an attribute (kebab-case,
e.g. `video-size`, `center-play-button`) and a same-named JS property
(camelCase). Imperative methods mirror the vanilla API 1:1 — `el.play()`,
`el.pause()`, `el.seekTo(30)`, `el.setVolume(0.5)`, etc. — and every unified
event is dispatched as a real `CustomEvent` (`uep-ready`, `uep-play`,
`uep-buffering`, `uep-timeupdate`, `uep-volumechange`, `uep-ratechange`,
`uep-ended`, `uep-error`, plus a catch-all `uep-event`), `detail` holding the
same event payload `onEvent` receives elsewhere.

**Boolean attributes use an opt-out convention, not the standard
boolean-presence one.** `controls`, `shield`, `autoplay`, `muted`, `loop`,
`light`, `center-play-button`, and `loading-spinner` are all **true unless
the attribute's value is literally the string `"false"`** — not "true if
present, false if absent" like native `<video controls>`. This matches
`createPlayer`'s own internal contract (`options.shield !== false` etc. in
the core controller) and — more importantly — is the only convention that's
correct under naive attribute stringification: a framework binding like
Angular's `[attr.controls]="x"` calls `setAttribute('controls', String(x))`,
so when `x` is `false` the DOM ends up with the literal attribute
`controls="false"`. Under the standard presence convention that reads as
"present, therefore true" — silently inverting the binding. Property
bindings (`el.controls = false`) are unaffected either way.

### Thumbnail-first ("light") mode

Defers all engine/script loading until the user clicks play. `light` toggles
the mode; `poster` is an independent option for the image itself:

```js
createPlayer('#container', { url, light: true });                     // uses a provider default poster if one exists
createPlayer('#container', { url, light: true, poster: 'my.jpg' });   // custom poster
```

Default posters are only available for providers with a predictable,
deterministic thumbnail URL (YouTube). Everything else — Vimeo (thumbnails
are hash-based, not derivable from the ID), professional hosting, cloud
storage, direct files — shows a plain background unless you pass `poster`
explicitly.

## TypeScript

Type declarations are generated from JSDoc (no hand-maintained `.d.ts` to
drift out of sync with the source) and published alongside the package —
`import { createPlayer } from 'universal-embed-player'` gets full
autocomplete with no extra install. Declarations are generated fresh at
publish time (`npm run build:types`, wired into `prepublishOnly`); they
aren't committed to the repo, so run that script yourself if you need to
inspect them locally.

**One exception:** `universal-embed-player/svelte`'s types
(`src/svelte/index.d.ts`) are hand-maintained, not generated — tsc's
JSDoc-based declaration emit can't process `.svelte` files at all, so
`src/svelte/**` is excluded from the type-generation build entirely. The
hand-written file mirrors `PlayerOptions` and needs updating by hand
whenever that type changes.

## API

### `createPlayer(target, options)`

| Option | Type | Default | Notes |
|---|---|---|---|
| `url` | `string` | — | required |
| `controls` | `boolean` | `true` | renders the built-in Shadow-DOM control bar |
| `light` | `boolean` | `false` | thumbnail-first mode — defers engine mounting until clicked |
| `poster` | `string` | — | custom poster image URL; falls back to a provider default (YouTube) if omitted |
| `autoplay` / `muted` / `loop` | `boolean` | `false` | |
| `playbackRates` | `number[]` | `[0.5, 1, 1.5, 2]` | shown in the control bar's rate selector |
| `volume` | `number` (0–1) | — | overrides `volumeKey`-based persistence |
| `volumeKey` | `string` | — | persists volume in `localStorage` under this key |
| `theme` | `{ primaryColor?, accentColor?, fontFamily? }` | — | written as CSS custom properties |
| `shield` | `boolean` | `true` | interaction shield over controllable iframe sources (YouTube, Vimeo) |
| `loadingSpinner` | `boolean` | `true` | shows a spinner overlay while the engine mounts and during any `buffering` event |
| `seo` | `{ name, description?, thumbnailUrl?, uploadDate?, durationSeconds? }` | — | opt-in `VideoObject` JSON-LD, see [Video SEO](#video-seo) |
| `onEvent` | `(event) => void` | — | fires for every unified event type |

Returns `{ play, pause, seekTo, setVolume, setPlaybackRate, on, off, destroy, ready }`.

### `resolveSource(url)`

Pure function: URL in, `{ provider, type, src?, embedUrl?, id?, stability }`
out (or `null`). Exported alongside `createPlayer` if you just want the URL
resolution logic without mounting a player.

## Video SEO

`createPlayer` mounts entirely with client-side JavaScript, which means a
crawler (or any tool) that fetches the page's raw HTML without executing
scripts sees nothing but an empty container — no thumbnail, no link, no
structured data. This library can only close that gap where there's an
actual server-render step to put real content into, which is why the two
tools below apply differently depending on which API you use:

| | Vanilla `createPlayer` | Web Component `<uep-player>` | React / Vue / Svelte `<Player>` |
|---|---|---|---|
| Poster + link fallback | Not possible — `createPlayer` only runs after a script executes, so there's no HTML for a non-JS crawler to see in the first place. Put a real `<a href="{url}"><img src="{poster}"></a>` inside your own mount element's initial markup instead; `createPlayer` safely clears and replaces it on mount. | Same recipe as vanilla, but the light-DOM children you write directly in static HTML (`<uep-player url="..."><a href="..."><img...></a></uep-player>`) genuinely are real crawler-visible content before the element upgrades — it's cleared and replaced on mount, same contract. | Automatic, no config. The SSR render emits a real poster `<img>` wrapped in an `<a href={url}>` as part of the component's own output — visible to every crawler, JS or not — and it's replaced once the real player mounts client-side. |
| `VideoObject` JSON-LD | Opt-in via the `seo` option. Injected into `<head>` client-side, so **only crawlers that execute JavaScript see it** (Google documents support for this; most others — Bing, social link-preview bots — do not run scripts at all). | Same as vanilla — no server-render step it controls, so opt-in `seo` is client-injected only. | Opt-in via the `seo` prop, rendered server-side as part of the component's own JSON-LD `<script>` tag — every crawler sees it, JS or not. Prefer this over the vanilla/Web-Component path when you have the choice. |

The "automatic" React/Vue/Svelte story only applies when your app actually
performs server rendering (Next.js, Nuxt, SvelteKit) — a client-only SPA
build has no server-render step for a crawler to see in the first place,
same limitation the vanilla API always had.

```jsx
<Player
  url={url}
  seo={{
    name: 'My video title',       // required — nothing is emitted without it
    description: '...',            // falls back to `name`
    uploadDate: '2026-01-15',      // ISO 8601 — required for Google's rich-result eligibility
    durationSeconds: 93,           // converted to ISO 8601 duration (PT1M33S) automatically
  }}
/>
```

None of this data is fetched automatically — resolvers never call a
provider API for title/description/duration (see the honest constraints
below on why), so `name`/`description`/`uploadDate`/`durationSeconds` are
only ever what you pass in. Without `seo`, `thumbnailUrl` still falls back
to the resolved provider poster where one exists.

Video sitemaps and `og:video`/`twitter:player` meta tags are page-`<head>`/
site-level concerns and out of scope here — they belong in your framework's
own metadata APIs (e.g. Next.js `generateMetadata`), not injected by a
component mounted into a `<div>`.

## Honest constraints (read this before shipping "brand-free" as marketing copy)

- **Native sources (cloud storage, direct MP4/WebM, HLS, DASH) are fully
  brand-free** — no iframe, no vendor chrome, by construction.
- **iframe sources (YouTube, Vimeo, Wistia) are "brand-minimized," not
  "brand-free."** Cross-origin iframes can't have their internal DOM
  stripped — same-origin policy blocks it categorically. The interaction
  shield only intercepts clicks and forwards real commands via each
  provider's documented postMessage protocol; it's only mounted where a
  protocol adapter exists (currently YouTube and Vimeo).
- **Dropbox** resolver is a simple, documented URL rewrite and can break if
  the provider changes its URL scheme.
- **Dailymotion is not supported.** Its current embed endpoint
  (`geo.dailymotion.com`) exposes no postMessage control API, so there is no
  documented way to drive play/pause/seek from the outside — only its own
  built-in controls would be available, same as any bare unrecognized
  iframe. `dailymotion.com` / `dai.ly` URLs resolve to `null` rather than a
  half-working embed.

## Development

```bash
npm test          # runs the full suite via Node's built-in test runner (zero test-framework dependency)
```

All resolver/controller/engine code lives under [`src/`](src/) — one
provider per file in `src/resolvers/`, pure functions with no DOM or network
access during URL matching.

## License

MIT
