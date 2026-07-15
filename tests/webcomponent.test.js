// Pure-function coverage for the <uep-player> attribute-parsing helpers.
// No DOM/customElements needed — element.js's actual custom-element
// lifecycle (connectedCallback timing, live attribute updates) is exercised
// manually in a browser, not here (see rules.md §9's documented gap, shared
// with the React/Vue adapters' untested SSR paths).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUepBoolean, parseUepJson, parseUepNumber, parsePlaybackRatesAttr } from '../src/webcomponent/attr-utils.js';

// ---------------------------------------------------------------------------
// parseUepBoolean — the confirmed `!== 'false'` opt-out convention
// ---------------------------------------------------------------------------
test('parseUepBoolean: attribute absent falls back to the given default', () => {
  assert.equal(parseUepBoolean(null, true), true);
  assert.equal(parseUepBoolean(null, false), false);
});

test('parseUepBoolean: any value except the literal string "false" is true', () => {
  assert.equal(parseUepBoolean('', true), true); // bare attribute, e.g. controls=""
  assert.equal(parseUepBoolean('true', false), true);
  assert.equal(parseUepBoolean('yes', false), true);
});

test('parseUepBoolean: the literal string "false" is always false, regardless of default', () => {
  assert.equal(parseUepBoolean('false', true), false);
  assert.equal(parseUepBoolean('false', false), false);
});

test('parseUepBoolean: correct under naive attribute stringification (Angular [attr.x] case)', () => {
  // setAttribute('controls', String(false)) produces the literal 'false' —
  // this is the exact scenario the opt-out convention exists to handle.
  assert.equal(parseUepBoolean(String(false), true), false);
  assert.equal(parseUepBoolean(String(true), true), true);
});

// ---------------------------------------------------------------------------
// parseUepNumber
// ---------------------------------------------------------------------------
test('parseUepNumber: parses a valid numeric string', () => {
  assert.equal(parseUepNumber('0.5', 1), 0.5);
  assert.equal(parseUepNumber('2', 1), 2);
});

test('parseUepNumber: absent attribute or non-numeric value falls back to default', () => {
  assert.equal(parseUepNumber(null, 1), 1);
  assert.equal(parseUepNumber('not-a-number', 1), 1);
});

// ---------------------------------------------------------------------------
// parseUepJson
// ---------------------------------------------------------------------------
test('parseUepJson: parses valid JSON', () => {
  assert.deepEqual(parseUepJson('{"primaryColor":"#ff0000"}', 'theme'), { primaryColor: '#ff0000' });
});

test('parseUepJson: absent attribute returns undefined', () => {
  assert.equal(parseUepJson(null, 'theme'), undefined);
});

test('parseUepJson: invalid JSON degrades to undefined with a warning, does not throw', () => {
  let warned = false;
  const originalWarn = console.warn;
  console.warn = () => {
    warned = true;
  };
  try {
    assert.doesNotThrow(() => parseUepJson('{not valid json', 'theme'));
    assert.equal(parseUepJson('{not valid json', 'theme'), undefined);
    assert.equal(warned, true);
  } finally {
    console.warn = originalWarn;
  }
});

// ---------------------------------------------------------------------------
// parsePlaybackRatesAttr
// ---------------------------------------------------------------------------
test('parsePlaybackRatesAttr: comma-separated list', () => {
  assert.deepEqual(parsePlaybackRatesAttr('0.5,1,1.5,2'), [0.5, 1, 1.5, 2]);
});

test('parsePlaybackRatesAttr: JSON array string', () => {
  assert.deepEqual(parsePlaybackRatesAttr('[0.5, 1, 1.5, 2]'), [0.5, 1, 1.5, 2]);
});

test('parsePlaybackRatesAttr: absent attribute returns undefined', () => {
  assert.equal(parsePlaybackRatesAttr(null), undefined);
});

test('parsePlaybackRatesAttr: non-numeric entries are filtered, not thrown', () => {
  assert.deepEqual(parsePlaybackRatesAttr('0.5,foo,2'), [0.5, 2]);
});

test('parsePlaybackRatesAttr: all-invalid input returns undefined rather than an empty array', () => {
  assert.equal(parsePlaybackRatesAttr('foo,bar'), undefined);
});
