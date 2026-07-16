// Single consolidated test file: every provider is exercised here in one place
// using Node's built-in test runner (zero test-framework dependency, per
// rules.md §1a dependency ceiling). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSource } from '../src/index.js';
import { buildVideoObjectJsonLd, stringifyForScriptTag } from '../src/core/seo.js';

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------
test('youtube: standard watch URL', () => {
  const r = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(r.provider, 'youtube');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, 'dQw4w9WgXcQ');
  assert.equal(
    r.embedUrl,
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=0&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=1&showinfo=0&playsinline=1',
  );
});

test('youtube: applies brand-minimization embed params', () => {
  const r = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const params = new URL(r.embedUrl).searchParams;
  assert.equal(params.get('controls'), '0');
  assert.equal(params.get('modestbranding'), '1');
  assert.equal(params.get('rel'), '0');
  assert.equal(params.get('iv_load_policy'), '3');
  assert.equal(params.get('cc_load_policy'), '1');
  assert.equal(params.get('showinfo'), '0');
});

test('youtube: parses bare-seconds t= start time into the embed start param', () => {
  const r = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90');
  assert.equal(new URL(r.embedUrl).searchParams.get('start'), '90');
});

test('youtube: parses composite t=1m30s start time into the embed start param', () => {
  const r = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s');
  assert.equal(new URL(r.embedUrl).searchParams.get('start'), '90');
});

test('youtube: no t= param means no start param is set', () => {
  const r = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(new URL(r.embedUrl).searchParams.has('start'), false);
});

test('youtube: youtu.be short link', () => {
  const r = resolveSource('https://youtu.be/dQw4w9WgXcQ');
  assert.equal(r.provider, 'youtube');
  assert.equal(r.id, 'dQw4w9WgXcQ');
});

test('youtube: shorts URL', () => {
  const r = resolveSource('https://www.youtube.com/shorts/aBcDeFgHiJk');
  assert.equal(r.provider, 'youtube');
  assert.equal(r.id, 'aBcDeFgHiJk');
});

test('youtube: live URL', () => {
  const r = resolveSource('https://www.youtube.com/live/aBcDeFgHiJk?feature=share');
  assert.equal(r.provider, 'youtube');
  assert.equal(r.id, 'aBcDeFgHiJk');
});

test('youtube: watch URL with extra query params before v=', () => {
  const r = resolveSource('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ&t=30s');
  assert.equal(r.id, 'dQw4w9WgXcQ');
});

