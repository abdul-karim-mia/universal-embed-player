// Compiles Player.svelte via the real svelte/compiler and executes the
// generated SSR render function — a real smoke test against the actual
// .svelte source, same spirit as the ad hoc renderToStaticMarkup/
// @vue/server-renderer verification already done for React/Vue this
// session, but committed as a real test instead of a throwaway script.
//
// The compiled output is written to a temp .mjs file *inside* src/svelte/
// (not tests/ or a tmp dir) because Player.svelte's relative imports
// (../core/controller.js etc.) resolve relative to wherever the compiled
// file lives — writing it anywhere else breaks module resolution.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svelteSourcePath = path.join(__dirname, '../src/svelte/Player.svelte');
const compiledOutputPath = path.join(__dirname, '../src/svelte/_Player.compiled-test.mjs');

let Player;

before(async () => {
  const source = readFileSync(svelteSourcePath, 'utf8');
  const result = compile(source, { generate: 'server', filename: 'Player.svelte' });
  writeFileSync(compiledOutputPath, result.js.code);
  ({ default: Player } = await import(pathToFileURL(compiledOutputPath).href));
});

after(() => {
  unlinkSync(compiledOutputPath);
});

test('svelte: Player.svelte compiles for both client and server targets', () => {
  const source = readFileSync(svelteSourcePath, 'utf8');
  assert.doesNotThrow(() => compile(source, { generate: 'client', filename: 'Player.svelte' }));
  assert.doesNotThrow(() => compile(source, { generate: 'server', filename: 'Player.svelte' }));
});

test('svelte: SSR renders a poster fallback link and JSON-LD when seo is provided', () => {
  const { body } = render(Player, {
    props: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      seo: { name: 'Test Video', uploadDate: '2026-01-15', durationSeconds: 93 },
    },
  });

  assert.ok(body.includes('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"'));
  assert.ok(body.includes('<img'));
  assert.ok(body.includes('application/ld+json'));
  assert.ok(body.includes('"@type":"VideoObject"'));
  assert.ok(body.includes('"duration":"PT1M33S"'));
});

test('svelte: SSR renders no fallback poster/JSON-LD when there is nothing to show', () => {
  const { body } = render(Player, { props: { url: 'https://example.com/video.mp4' } });

  assert.ok(!body.includes('<img'));
  assert.ok(!body.includes('application/ld+json'));
});
