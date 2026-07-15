import { useState } from 'react';

const articles = [
  { id: 'quickstart', title: 'Quick Start' },
  { id: 'api', title: 'API Reference' },
  { id: 'providers', title: 'Provider Guides' },
  { id: 'frameworks', title: 'Framework Integration' },
  { id: 'theming', title: 'Theming & Customization' },
  { id: 'architecture', title: 'Architecture' },
];

const content = {
  quickstart: () => (
    <div className="docs-article">
      <h2>Quick Start</h2>
      <p>Universal Embed Player is a framework-agnostic, zero-dependency JavaScript library. Install it from npm and start embedding videos from any source in minutes.</p>

      <h3>Installation</h3>
      <div className="code-block">
        <pre>npm install universal-embed-player</pre>
      </div>
      <p>That's it. The library ships as raw ES modules with zero runtime dependencies. Optional support for <code>hls.js</code> and <code>dashjs</code> is dynamically imported when needed.</p>

      <h3>Basic Usage</h3>
      <div className="code-block">
        <pre>{`import { createPlayer } from 'universal-embed-player'

const player = createPlayer('#container', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  controls: true,
})

// Wait for the player to be ready
await player.ready

// Programmatic control
player.play()
player.pause()
player.seekTo(30)
player.setVolume(0.5)`}</pre>
      </div>

      <h3>Using with a URL</h3>
      <p>The library automatically detects the video source from the URL and selects the appropriate playback engine. Supported sources include YouTube, Vimeo, Wistia, Cloudflare Stream, FastPix, JW Player, Kaltura, Dropbox, HLS, DASH, and direct MP4/WebM files.</p>

      <div className="note-callout">
        <div className="note-callout-title">No Backend Required</div>
        <p>Everything happens client-side. The library resolves the source and renders the player directly in the browser without any proxy or backend service.</p>
      </div>

      <h3>Resolving a Source</h3>
      <p>Use <code>resolveSource()</code> to check if a URL is supported before creating a player:</p>
      <div className="code-block">
        <pre>{`import { resolveSource } from 'universal-embed-player'

const result = resolveSource('https://vimeo.com/76979871')
// → { type: 'vimeo', engine: 'iframe', url: '...', ... }

if (result) {
  console.log(\`Playing on \${result.engine} via \${result.type}\`)
}`}</pre>
      </div>
    </div>
  ),

  api: () => (
    <div className="docs-article">
      <h2>API Reference</h2>

      <h3>createPlayer(container, options)</h3>
      <p>The main entry point. Creates a player instance inside the given container element.</p>

      <h4>Parameters</h4>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>container</td><td>string | HTMLElement</td><td>A CSS selector or DOM element to mount the player in</td></tr>
          <tr><td>options</td><td>PlayerOptions</td><td>Configuration object (see below)</td></tr>
        </tbody>
      </table>

      <h4>Player Options</h4>
      <table>
        <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>url</td><td>string</td><td>—</td><td>Video URL to resolve and play (required)</td></tr>
          <tr><td>controls</td><td>boolean</td><td>true</td><td>Show the Shadow DOM control bar</td></tr>
          <tr><td>shield</td><td>boolean</td><td>true</td><td>Interaction shield over controllable iframe sources (YouTube, Vimeo)</td></tr>
          <tr><td>autoplay</td><td>boolean</td><td>false</td><td>Start playback automatically</td></tr>
          <tr><td>muted</td><td>boolean</td><td>false</td><td>Start muted (required for most autoplay)</td></tr>
          <tr><td>loop</td><td>boolean</td><td>false</td><td>Loop the video</td></tr>
          <tr><td>light</td><td>boolean</td><td>false</td><td>Thumbnail-first mode &mdash; defers engine mounting until clicked</td></tr>
          <tr><td>poster</td><td>string</td><td>—</td><td>Custom poster image URL; falls back to a provider default (YouTube only) if omitted</td></tr>
          <tr><td>glowingPlaceholder</td><td>boolean</td><td>—</td><td>Light-mode only. Force the animated glow on/off; unset shows it only when there's no poster image yet</td></tr>
          <tr><td>glowStyle</td><td>GlowStyle</td><td>—</td><td>Light-mode only. Override glow gradient colors/angle/speed (see Theming)</td></tr>
          <tr><td>centerPlayButton</td><td>boolean</td><td>false</td><td>Show a custom play/pause button centered over the player</td></tr>
          <tr><td>videoSize</td><td>'contain' | 'cover' | 'fill'</td><td>'contain'</td><td>Video sizing: fit, fill/crop, or stretch</td></tr>
          <tr><td>playbackRates</td><td>number[]</td><td>[0.5, 1, 1.5, 2]</td><td>Rates shown in the control bar's rate selector</td></tr>
          <tr><td>volume</td><td>number (0&ndash;1)</td><td>—</td><td>Overrides <code>volumeKey</code>-based persistence</td></tr>
          <tr><td>volumeKey</td><td>string</td><td>—</td><td>Persists volume in <code>localStorage</code> under this key</td></tr>
          <tr><td>loadingSpinner</td><td>boolean</td><td>true</td><td>Show a spinner overlay while the engine mounts and during <code>buffering</code></td></tr>
          <tr><td>theme</td><td>PlayerTheme</td><td>{ }</td><td>CSS custom property theming (see Theming &amp; Customization)</td></tr>
          <tr><td>seo</td><td>SeoMetadata</td><td>—</td><td>Opt-in <code>VideoObject</code> JSON-LD (name required)</td></tr>
          <tr><td>iframelyKey</td><td>string</td><td>—</td><td>Opt-in last-resort fallback via the Iframely API (see Provider Guides)</td></tr>
          <tr><td>onEvent</td><td>(event) =&gt; void</td><td>—</td><td>Fires for every unified event type</td></tr>
        </tbody>
      </table>

      <h4>Returned Player Instance</h4>
      <table>
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>.ready</td><td>Promise that resolves once the engine has fully mounted</td></tr>
          <tr><td>.play()</td><td>Start or resume playback</td></tr>
          <tr><td>.pause()</td><td>Pause playback</td></tr>
          <tr><td>.seekTo(seconds)</td><td>Seek to a specific time</td></tr>
          <tr><td>.setVolume(0-1)</td><td>Set volume level (clamped, auto-unmutes if &gt; 0)</td></tr>
          <tr><td>.mute()</td><td>Mute audio, remembering the current volume</td></tr>
          <tr><td>.unmute()</td><td>Unmute audio, restoring the pre-mute volume</td></tr>
          <tr><td>.toggleMute()</td><td>Toggle between muted and unmuted</td></tr>
          <tr><td>.setPlaybackRate(rate)</td><td>Set playback speed (clamped to [0.0625, 16])</td></tr>
          <tr><td>.setVideoSize(size)</td><td>Set object-fit dynamically ('contain' | 'cover' | 'fill')</td></tr>
          <tr><td>.on(type, handler)</td><td>Subscribe to a unified event; returns an unsubscribe function</td></tr>
          <tr><td>.off(type, handler)</td><td>Unsubscribe a handler</td></tr>
          <tr><td>.destroy()</td><td>Remove the player and clean up (idempotent)</td></tr>
        </tbody>
      </table>

      <h3>resolveSource(url)</h3>
      <p>Pure function: analyzes a URL and returns a <code>ResolvedSource</code> object if the source is supported, or <code>null</code> if it isn't. No DOM access, no player mounted &mdash; useful if you just want the resolution logic.</p>
      <div className="code-block">
        <pre>{`resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// {
//   provider: 'youtube',
//   type: 'iframe',        // engine: 'native' | 'iframe' | 'hls' | 'dash'
//   id: 'dQw4w9WgXcQ',
//   embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?...',
//   stability: 'stable',   // 'stable' | 'experimental'
// }`}</pre>
      </div>

      <h3>RESOLVERS</h3>
      <p>An array of all available resolver modules, in priority order. You can import individual resolvers via subpath exports:</p>
      <div className="code-block">
        <pre>import youtubeResolver from 'universal-embed-player/resolvers/youtube'</pre>
      </div>
    </div>
  ),

  providers: () => (
    <div className="docs-article">
      <h2>Provider Guides</h2>
      <p>UEP supports 11 video providers out of the box. Each provider is handled by a dedicated resolver module that extracts the playable source and selects the appropriate engine.</p>

      <h3>Iframe-Based Providers</h3>

      <h4>YouTube</h4>
      <p>Supports standard <code>youtube.com/watch?v=</code>, <code>youtu.be/</code>, and <code>youtube.com/embed/</code> URLs. Uses postMessage for full playback control. Supports quality selection via player parameters.</p>
      <div className="code-block">
        <pre>resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// engine: 'iframe', type: 'youtube'</pre>
      </div>

      <h4>Vimeo</h4>
      <p>Supports <code>{'vimeo.com/{id}'}</code> URLs (including private video hashes). Uses postMessage for control. Supports autoplay, loop, and muted parameters.</p>

      <h4>Wistia</h4>
      <p>Supports <code>{'fast.wistia.net/embed/iframe/{id}'}</code> and <code>{'*.wistia.com/medias/{id}'}</code> URLs. Full postMessage API integration.</p>

      <h4>Cloudflare Stream</h4>
      <p>Supports <code>{'watch.cloudflarestream.com/{id}'}</code> and <code>{'cloudflarestream.com/{id}'}</code> URLs. Renders via iframe with DASH/HLS fallback for signed URLs.</p>

      <h4>FastPix</h4>
      <p>Supports <code>{'fastpix.io/embed/{id}'}</code> URLs. Performance-first video platform integration.</p>

      <h4>JW Player</h4>
      <p>Supports <code>{'cdn.jwplayer.com/players/{id}'}</code> URLs. Cloud-hosted iframe embeds with full control.</p>

      <h4>Kaltura</h4>
      <p>Supports <code>{'cdnapi.kaltura.com/p/{pid}/sp/{sp}/embedIframeJs/uiconf_id/{uid}/partner_id/{pid}?...'}</code> URLs. Dynamic player configuration via postMessage.</p>

      <h3>Direct Media Providers</h3>

      <h4>Dropbox</h4>
      <p>Converts <code>{'dropbox.com/s/{path}'}</code> share links to direct <code>?dl=1</code> MP4 URLs. Plays via the native <code>&lt;video&gt;</code> engine.</p>

      <h4>Direct MP4 / WebM</h4>
      <p>Any URL ending in <code>.mp4</code>, <code>.webm</code>, <code>.ogg</code>, <code>.mov</code>, <code>.avi</code>, <code>.mkv</code>, or <code>.3gp</code> is played directly via the native <code>&lt;video&gt;</code> engine. This is the fallback resolver.</p>

      <h3>Adaptive Streaming</h3>

      <h4>HLS (HTTP Live Streaming)</h4>
      <p>URLs ending in <code>.m3u8</code> are played natively on Safari or via the dynamically imported <code>hls.js</code> library on other browsers.</p>

      <h4>DASH (Dynamic Adaptive Streaming over HTTP)</h4>
      <p>URLs ending in <code>.mpd</code> are played via the dynamically imported <code>dashjs</code> library.</p>

      <div className="note-callout">
        <div className="note-callout-title">Optional Peer Dependencies</div>
        <p><code>hls.js</code> and <code>dashjs</code> are optional peer dependencies. They are dynamically imported only when an HLS or DASH video is loaded. No bundler configuration required.</p>
      </div>

      <h3>Fallback</h3>
      <h4>Iframely Fallback</h4>
      <p>When every built-in resolver above returns <code>null</code>, UEP can optionally fall back to the <a href="https://iframely.com" target="_blank" rel="noopener noreferrer">Iframely</a> "any URL &rarr; embed" API. It's opt-in and only activates if you supply your own key via the <code>iframelyKey</code> player option:</p>
      <div className="code-block">
        <pre>{`createPlayer('#container', {
  url: someUnrecognizedUrl,
  iframelyKey: 'your-md5-hashed-client-key',
})`}</pre>
      </div>
      <div className="note-callout">
        <div className="note-callout-title">Client Key, Not Your Private Key</div>
        <p><code>iframelyKey</code> must be Iframely's client-safe key &mdash; the MD5 hash of your real API key, exactly as documented at <a href="https://iframely.com/docs/allow-origins" target="_blank" rel="noopener noreferrer">iframely.com/docs/allow-origins</a>. It's sent from the browser, so never pass your raw private key here; there is no separate boolean toggle or environment variable &mdash; passing <code>iframelyKey</code> is what enables the fallback.</p>
      </div>
      <p>Resolution via Iframely happens over the network (unlike every resolver above, which is a pure, synchronous, offline URL match) and is marked <code>stability: 'experimental'</code> since there's no protocol adapter for the underlying provider &mdash; the interaction shield and postMessage control are unavailable for whatever embeds Iframely returns.</p>
    </div>
  ),

  frameworks: () => (
    <div className="docs-article">
      <h2>Framework Integration</h2>
      <p>Universal Embed Player ships with optional adapters for React, Vue 3, and Svelte 5, plus a Web Component that works with no adapter at all. All four are completely optional &mdash; the core library works with plain JavaScript on its own.</p>

      <h3>React</h3>
      <p>The React adapter provides a <code>&lt;Player&gt;</code> component with full TypeScript support. It mounts the player on <code>useEffect</code> and re-mounts only when <code>url</code> changes; every other prop is read fresh on that mount.</p>
      <div className="code-block">
        <pre>{`import { Player } from 'universal-embed-player/react'

function MyVideo() {
  return (
    <Player
      url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      controls={true}
      autoplay={false}
      theme={{
        primaryColor: '#8185f4',
        accentColor: '#22d3ee',
      }}
      onEvent={(event) => console.log(event.type, event)}
    />
  )
}`}</pre>
      </div>

      <h4>Props</h4>
      <p>Every <code>PlayerOptions</code> key (see API Reference) is forwarded as a same-named prop, plus two React-only additions:</p>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>url</td><td>string</td><td>Video URL (required)</td></tr>
          <tr><td>controls / shield / autoplay / muted / loop / light</td><td>boolean</td><td>Same defaults as <code>createPlayer</code></td></tr>
          <tr><td>poster</td><td>string</td><td>Custom poster; also used server-side for the SSR fallback image</td></tr>
          <tr><td>playbackRates / volume / volumeKey / videoSize</td><td>—</td><td>Same as <code>createPlayer</code></td></tr>
          <tr><td>centerPlayButton</td><td>boolean</td><td>Center play/pause button (default false)</td></tr>
          <tr><td>theme</td><td>PlayerTheme</td><td>Theme overrides &mdash; use <code>primaryColor</code>/<code>accentColor</code>, not <code>primary</code>/<code>accent</code></td></tr>
          <tr><td>seo</td><td>SeoMetadata</td><td>Rendered server-side as real JSON-LD, unlike the client-injected vanilla/Web Component version</td></tr>
          <tr><td>onEvent</td><td>function</td><td>Unified event callback</td></tr>
          <tr><td>className</td><td>string</td><td>Additional CSS class (React-only, not part of <code>PlayerOptions</code>)</td></tr>
          <tr><td>style</td><td>object</td><td>Inline styles (React-only, not part of <code>PlayerOptions</code>)</td></tr>
        </tbody>
      </table>
      <p><code>loadingSpinner</code> and <code>iframelyKey</code> aren't currently forwarded by the React, Vue, or Svelte adapters &mdash; use the Web Component or vanilla <code>createPlayer</code> if you need those. <code>glowingPlaceholder</code> and <code>glowStyle</code> go further still: only vanilla <code>createPlayer</code> forwards them today, not even the Web Component.</p>

      <div className="note-callout">
        <div className="note-callout-title">SSR-Safe</div>
        <p>The real player only mounts client-side. Until then, the server (and initial client) render emits a real <code>&lt;a href={'{'}url{'}'}&gt;&lt;img src={'{'}poster{'}'}&gt;&lt;/a&gt;</code> plus optional JSON-LD &mdash; visible to crawlers that don't execute JavaScript &mdash; instead of an empty container.</p>
      </div>

      <div className="note-callout">
        <div className="note-callout-title">Peer Dependency</div>
        <p>The React adapter requires <code>react &gt;= 18.0.0</code> as an optional peer dependency. It is not imported unless you import from <code>universal-embed-player/react</code>.</p>
      </div>

      <hr />

      <h3>Vue 3</h3>
      <p>The Vue 3 adapter provides a <code>&lt;Player&gt;</code> component that uses <code>onMounted</code> for setup, <code>onBeforeUnmount</code> for teardown, and re-mounts on <code>url</code> changes via a <code>watch</code>. Same prop surface and SSR fallback behavior as React above.</p>
      <div className="code-block">
        <pre>{`import { Player } from 'universal-embed-player/vue'

<template>
  <Player
    url="https://vimeo.com/76979871"
    :controls="true"
    :theme="{ primaryColor: '#8185f4', accentColor: '#22d3ee' }"
    @event="onEvent"
  />
</template>`}</pre>
      </div>

      <h4>Props</h4>
      <p>Same props as React above (camelCase, e.g. <code>centerPlayButton</code>, <code>videoSize</code>), emitting a Vue <code>event</code> instead of calling an <code>onEvent</code> callback. No <code>className</code>/<code>style</code> equivalents &mdash; style the wrapper with a parent selector instead.</p>

      <div className="note-callout">
        <div className="note-callout-title">Peer Dependency</div>
        <p>Requires <code>vue &gt;= 3.0.0</code> as an optional peer dependency, only imported from <code>universal-embed-player/vue</code>.</p>
      </div>

      <hr />

      <h3>Svelte 5+</h3>
      <p>The Svelte adapter provides a <code>&lt;Player&gt;</code> component built on Svelte 5 runes (<code>$props</code>/<code>$state</code>/<code>$effect</code>) &mdash; there is no legacy Svelte 3/4 support. Same SSR-safe fallback as React/Vue: <code>onMount</code> gates the real player, so a SvelteKit server render emits the same poster+link+JSON-LD fallback.</p>
      <div className="code-block">
        <pre>{`<script>
  import { Player } from 'universal-embed-player/svelte'
  let { url } = $props()
</script>

<Player
  {url}
  controls
  theme={{ primaryColor: '#8185f4', accentColor: '#22d3ee' }}
  onEvent={(event) => console.log(event.type, event)}
/>`}</pre>
      </div>
      <div className="note-callout">
        <div className="note-callout-title">Types Are Hand-Maintained</div>
        <p>Unlike every other adapter, <code>universal-embed-player/svelte</code>'s <code>.d.ts</code> is hand-written, not generated from JSDoc &mdash; tsc's declaration emit can't process <code>.svelte</code> files. It mirrors <code>PlayerOptions</code> and needs manual updates if that type changes.</p>
      </div>

      <hr />

      <h3>Web Component</h3>
      <p>Works in any framework &mdash; or none &mdash; with no adapter of its own. Registers a real custom element, so it needs no build step either.</p>
      <div className="code-block">
        <pre>{`import 'universal-embed-player/webcomponent' // registers <uep-player>`}</pre>
        <pre>{`<uep-player url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" controls></uep-player>`}</pre>
      </div>
      <p>Every <code>PlayerOptions</code> key is available as both a kebab-case attribute (e.g. <code>video-size</code>, <code>center-play-button</code>) and a same-named camelCase JS property. Complex options (<code>theme</code>, <code>seo</code>, <code>playback-rates</code>) accept either a JSON-string attribute or a JS property assignment:</p>
      <div className="code-block">
        <pre>{`const el = document.querySelector('uep-player')
el.theme = { primaryColor: '#ff0000' }
el.addEventListener('uep-play', (e) => console.log(e.detail))`}</pre>
      </div>
      <div className="note-callout">
        <div className="note-callout-title">Boolean Attributes Are Opt-Out</div>
        <p><code>controls</code>, <code>shield</code>, <code>autoplay</code>, <code>muted</code>, <code>loop</code>, <code>light</code>, <code>center-play-button</code>, and <code>loading-spinner</code> are true unless the attribute's value is literally the string <code>"false"</code> &mdash; not the native "present = true" convention. This is the only convention that survives naive attribute stringification (e.g. Angular's <code>[attr.controls]="x"</code> calling <code>setAttribute('controls', String(x))</code>). Property assignment (<code>el.controls = false</code>) is unaffected.</p>
      </div>
      <p>To register under a different tag name, import the class from <code>.../webcomponent/element</code> instead of the plain <code>.../webcomponent</code> entry (which already registers <code>uep-player</code> and would throw on a second <code>customElements.define()</code>):</p>
      <div className="code-block">
        <pre>{`import { UepPlayerElement } from 'universal-embed-player/webcomponent/element'
customElements.define('my-video', UepPlayerElement)`}</pre>
      </div>
    </div>
  ),

  theming: () => (
    <div className="docs-article">
      <h2>Theming &amp; Customization</h2>
      <p>The control bar is rendered inside a Shadow DOM and themed entirely via CSS custom properties. This ensures complete style isolation from the host page.</p>

      <h3>CSS Custom Properties</h3>
      <p>Every property below is written by the <code>theme</code> option onto the player's mount container (custom properties pierce the Shadow DOM boundary, so the control bar picks them up with no re-render). Omitted keys fall back to the default shown, which is also what the control bar's own stylesheet declares.</p>
      <table>
        <thead><tr><th>theme key</th><th>CSS Variable</th><th>Default</th></tr></thead>
        <tbody>
          <tr><td>primaryColor</td><td>--uep-primary-color</td><td>#6d5efc</td></tr>
          <tr><td>accentColor</td><td>--uep-accent-color</td><td>#ffffff</td></tr>
          <tr><td>fontFamily</td><td>--uep-font-family</td><td>system-ui, sans-serif</td></tr>
          <tr><td>barBackground</td><td>--uep-bar-bg</td><td>rgba(20, 18, 32, 0.55)</td></tr>
          <tr><td>barBlur</td><td>--uep-bar-blur</td><td>10px</td></tr>
          <tr><td>barRadius</td><td>--uep-bar-radius</td><td>999px</td></tr>
          <tr><td>barPadding</td><td>--uep-bar-padding</td><td>5px 10px</td></tr>
          <tr><td>barMargin</td><td>--uep-bar-margin</td><td>8px</td></tr>
          <tr><td>buttonSize</td><td>--uep-btn-size</td><td>26px</td></tr>
          <tr><td>sliderHeight</td><td>--uep-slider-height</td><td>3px</td></tr>
          <tr><td>timeFontSize</td><td>--uep-time-size</td><td>11px</td></tr>
        </tbody>
      </table>

      <h3>Theming via Options</h3>
      <p>Pass theme values directly in the options object &mdash; note the <code>Color</code> suffix on the two identity keys, a common typo source:</p>
      <div className="code-block">
        <pre>{`createPlayer('#container', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  theme: {
    primaryColor: '#ff6b6b',
    accentColor: '#ffd93d',
    fontFamily: '"Outfit", sans-serif',
    barBackground: 'rgba(0, 0, 0, 0.9)',
    barBlur: '20px',
    barRadius: '32px',
    barMargin: '24px',
  },
})`}</pre>
      </div>

      <h3>Light Mode &amp; the Glow Placeholder</h3>
      <p>When <code>light: true</code>, the player shows a poster thumbnail instead of loading the video immediately, deferring all engine/script loading until the user clicks play &mdash; ideal for pages with many embeds. A default poster only exists for providers with a deterministic thumbnail URL (YouTube today); everything else needs an explicit <code>poster</code> or shows the animated glow fallback below.</p>
      <div className="code-block">
        <pre>{`createPlayer('#container', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  light: true,
  poster: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', // omit to use the YouTube default
})`}</pre>
      </div>
      <p>The glow is an animated 4-stop gradient shown whenever there's no poster image yet (or permanently, if you force it on). Both the trigger and its colors are configurable:</p>
      <table>
        <thead><tr><th>Option</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>glowingPlaceholder</td><td>boolean</td><td><code>true</code> always shows the glow (even over a poster), <code>false</code> never shows it, unset shows it only while there's no static image</td></tr>
          <tr><td>glowStyle.color1&ndash;4</td><td>string</td><td>Gradient stop colors, default <code>#0e0b16</code> / <code>#1a1040</code> / <code>#2a1b4e</code> / <code>#3b185f</code></td></tr>
          <tr><td>glowStyle.angle</td><td>string</td><td>Gradient angle, default <code>-45deg</code></td></tr>
          <tr><td>glowStyle.speed</td><td>string</td><td>Animation duration, default <code>12s</code></td></tr>
        </tbody>
      </table>
      <div className="code-block">
        <pre>{`createPlayer('#container', {
  url: 'https://vimeo.com/76979871', // no deterministic thumbnail — glow shows until clicked
  light: true,
  glowStyle: { color1: '#0e0b16', color2: '#3b185f', speed: '6s' },
})`}</pre>
      </div>
      <div className="note-callout">
        <div className="note-callout-title">Vanilla createPlayer Only</div>
        <p><code>glowingPlaceholder</code> and <code>glowStyle</code> aren't currently forwarded by the React, Vue, Svelte, or Web Component adapters &mdash; use <code>createPlayer</code> directly if you need to customize the glow.</p>
      </div>
    </div>
  ),

  architecture: () => (
    <div className="docs-article">
      <h2>Architecture</h2>
      <p>Universal Embed Player is designed as a modular, tree-shakeable library with a clean separation of concerns.</p>

      <h3>Module Structure</h3>
      <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: '#04060d', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', overflow: 'auto', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
{`src/
├── index.js            # Public exports
├── core/
│   ├── controller.js   # Orchestrator
│   ├── events.js       # Event emitter
│   ├── types.js        # JSDoc typedefs
│   ├── lazy.js         # Light mode
│   ├── iframely-fallback.js
│   ├── engines/
│   │   ├── native.js   # <video> engine
│   │   ├── hls.js      # HLS engine
│   │   ├── dash.js     # DASH engine
│   │   ├── iframe.js   # iframe engine
│   │   ├── media-events.js
│   │   └── iframe-protocols/
│   │       ├── youtube.js
│   │       ├── vimeo.js
│   │       ├── wistia.js
│   │       └── kaltura.js
│   ├── ui/
│   │   ├── controls.js    # Shadow DOM bar
│   │   ├── shield.js      # Interaction shield
│   │   ├── center-play.js # Center play btn
│   │   ├── spinner.js     # Loading spinner
│   │   └── theme.js       # CSS var theming
│   └── seo.js          # VideoObject JSON-LD builder
├── resolvers/          # One per provider
│   ├── index.js        # Registry
│   ├── youtube.js
│   ├── vimeo.js
│   ├── wistia.js
│   ├── cloudflare-stream.js
│   ├── fastpix.js
│   ├── jwplayer.js
│   ├── kaltura.js
│   ├── dropbox.js
│   └── direct.js       # Extension fallback
├── react/              # React adapter
├── vue/                # Vue 3 adapter
├── svelte/             # Svelte 5 adapter (hand-written .d.ts)
└── webcomponent/       # <uep-player> custom element`}</pre>

      <h3>How It Works</h3>
      <p>The library follows a simple pipeline:</p>
      <ol>
        <li><strong>Resolve</strong> &mdash; The URL is matched against each resolver in priority order. The first match returns a <code>ResolvedSource</code> object with the playable URL, engine type, and provider-specific parameters.</li>
        <li><strong>Mount</strong> &mdash; The controller creates the appropriate engine (&lt;video&gt;, &lt;iframe&gt;, HLS, or DASH) and appends it to the container.</li>
        <li><strong>UI</strong> &mdash; The Shadow DOM control bar, interaction shield, and center play button are mounted. The theme is applied via CSS custom properties on the Shadow DOM host.</li>
        <li><strong>Control</strong> &mdash; The player instance is returned with a unified API. Engine-specific differences (e.g., postMessage for iframes, HTMLMediaElement for native video) are abstracted away.</li>
      </ol>

      <h3>Engine Selection</h3>
      <table>
        <thead><tr><th>Engine</th><th>Providers</th><th>Control Mechanism</th></tr></thead>
        <tbody>
          <tr><td>iframe</td><td>YouTube, Vimeo, Wistia, Cloudflare Stream, FastPix, JW Player, Kaltura</td><td>postMessage + iframe API</td></tr>
          <tr><td>native</td><td>MP4, WebM, Dropbox</td><td>HTMLMediaElement API</td></tr>
          <tr><td>hls</td><td>.m3u8 URLs</td><td>Safari native + hls.js</td></tr>
          <tr><td>dash</td><td>.mpd URLs</td><td>dashjs</td></tr>
        </tbody>
      </table>

      <h3>Tree-Shaking</h3>
      <p>UEP supports subpath exports for individual resolvers. If you only need YouTube support, you can import just that resolver:</p>
      <div className="code-block">
        <pre>import youtubeResolver from 'universal-embed-player/resolvers/youtube'</pre>
      </div>
      <p>Bundlers that support tree-shaking (Vite, Webpack, Rollup, esbuild) will eliminate unused resolvers from the final bundle.</p>

      <div className="note-callout">
        <div className="note-callout-title">Zero Runtime Dependencies</div>
        <p>The <code>dependencies</code> field in <code>package.json</code> is intentionally empty. Only <code>hls.js</code> and <code>dashjs</code> may be loaded at runtime, and only when needed.</p>
      </div>
    </div>
  ),
};

export function Docs() {
  const [activeArticle, setActiveArticle] = useState('quickstart');
  const Article = content[activeArticle];

  return (
    <section className="section-docs" id="docs">
      <div className="container docs-layout">
        <aside className="docs-sidebar" aria-label="Documentation sections">
          <span className="docs-sidebar-title">Documentation</span>
          <nav className="docs-nav">
            {articles.map((a) => (
              <button
                key={a.id}
                className={`docs-nav-btn ${activeArticle === a.id ? 'active' : ''}`}
                onClick={() => setActiveArticle(a.id)}
              >
                {a.title}
              </button>
            ))}
          </nav>
        </aside>

        <div className="docs-content">
          <Article />
        </div>
      </div>
    </section>
  );
}
