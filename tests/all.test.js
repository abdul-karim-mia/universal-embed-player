// Single consolidated test file: every provider is exercised here in one place
// using Node's built-in test runner (zero test-framework dependency, per
// rules.md §1a dependency ceiling). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSource } from '../src/index.js';

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
    'https://player.vimeo.com/video/76979871?byline=0&portrait=0&title=0&controls=0&playsinline=1',
  );
});

test('vimeo: applies brand-minimization embed params', () => {
  const r = resolveSource('https://vimeo.com/76979871');
  const params = new URL(r.embedUrl).searchParams;
  assert.equal(params.get('byline'), '0');
  assert.equal(params.get('portrait'), '0');
  assert.equal(params.get('title'), '0');
  assert.equal(params.get('controls'), '0');
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
// Dailymotion
// ---------------------------------------------------------------------------
test('dailymotion: standard video URL with slug', () => {
  const r = resolveSource('https://www.dailymotion.com/video/x7tgd2y_some-title_tech');
  assert.equal(r.provider, 'dailymotion');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, 'x7tgd2y');
  assert.equal(r.embedUrl, 'https://geo.dailymotion.com/player.html?video=x7tgd2y');
});

test('dailymotion: dai.ly short link', () => {
  const r = resolveSource('https://dai.ly/x7tgd2y');
  assert.equal(r.provider, 'dailymotion');
  assert.equal(r.id, 'x7tgd2y');
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
test('jwplayer: cdn.jwplayer.com players URL', () => {
  const r = resolveSource('https://cdn.jwplayer.com/players/AbCd1234-EfGh5678.html');
  assert.equal(r.provider, 'jwplayer');
  assert.equal(r.type, 'iframe');
  assert.equal(r.id, 'AbCd1234');
  assert.equal(r.embedUrl, 'https://cdn.jwplayer.com/players/AbCd1234-EfGh5678.html');
});

test('jwplayer: content.jwplatform.com players URL', () => {
  const r = resolveSource('https://content.jwplatform.com/players/AbCd1234-EfGh5678.html');
  assert.equal(r.provider, 'jwplayer');
  assert.equal(r.id, 'AbCd1234');
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
// Google Drive
// ---------------------------------------------------------------------------
test('gdrive: /file/d/<id>/view share link', () => {
  const r = resolveSource('https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing');
  assert.equal(r.provider, 'gdrive');
  assert.equal(r.type, 'native');
  assert.equal(r.id, '1A2B3C4D5E6F');
  assert.equal(r.src, 'https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F');
});

test('gdrive: legacy open?id= link', () => {
  const r = resolveSource('https://drive.google.com/open?id=1A2B3C4D5E6F');
  assert.equal(r.id, '1A2B3C4D5E6F');
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
// OneDrive
// ---------------------------------------------------------------------------
test('onedrive: /embed path rewritten to /download', () => {
  const r = resolveSource('https://onedrive.live.com/embed?cid=ABC&resid=ABC%21123');
  assert.equal(r.provider, 'onedrive');
  assert.equal(r.type, 'native');
  assert.match(r.src, /\/download\?/);
  assert.equal(r.stability, 'stable');
});

test('onedrive: 1drv.ms short link passes through as experimental', () => {
  const r = resolveSource('https://1drv.ms/v/s!AbCdEfG');
  assert.equal(r.provider, 'onedrive');
  assert.equal(r.stability, 'experimental');
});

// ---------------------------------------------------------------------------
// iCloud (experimental)
// ---------------------------------------------------------------------------
test('icloud: iclouddrive share link is recognized as experimental', () => {
  const r = resolveSource('https://www.icloud.com/iclouddrive/abc123XYZ');
  assert.equal(r.provider, 'icloud');
  assert.equal(r.stability, 'experimental');
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