test('youtube: nocookie domain embed URL', () => {
  const r = resolveSource('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.equal(r.provider, 'youtube');
  assert.equal(r.id, 'dQw4w9WgXcQ');
});

test('youtube: rejects malformed/short id', () => {
  const r = resolveSource('https://www.youtube.com/watch?v=short');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Vimeo
// ---------------------------------------------------------------------------
test('vimeo: standard video URL', () => {
  const r = resolveSource('https://vimeo.com/76979871');
  assert.equal(r.provider, 'vimeo');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, '76979871');
  assert.equal(
    r.embedUrl,
    'https://player.vimeo.com/video/76979871?byline=0&portrait=0&title=0&controls=0&badge=0&playsinline=1',
  );
});

test('vimeo: applies brand-minimization embed params', () => {
  const r = resolveSource('https://vimeo.com/76979871');
  const params = new URL(r.embedUrl).searchParams;
  assert.equal(params.get('byline'), '0');
  assert.equal(params.get('portrait'), '0');
  assert.equal(params.get('title'), '0');
  assert.equal(params.get('controls'), '0');
  assert.equal(params.get('badge'), '0');
});

test('vimeo: private-hash share URL (path form vimeo.com/ID/HASH)', () => {
  const r = resolveSource('https://vimeo.com/76979871/abcdef1234');
  assert.equal(r.id, '76979871');
  assert.equal(new URL(r.embedUrl).searchParams.get('h'), 'abcdef1234');
});

test('vimeo: private-hash query param form (player.vimeo.com/video/ID?h=HASH)', () => {
  // This is the exact shape Vimeo's own embed-code/oEmbed generator emits —
  // previously the hash was silently dropped because only the path form was read.
  const r = resolveSource('https://player.vimeo.com/video/76979871?h=abcdef1234');
  assert.equal(r.id, '76979871');
  assert.equal(new URL(r.embedUrl).searchParams.get('h'), 'abcdef1234');
});

test('vimeo: already-built player embed URL', () => {
  const r = resolveSource('https://player.vimeo.com/video/76979871');
  assert.equal(r.provider, 'vimeo');
  assert.equal(r.id, '76979871');
});

test('vimeo: rejects an injection-shaped hash instead of interpolating it', () => {
  // Guards the security boundary in rules.md §2.4: the query-param hash form
  // comes from searchParams.get('h'), which URL-decodes freely, so it needs
  // its own allow-list check (HASH_RE) rather than relying on regex capture
  // shape like the path form does. Mirrors the YouTube id allow-list test below.
  const r = resolveSource('https://player.vimeo.com/video/76979871?h=%22%3E%3Cscript%3E');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Dailymotion — explicitly not supported (see README "Supported sources")
// ---------------------------------------------------------------------------
test('dailymotion: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://www.dailymotion.com/video/x7tgd2y_some-title_tech');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Wistia
// ---------------------------------------------------------------------------
test('wistia: medias URL', () => {
  const r = resolveSource('https://fast.wistia.com/medias/abc123def4');
  assert.equal(r.provider, 'wistia');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, 'abc123def4');
});

test('wistia: wi.st short link', () => {
  const r = resolveSource('https://wi.st/medias/abc123def4');
  assert.equal(r.provider, 'wistia');
  assert.equal(r.id, 'abc123def4');
});

// ---------------------------------------------------------------------------
// Cloudflare Stream
// ---------------------------------------------------------------------------
test('cloudflare stream: customer-code embed URL resolves to HLS', () => {
  const uid = '6b9e68b07dfee8cc2d116e4c51d6a957';
  const r = resolveSource(`https://customer-f33zs165nr7gyfy4.cloudflarestream.com/${uid}/iframe`);
  assert.equal(r.provider, 'cloudflare-stream');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, uid);
  assert.ok(r.src.includes('/manifest/video.m3u8'));
});

test('cloudflare stream: short iframe URL resolved as iframe (fallback)', () => {
  const id = 'e1c94a8a8f0d4e8f8b8b8b8b8b8b8b8b';
  const r = resolveSource(`https://iframe.cloudflarestream.com/${id}`);
  assert.equal(r.provider, 'cloudflare-stream');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, id);
});

test('cloudflare stream: direct .m3u8 manifest URL is handled by the generic HLS resolver', () => {
  const r = resolveSource('https://customer-abc123.cloudflarestream.com/xyz/manifest/video.m3u8');
  assert.equal(r.provider, 'hls');
  assert.equal(r.type, 'hls');
});

// ---------------------------------------------------------------------------
// FastPix
// ---------------------------------------------------------------------------
test('fastpix: play.fastpix.io resolves to HLS', () => {
  const id = 'abc123-def456';
  const r = resolveSource(`https://play.fastpix.io/?playbackId=${id}`);
  assert.equal(r.provider, 'fastpix');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, id);
  assert.equal(r.src, `https://stream.fastpix.io/${id}.m3u8`);
});

test('fastpix: play.fastpix.com also resolves to HLS', () => {
  const id = 'xyz789';
  const r = resolveSource(`https://play.fastpix.com/?playbackId=${id}`);
  assert.equal(r.provider, 'fastpix');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, id);
  assert.equal(r.src, `https://stream.fastpix.io/${id}.m3u8`);
});

test('fastpix: direct .m3u8 stream URL goes to generic HLS resolver', () => {
  const r = resolveSource('https://stream.fastpix.io/abc123-def456.m3u8');
  assert.equal(r.provider, 'hls');
  assert.equal(r.type, 'hls');
});

// ---------------------------------------------------------------------------
// JW Player
// ---------------------------------------------------------------------------
test('jwplayer: cdn.jwplayer.com players URL → HLS', () => {
  const r = resolveSource('https://cdn.jwplayer.com/players/AbCd1234-EfGh5678.html');
  assert.equal(r.provider, 'jwplayer');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, 'AbCd1234');
  assert.equal(r.src, 'https://cdn.jwplayer.com/manifests/AbCd1234.m3u8');
  assert.equal(r.poster, 'https://cdn.jwplayer.com/v2/media/AbCd1234/poster.jpg?width=720');
});

test('jwplayer: content.jwplatform.com players URL → HLS', () => {
  const r = resolveSource('https://content.jwplatform.com/players/AbCd1234-EfGh5678.html');
  assert.equal(r.provider, 'jwplayer');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, 'AbCd1234');
  assert.equal(r.src, 'https://cdn.jwplayer.com/manifests/AbCd1234.m3u8');
  assert.equal(r.poster, 'https://cdn.jwplayer.com/v2/media/AbCd1234/poster.jpg?width=720');
});

