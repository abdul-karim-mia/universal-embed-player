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
          <tr><td>url</td><td>string</td><td>—</td><td>Video URL to resolve and play</td></tr>
          <tr><td>controls</td><td>boolean</td><td>true</td><td>Show the Shadow DOM control bar</td></tr>
          <tr><td>shield</td><td>boolean</td><td>true</td><td>Interaction shield over iframe embeds</td></tr>
          <tr><td>autoplay</td><td>boolean</td><td>false</td><td>Start playback automatically</td></tr>
          <tr><td>muted</td><td>boolean</td><td>false</td><td>Start muted (required for most autoplay)</td></tr>
          <tr><td>loop</td><td>boolean</td><td>false</td><td>Loop the video</td></tr>
          <tr><td>light</td><td>boolean</td><td>false</td><td>Thumbnail-first light mode</td></tr>
          <tr><td>centerPlay</td><td>boolean</td><td>true</td><td>Show centered play button overlay</td></tr>
          <tr><td>poster</td><td>string | null</td><td>null</td><td>Custom poster image URL</td></tr>
          <tr><td>theme</td><td>ThemeOptions</td><td>{ }</td><td>CSS custom property theming</td></tr>
          <tr><td>onEvent</td><td>function</td><td>—</td><td>Event callback (type, data) =&gt; void</td></tr>
        </tbody>
      </table>

      <h4>Theme Options</h4>
      <table>
        <thead><tr><th>Property</th><th>CSS Variable</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>primary</td><td>--uep-primary</td><td>Primary brand color</td></tr>
          <tr><td>accent</td><td>--uep-accent</td><td>Accent highlight color</td></tr>
          <tr><td>fontFamily</td><td>--uep-font-family</td><td>Control bar font</td></tr>
          <tr><td>barBackground</td><td>--uep-bar-bg</td><td>Control bar background</td></tr>
          <tr><td>barBackdropFilter</td><td>--uep-bar-blur</td><td>Backdrop filter value</td></tr>
          <tr><td>barBorderRadius</td><td>--uep-bar-radius</td><td>Floating bar border radius</td></tr>
          <tr><td>barMargin</td><td>--uep-bar-margin</td><td>Margin from container edges</td></tr>
        </tbody>
      </table>

      <h4>Returned Player Instance</h4>
      <table>
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>.ready</td><td>Promise that resolves when the player is fully mounted</td></tr>
          <tr><td>.play()</td><td>Start or resume playback</td></tr>
          <tr><td>.pause()</td><td>Pause playback</td></tr>
          <tr><td>.seekTo(seconds)</td><td>Seek to a specific time</td></tr>
          <tr><td>.setVolume(0-1)</td><td>Set volume level</td></tr>
          <tr><td>.mute()</td><td>Mute audio</td></tr>
          <tr><td>.unmute()</td><td>Unmute audio</td></tr>
          <tr><td>.toggleMute()</td><td>Toggle mute state</td></tr>
          <tr><td>.setPlaybackRate(rate)</td><td>Set playback speed</td></tr>
          <tr><td>.setVideoSize(size)</td><td>Set object-fit (contain/cover/fill)</td></tr>
          <tr><td>.destroy()</td><td>Remove player and clean up</td></tr>
        </tbody>
      </table>

      <h3>resolveSource(url)</h3>
      <p>Analyzes a URL and returns a <code>ResolvedSource</code> object if the source is supported, or <code>null</code> if it isn't.</p>
      <div className="code-block">
        <pre>{`resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// {
//   type: 'youtube',
//   engine: 'iframe',
//   url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?...',
//   params: { ... }
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
      <p>Supports <code>vimeo.com/{id}</code> URLs (including private video hashes). Uses postMessage for control. Supports autoplay, loop, and muted parameters.</p>

      <h4>Wistia</h4>
      <p>Supports <code>fast.wistia.net/embed/iframe/{id}</code> and <code>*.wistia.com/medias/{id}</code> URLs. Full postMessage API integration.</p>

      <h4>Cloudflare Stream</h4>
      <p>Supports <code>watch.cloudflarestream.com/{id}</code> and <code>cloudflarestream.com/{id}</code> URLs. Renders via iframe with DASH/HLS fallback for signed URLs.</p>

      <h4>FastPix</h4>
      <p>Supports <code>fastpix.io/embed/{id}</code> URLs. Performance-first video platform integration.</p>

      <h4>JW Player</h4>
      <p>Supports <code>cdn.jwplayer.com/players/{id}</code> URLs. Cloud-hosted iframe embeds with full control.</p>

      <h4>Kaltura</h4>
      <p>Supports <code>cdnapi.kaltura.com/p/{pid}/sp/{sp}/embedIframeJs/uiconf_id/{uid}/partner_id/{pid}?...</code> URLs. Dynamic player configuration via postMessage.</p>

      <h3>Direct Media Providers</h3>

      <h4>Dropbox</h4>
      <p>Converts <code>dropbox.com/s/{path}</code> share links to direct <code>?dl=1</code> MP4 URLs. Plays via the native <code>&lt;video&gt;</code> engine.</p>

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
      <p>When enabled via the <code>iframelyFallback</code> option and <code>IFRAMELY_API_KEY</code> environment variable, UEP can fall back to the Iframely API for unrecognized URLs. This is an opt-in feature for edge cases.</p>
    </div>
  ),

  frameworks: () => (
    <div className="docs-article">
      <h2>Framework Integration</h2>
      <p>Universal Embed Player ships with optional framework adapters for React and Vue 3. Both are completely optional &mdash; the core library works with plain JavaScript.</p>

      <h3>React</h3>
      <p>The React adapter provides a <code>&lt;Player&gt;</code> component with full TypeScript support. It mounts the player on <code>useEffect</code> and tears it down on unmount.</p>
      <div className="code-block">
        <pre>{`import { Player } from 'universal-embed-player/react'

function MyVideo() {
  return (
    <Player
      url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      controls={true}
      autoplay={false}
      theme={{
        primary: '#8185f4',
        accent: '#22d3ee',
      }}
    />
  )
}`}</pre>
      </div>

      <h4>Props</h4>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>url</td><td>string</td><td>Video URL (required)</td></tr>
          <tr><td>controls</td><td>boolean</td><td>Show control bar</td></tr>
          <tr><td>shield</td><td>boolean</td><td>Interaction shield</td></tr>
          <tr><td>autoplay</td><td>boolean</td><td>Auto-start playback</td></tr>
          <tr><td>muted</td><td>boolean</td><td>Start muted</td></tr>
          <tr><td>loop</td><td>boolean</td><td>Loop video</td></tr>
          <tr><td>light</td><td>boolean</td><td>Light mode</td></tr>
          <tr><td>centerPlay</td><td>boolean</td><td>Center play button</td></tr>
          <tr><td>theme</td><td>object</td><td>Theme overrides</td></tr>
          <tr><td>className</td><td>string</td><td>Additional CSS class</td></tr>
          <tr><td>style</td><td>object</td><td>Inline styles</td></tr>
        </tbody>
      </table>

      <div className="note-callout">
        <div className="note-callout-title">Peer Dependency</div>
        <p>The React adapter requires <code>react &gt;= 18.0.0</code> as an optional peer dependency. It is not imported unless you import from <code>universal-embed-player/react</code>.</p>
      </div>

      <hr />

      <h3>Vue 3</h3>
      <p>The Vue 3 adapter provides a <code>&lt;Player&gt;</code> component that uses <code>onMounted</code> for setup and <code>onUnmounted</code> for teardown. Fully reactive to prop changes.</p>
      <div className="code-block">
        <pre>{`import { Player } from 'universal-embed-player/vue'

<template>
  <Player
    url="https://vimeo.com/76979871"
    :controls="true"
    :theme="{ primary: '#8185f4', accent: '#22d3ee' }"
  />
</template>`}</pre>
      </div>

      <h4>Props</h4>
      <p>Same props as the React component, with Vue-cased equivalents where applicable.</p>
    </div>
  ),

  theming: () => (
    <div className="docs-article">
      <h2>Theming &amp; Customization</h2>
      <p>The control bar is rendered inside a Shadow DOM and themed entirely via CSS custom properties. This ensures complete style isolation from the host page.</p>

      <h3>CSS Custom Properties</h3>
      <table>
        <thead><tr><th>Variable</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>--uep-primary</td><td>#8185f4</td><td>Primary brand color (buttons, active states)</td></tr>
          <tr><td>--uep-accent</td><td>#22d3ee</td><td>Accent color (time, highlights)</td></tr>
          <tr><td>--uep-font-family</td><td>Inter, sans-serif</td><td>Control bar font</td></tr>
          <tr><td>--uep-bar-bg</td><td>rgba(6, 9, 21, 0.85)</td><td>Floating bar background</td></tr>
          <tr><td>--uep-bar-blur</td><td>blur(16px)</td><td>Bar backdrop blur</td></tr>
          <tr><td>--uep-bar-radius</td><td>24px</td><td>Bar border radius</td></tr>
          <tr><td>--uep-bar-margin</td><td>16px</td><td>Bar margin from edges</td></tr>
          <tr><td>--uep-btn-size</td><td>36px</td><td>Button size in the bar</td></tr>
          <tr><td>--uep-slider-height</td><td>4px</td><td>Volume/progress slider height</td></tr>
          <tr><td>--uep-time-font-size</td><td>11px</td><td>Time display font size</td></tr>
        </tbody>
      </table>

      <h3>Theming via Options</h3>
      <p>You can pass theme values directly in the options object. These are applied as CSS custom properties on the Shadow DOM host element.</p>
      <div className="code-block">
        <pre>{`createPlayer('#container', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  theme: {
    primary: '#ff6b6b',
    accent: '#ffd93d',
    fontFamily: '"Outfit", sans-serif',
    barBackground: 'rgba(0, 0, 0, 0.9)',
    barBackdropFilter: 'blur(20px)',
    barBorderRadius: '32px',
    barMargin: '24px',
  },
})`}</pre>
      </div>

      <h3>Light Mode</h3>
      <p>When <code>light: true</code>, the player shows a poster thumbnail with an animated glow placeholder instead of loading the video immediately. Clicking the play button loads the video on demand. This is ideal for pages with many embeds where you want to defer loading.</p>
      <div className="code-block">
        <pre>{`createPlayer('#container', {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  light: true,
  poster: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
})`}</pre>
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
│   └── ui/
│       ├── controls.js    # Shadow DOM bar
│       ├── shield.js      # Interaction shield
│       ├── center-play.js # Center play btn
│       ├── spinner.js     # Loading spinner
│       └── theme.js       # CSS var theming
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
└── vue/                # Vue 3 adapter`}</pre>

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
