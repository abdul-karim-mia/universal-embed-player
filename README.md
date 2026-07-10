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
| Public social video | YouTube (standard, Shorts, unlisted, live), Vimeo (incl. private-hash links), Dailymotion |
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

React and Vue are also optional peer dependencies, needed only if you import
the framework adapters below.

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

SSR-safe — the player only mounts client-side (inside `useEffect`); a Next.js
server render just emits the empty container.

### Vue 3

```vue
<script setup>
import { Player } from 'universal-embed-player/vue';
</script>
<template>
  <Player :url="url" controls :theme="{ primaryColor: '#ff0000' }" @event="handleEvent" />
</template>
```

### Thumbnail-first ("light") mode

Defers all engine/script loading until the user clicks play. `light` toggles
the mode; `poster` is an independent option for the image itself:

```js
createPlayer('#container', { url, light: true });                     // uses a provider default poster if one exists
createPlayer('#container', { url, light: true, poster: 'my.jpg' });   // custom poster
```

Default posters are only available for providers with a predictable,
deterministic thumbnail URL (YouTube, Dailymotion). Everything else — Vimeo
(thumbnails are hash-based, not derivable from the ID), professional
hosting, cloud storage, direct files — shows a plain background unless you
pass `poster` explicitly.

## TypeScript

Type declarations are generated from JSDoc (no hand-maintained `.d.ts` to
drift out of sync with the source) and published alongside the package —
`import { createPlayer } from 'universal-embed-player'` gets full
autocomplete with no extra install. Declarations are generated fresh at
publish time (`npm run build:types`, wired into `prepublishOnly`); they
aren't committed to the repo, so run that script yourself if you need to
inspect them locally.

## API

### `createPlayer(target, options)`

| Option | Type | Default | Notes |
|---|---|---|---|
| `url` | `string` | — | required |
| `controls` | `boolean` | `true` | renders the built-in Shadow-DOM control bar |
| `light` | `boolean` | `false` | thumbnail-first mode — defers engine mounting until clicked |
| `poster` | `string` | — | custom poster image URL; falls back to a provider default (YouTube, Dailymotion) if omitted |
| `autoplay` / `muted` / `loop` | `boolean` | `false` | |
| `playbackRates` | `number[]` | `[0.5, 1, 1.5, 2]` | shown in the control bar's rate selector |
| `volume` | `number` (0–1) | — | overrides `volumeKey`-based persistence |
| `volumeKey` | `string` | — | persists volume in `localStorage` under this key |
| `theme` | `{ primaryColor?, accentColor?, fontFamily? }` | — | written as CSS custom properties |
| `shield` | `boolean` | `true` | interaction shield over controllable iframe sources (YouTube, Vimeo) |
| `onEvent` | `(event) => void` | — | fires for every unified event type |

Returns `{ play, pause, seekTo, setVolume, setPlaybackRate, on, off, destroy, ready }`.

### `resolveSource(url)`

Pure function: URL in, `{ provider, type, src?, embedUrl?, id?, stability }`
out (or `null`). Exported alongside `createPlayer` if you just want the URL
resolution logic without mounting a player.

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

## Development

```bash
npm test          # runs the full suite via Node's built-in test runner (zero test-framework dependency)
```

All resolver/controller/engine code lives under [`src/`](src/) — one
provider per file in `src/resolvers/`, pure functions with no DOM or network
access during URL matching.

## License

MIT