test('jwplayer: cdn.jwplayer.com manifest URL', () => {
  const r = resolveSource('https://cdn.jwplayer.com/manifests/yp34SRmf.m3u8');
  assert.equal(r.provider, 'jwplayer');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, 'yp34SRmf');
  assert.equal(r.src, 'https://cdn.jwplayer.com/manifests/yp34SRmf.m3u8');
  assert.equal(r.poster, 'https://cdn.jwplayer.com/v2/media/yp34SRmf/poster.jpg?width=720');
});

test('jwplayer: content.jwplatform.com manifest URL', () => {
  const r = resolveSource('https://content.jwplatform.com/manifests/yp34SRmf.m3u8');
  assert.equal(r.provider, 'jwplayer');
  assert.equal(r.type, 'hls');
  assert.equal(r.id, 'yp34SRmf');
  assert.equal(r.src, 'https://content.jwplatform.com/manifests/yp34SRmf.m3u8');
  assert.equal(r.poster, 'https://cdn.jwplayer.com/v2/media/yp34SRmf/poster.jpg?width=720');
});

// ---------------------------------------------------------------------------
// Kaltura
// ---------------------------------------------------------------------------
test('kaltura: extwidget/preview iframe URL', () => {
  const r = resolveSource(
    'https://www.kaltura.com/index.php/extwidget/preview/partner_id/723092/uiconf_id/25439611/entry_id/1_qh8ydw54/embed/iframe',
  );
  assert.equal(r.provider, 'kaltura');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, '1_qh8ydw54');
});

test('kaltura: rejects a URL missing a required param', () => {
  const r = resolveSource('https://www.kaltura.com/index.php/extwidget/preview/partner_id/723092/embed/iframe');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Loom — removed: no public control API found (no JS SDK, no postMessage
// protocol), so it can never get our custom control bar/shield the way
// rules.md §4.1 requires. See plan.md for the full writeup.
// ---------------------------------------------------------------------------
test('loom: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://www.loom.com/share/1eeb2b4b64ed4c60900ee45d16fa9914');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Vidyard — removed. The VidyardV4 player API genuinely works (play, pause,
// seek, setVolume, timeupdate all confirmed live), but Vidyard has no
// documented URL parameter or data attribute to hide its native control
// bar — same-origin policy means no client-side code can hide it any other
// way (rules.md §4.1). Confirmed visually: Vidyard's own share icon and
// controls stayed visible underneath our control bar. See plan.md §0.6.
// ---------------------------------------------------------------------------
test('vidyard: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://share.vidyard.com/watch/9pdfZ4o1jmmnFN8t3D1suH');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Brightcove — removed: the only documented cross-origin postMessage
// mechanism for a players.brightcove.net iframe is events-only/read-only
// (no command channel in), so it can't get a real control bar. See plan.md.
// ---------------------------------------------------------------------------
test('brightcove: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://players.brightcove.net/1234567890/default_default/index.html?videoId=6111111111001');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Panopto — removed. A resolver and a protocol adapter were both built and
// looked solid on paper (EmbedApi constructor/events confirmed via multiple
// independent docs), but live-browser verification showed the script URL
// (https://{serverName}/Panopto/Resources/embedapi.js) 404s — it does not
// exist at that path on Panopto's own demo tenant. No correct URL could be
// found after further probing, so window.EmbedApi never loads and the
// adapter can never attach. See plan.md §0.6.
// ---------------------------------------------------------------------------
test('panopto: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource(
    'https://acme.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=12345678-90ab-cdef-1234-567890abcdef',
  );
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Bunny.net Stream — removed. The Player.js command channel genuinely works
// (fixed a real string-vs-object postMessage bug along the way, then
// confirmed play/pause/seek/volume/timeupdate all live), but Bunny has no
// documented URL parameter to hide its native control bar — that's a
// per-library dashboard-only setting, not something an arbitrary embedding
// developer controls. Confirmed visually: Bunny's own progress bar stayed
// visible underneath our control bar when paused. See plan.md §0.6.
// ---------------------------------------------------------------------------
test('bunny stream: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://video.bunnycdn.com/play/12345/9f8e7d6c-1234-5678-9abc-def012345678');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Spotlightr — removed. spotlightr.js loaded successfully from the per-account
// CDN script URL, but live-browser verification showed it never recognized
// our plain iframe: window.playerSettingsById stayed empty and the
// vooPlayerReady callback never fired. Spotlightr's own docs note the JS API
// requires "advanced embed code" — a specific HTML snippet their dashboard
// generates per video, not a plain iframe plus a separately-loaded script —
// so this integration shape doesn't work. See plan.md §0.6.
// ---------------------------------------------------------------------------
test('spotlightr: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://watch.spotlightr.com/v/abc123');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Gumlet
// ---------------------------------------------------------------------------
test('gumlet: play.gumlet.io embed URL is passthrough-validated', () => {
  const r = resolveSource('https://play.gumlet.io/embed/64d3f8e9a1b2c3d4e5f6a7b8');
  assert.equal(r.provider, 'gumlet');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, '64d3f8e9a1b2c3d4e5f6a7b8');
  assert.equal(r.embedUrl, 'https://play.gumlet.io/embed/64d3f8e9a1b2c3d4e5f6a7b8');
});

test('gumlet: rejects an unrelated host', () => {
  const r = resolveSource('https://example.com/embed/abc123');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Publitio, Hippo Video, Sendspark, Muse.ai/Skiv, vzaar, ScreenPal, Bonjoro —
// removed. Each was researched for a genuine control API (JS SDK or
// documented postMessage protocol) and none clears the bar this project
// requires before wrapping a provider in our own control bar/shield
// (rules.md §4.1): Hippo Video, Sendspark, Muse.ai/Skiv, ScreenPal, and
// Bonjoro have no public control API at all; Publitio's postMessage protocol
// only covers play/pause (no seek, no volume, no timeupdate/ready — not
// enough to drive a real control bar); vzaar's own API docs are gone
// (help.vzaar.com now redirects to Dacast, which acquired vzaar in 2019) and
// the only recoverable example was a legacy toggle-only playPause() call
// with no confirmed seek/volume/event names. See plan.md for the full
// per-provider writeup.
// ---------------------------------------------------------------------------
test('publitio: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://media.publit.io/file/abc123.html');
  assert.equal(r, null);
});

test('hippo video: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://www.hippovideo.io/video/play/abc123');
  assert.equal(r, null);
});

test('sendspark: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://sendspark.com/share/abc123');
  assert.equal(r, null);
});

test('muse-ai: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://muse.ai/v/abc123');
  assert.equal(r, null);
});

test('vzaar: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://view.vzaar.com/12345678/player');
  assert.equal(r, null);
});

test('screenpal: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://go.screenpal.com/watch/cWZzZ9WGGD8');
  assert.equal(r, null);
});

test('bonjoro: URLs are unresolved, not silently guessed', () => {
  const r = resolveSource('https://bonjoro.com/g/abc123');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Jetpack VideoPress
// ---------------------------------------------------------------------------
test('jetpack videopress: videopress.com/v URL resolves to the embed URL', () => {
  const r = resolveSource('https://videopress.com/v/PMfFvyZW');
  assert.equal(r.provider, 'jetpack-videopress');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, 'PMfFvyZW');
  assert.equal(r.embedUrl, 'https://videopress.com/embed/PMfFvyZW');
});

test('jetpack videopress: video.wordpress.com/embed URL', () => {
  const r = resolveSource('https://video.wordpress.com/embed/PMfFvyZW');
  assert.equal(r.provider, 'jetpack-videopress');
  assert.equal(r.id, 'PMfFvyZW');
});

test('jetpack videopress: rejects an unrelated host', () => {
  const r = resolveSource('https://example.com/v/PMfFvyZW');
  assert.equal(r, null);
});

// ---------------------------------------------------------------------------
// Dropbox
// ---------------------------------------------------------------------------
test('dropbox: /s/ share link rewrites dl=0 to raw=1', () => {
  const r = resolveSource('https://www.dropbox.com/s/abc123/video.mp4?dl=0');
  assert.equal(r.provider, 'dropbox');
  assert.equal(r.type, 'native');
  assert.equal(r.src, 'https://www.dropbox.com/s/abc123/video.mp4?raw=1');
});

test('dropbox: newer /scl/fi/ share link shape', () => {
  const r = resolveSource('https://www.dropbox.com/scl/fi/abc123/video.mp4?dl=0&rlkey=xyz');
  assert.equal(r.provider, 'dropbox');
  assert.match(r.src, /raw=1/);
  assert.doesNotMatch(r.src, /dl=0/);
});

// ---------------------------------------------------------------------------
// Raw infrastructure: direct MP4/WebM, HLS, DASH
// ---------------------------------------------------------------------------
test('direct: plain .mp4 file', () => {
  const r = resolveSource('https://cdn.example.com/videos/clip.mp4');
  assert.equal(r.provider, 'direct');
  assert.equal(r.type, 'native');
  assert.equal(r.src, 'https://cdn.example.com/videos/clip.mp4');
});

test('direct: .webm with query string', () => {
  const r = resolveSource('https://cdn.example.com/videos/clip.webm?token=abc');
  assert.equal(r.type, 'native');
});

test('direct: .m3u8 HLS manifest', () => {
  const r = resolveSource('https://cdn.example.com/stream/index.m3u8');
  assert.equal(r.provider, 'hls');
  assert.equal(r.type, 'hls');
});

test('direct: .mpd DASH manifest', () => {
  const r = resolveSource('https://cdn.example.com/stream/manifest.mpd');
  assert.equal(r.provider, 'dash');
  assert.equal(r.type, 'dash');
});

// ---------------------------------------------------------------------------
// Fallback / negative / security cases
// ---------------------------------------------------------------------------
test('unsupported URL returns null instead of guessing', () => {
  const r = resolveSource('https://example.com/some/random/page');
  assert.equal(r, null);
});

test('malformed URL string returns null instead of throwing', () => {
  assert.doesNotThrow(() => resolveSource('not a url at all'));
  assert.equal(resolveSource('not a url at all'), null);
});

test('non-string input returns null instead of throwing', () => {
  assert.equal(resolveSource(null), null);
  assert.equal(resolveSource(undefined), null);
  assert.equal(resolveSource(42), null);
});

test('youtube id allow-list rejects an injection-shaped id', () => {
  // Guards the security boundary in rules.md §2.4: an attacker-controlled
  // value must never reach embedUrl unless it matches the strict ID pattern.
  const r = resolveSource('https://www.youtube.com/watch?v=%22%3E%3Cscript%3E');
  assert.equal(r, null);
});

test('every resolver is a pure function: same input always yields equal output', () => {
  const url = 'https://vimeo.com/76979871';
  const a = resolveSource(url);
  const b = resolveSource(url);
  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// SEO: VideoObject JSON-LD (core/seo.js)
// ---------------------------------------------------------------------------
test('seo: builds a VideoObject with name, description fallback, and duration conversion', () => {
  const resolved = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const jsonLd = buildVideoObjectJsonLd(resolved, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    name: 'My video',
    uploadDate: '2026-01-15',
    durationSeconds: 93,
  });
  assert.equal(jsonLd['@type'], 'VideoObject');
  assert.equal(jsonLd.name, 'My video');
  assert.equal(jsonLd.description, 'My video'); // falls back to name
  assert.equal(jsonLd.uploadDate, '2026-01-15');
  assert.equal(jsonLd.duration, 'PT1M33S');
  assert.equal(jsonLd.embedUrl, resolved.embedUrl);
});

test('seo: returns null without a name — nothing worth emitting', () => {
  const resolved = resolveSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(buildVideoObjectJsonLd(resolved, 'https://x', { description: 'no name here' }), null);
  assert.equal(buildVideoObjectJsonLd(resolved, 'https://x', undefined), null);
});

test('seo: durationSeconds converts across hour/minute/second boundaries', () => {
  const cases = [
    [0, 'PT0S'],
    [5, 'PT5S'],
    [90, 'PT1M30S'],
    [3600, 'PT1H'],
    [3661, 'PT1H1M1S'],
  ];
  for (const [seconds, expected] of cases) {
    const jsonLd = buildVideoObjectJsonLd(null, 'https://x', { name: 't', durationSeconds: seconds });
    assert.equal(jsonLd.duration, expected);
  }
});

test('seo: stringifyForScriptTag escapes "<" to prevent premature script closure', () => {
  const raw = stringifyForScriptTag({ description: '</script><script>alert(1)</script>' });
  assert.ok(!raw.includes('</script>'));
  assert.ok(raw.includes('\\u003c/script>'));
  // Still valid JSON once unescaped back by the browser's raw-text parsing
  assert.deepEqual(JSON.parse(raw.replace(/\\u003c/g, '<')), {
    description: '</script><script>alert(1)</script>',
  });
});
