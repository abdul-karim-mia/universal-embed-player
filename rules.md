# rules.md — universal-embed-player

Project-specific engineering rules. These sit on top of (never replace) the
global house rules already in effect for this session (coding style, testing,
security, git workflow, code review). Where this file is silent, the global
rules apply. Where this file is explicit, it wins for this repo because the
package has constraints (cross-origin iframes, third-party ToS, tree-shaking)
that generic rules don't anticipate.

---

## 1. Repository Layout

```
universal-embed-player/
├── plan.md
├── rules.md
├── package.json
├── tsconfig.json
├── src/
│   ├── core/
│   │   ├── resolvers/          # one file per provider, pure functions only
│   │   ├── engines/            # native.ts, hls.ts, dash.ts, iframe.ts
│   │   ├── ui/                 # controls.ts, shield.ts, theme.ts
│   │   ├── controller.ts
│   │   ├── events.ts
│   │   ├── lazy.ts
│   │   └── types.ts
│   ├── react/                  # <Player /> adapter
│   └── vue/                    # <Player /> adapter
├── tests/
│   ├── fixtures/                # recorded provider responses, sample URLs
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── examples/
    ├── vite-vanilla/
    ├── next-app/
    ├── nuxt-app/
    └── astro-app/
```

**Rule:** a new provider = a new file in `src/core/resolvers/`, never an
addition to an existing provider's file, and never a shared "misc resolvers"
catch-all. One provider, one file, one test file.

---

## 1a. Dependency Ceiling (non-negotiable)

Grounded in plan.md §0.1–§0.2 competitive research: `embed-video` bundles
`lodash.escape` + `promise-polyfill` + `fetch-ponyfill` for work modern
browsers do natively, and `react-player` v3 pulls in 10 per-provider npm
packages. Both are cited here as the anti-pattern this project explicitly
refuses to repeat.

1. `dependencies` in `package.json` MUST stay `{}`. If a PR adds anything to
   it, that is a request for the user to review, not something to merge
   silently — treat it the same severity as a CRITICAL finding in
   code-review.md.
2. `hls.js` and `dash.js` are the **only** two libraries this package ever
   loads, and only as `peerDependencies` with `peerDependenciesMeta.optional:
   true`, imported exclusively via a runtime dynamic `import()` inside
   `engines/hls.ts` / `engines/dash.ts` — never a static top-level `import`,
   which would defeat the point by pulling them into every bundle regardless
   of use.
3. No polyfill libraries, ever. Target evergreen browsers only (native
   `Promise`, `fetch`, `URL`, `URLSearchParams`, `customElements`, Shadow DOM,
   `IntersectionObserver`). If a feature needs a polyfill to reach the
   project's supported-browser floor, that feature is out of scope, not the
   polyfill's problem to solve.
4. No utility-belt libraries (lodash, ramda, date-fns, etc.) for one-off
   string/array operations. Native `Array.prototype`/`String.prototype`
   methods cover everything a resolver or controller needs; reaching for a
   dependency here is a code-review rejection, not a judgment call.
5. `devDependencies` (TypeScript, bundler, linter, Playwright, `hls.js`/
   `dash.js` for local dev/testing) are unrestricted — they never ship to
   consumers and don't affect install size, per plan.md §0.2.
6. CI must run a check that fails the build if `dependencies` is non-empty
   or if any file outside `engines/hls.ts`/`engines/dash.ts` contains an
   `import` resolving into `node_modules` (plan.md §0.2 "CI enforcement").
   Do not merge a PR that would make this check red.

---

## 2. Resolver Contract (non-negotiable)

Every resolver in `src/core/resolvers/*.ts` MUST:

1. Export a single pure function: `(url: string) => ResolvedSource | null`.
2. Never touch the DOM, `window`, `document`, or perform network calls
   synchronously during matching. Matching is regex/string-parsing only.
3. Return `null` (not throw) when the URL doesn't match — throwing is
   reserved for genuinely malformed input the resolver claims to own.
4. Validate the extracted ID/path against an allow-list pattern
   (e.g. `^[a-zA-Z0-9_-]+$` for a YouTube video ID) before it is ever placed
   into a `src` attribute — this is a security boundary, not a style
   preference (see rules.md §7 and plan.md §11).
5. Ship with a sibling fixture file in `tests/fixtures/<provider>.json`
   listing real-world-shaped sample URLs (including edge cases: Shorts,
   unlisted, private-hash, query-param variants) and their expected resolved
   output.
6. Be independently importable via its own subpath export
   (`universal-embed-player/resolvers/<provider>`) — verify this in the
   build config whenever a resolver is added, not just in code.

**Anti-pattern to reject in review:** a resolver that does `fetch()` to
"check" a URL before returning a match. Resolution must be synchronous and
regex-based per the "no-server, client-side-only" project premise — the one
documented exception is iCloud (§8 of plan.md), which is marked experimental
specifically because it needs a redirect follow.

---

## 3. Engine / Controller Boundary

- The **controller** (`src/core/controller.ts`) is the only module allowed to
  create, mount, or destroy DOM nodes for the player surface. Engines expose
  `mount(container, resolvedSource, options)` / `destroy()` and nothing else
  reaches into the container from outside the controller.
- Engines never import each other. If native and HLS engines need to share
  logic (e.g. volume persistence), extract it to `src/core/lazy.ts` or a new
  shared util — do not import `engines/native.ts` from `engines/hls.ts`.
- Every engine's `destroy()` MUST remove all event listeners it registered
  (native DOM listeners, provider SDK callbacks, `postMessage` listeners).
  Missing cleanup is treated as a correctness bug, not a nice-to-have — test
  for it explicitly (§10 of plan.md, "no memory/DOM leak on destroy").

---

## 4. Iframe / Third-Party Provider Rules

These exist because cross-origin iframes are the single riskiest part of the
spec (plan.md §7) and it's easy to accidentally promise something the
browser's same-origin policy makes impossible.

1. **Never claim to remove vendor UI from inside a cross-origin iframe.**
   That code cannot exist — same-origin policy blocks it categorically. Any
   PR that claims to "strip the YouTube skin" via iframe DOM access must be
   rejected in review; the only legitimate mechanisms are (a) provider embed
   parameters and (b) the interaction shield overlay.
2. Every iframe engine must document, in a comment at the top of the file,
   which embed parameters it sets and cite the provider's own embed
   parameter documentation (URL in the comment, not paraphrased from memory).
3. `allowBrandMasking` (masking a corner watermark) defaults to `false` and
   must stay an explicit opt-in. Do not flip this default without a recorded
   sign-off — it's a ToS/legal risk, not just a UX choice (plan.md §7.3).
4. `sandbox` attribute on iframes starts from the minimum set documented in
   plan.md §11 (`allow-scripts allow-same-origin allow-presentation`).
   Adding a new sandbox flag for a specific provider requires a code comment
   explaining which provider feature needs it.
5. Interaction shield (`src/core/ui/shield.ts`) intercepts clicks and forwards
   commands to the provider's own JS SDK API (postMessage) — it must never
   attempt to suppress default browser context menus on content the shield
   doesn't itself own (i.e. don't blanket-disable right-click site-wide;
   scope the shield's own overlay element only).

---

## 5. Cloud Storage Resolver Rules

- Each cloud resolver (`gdrive.ts`, `dropbox.ts`, `onedrive.ts`, `icloud.ts`)
  must expose its transform as a pure string-rewrite function, unit tested
  against multiple real-world link shapes (personal vs business tenant for
  OneDrive; `/s/` vs `/scl/fi/` for Dropbox; `/file/d/` vs `open?id=` for
  Drive).
- `icloud.ts` is the one resolver allowed to perform an async redirect
  resolution. It must be clearly marked `experimental` in its exported type
  metadata (`meta.stability: 'experimental'`) and the controller must surface
  that stability flag to the host app (e.g. via the `ready`/`error` event
  payload) rather than silently treating it as equally reliable to the
  others.
- Any cloud resolver failure must produce a typed `error` event
  (`{ type: 'error', code: 'CLOUD_RESOLVE_FAILED', provider, message }`) —
  never a silent blank player or an unhandled promise rejection.
- Do not add live network calls against real Google/Dropbox/Microsoft/Apple
  endpoints in CI test runs. Use recorded fixtures. These are third-party
  services outside our control; flaky CI from rate-limiting is not
  acceptable (plan.md §8, §10).

---

## 6. Styling Rules

- All player-owned UI (controls, shield, thumbnail poster) renders inside a
  Shadow DOM root attached in the controller, not in individual engines —
  engines only provide the raw media surface (`<video>`/`<iframe>`); the
  controller composes shadow-DOM chrome around whatever the engine mounts.
- Theming is CSS custom properties only (`--uep-*` namespace). Never inject
  a `<style>` tag with hardcoded colors computed from the `theme` option —
  always set custom properties and let a static stylesheet reference them,
  so DevTools users can override live without JS re-runs.
- Expose customization points via `::part()`, not by documenting internal
  class names as a public API. Class names inside the shadow root are
  private implementation detail and may change between minor versions;
  `::part()` names are the versioned public contract.

---

## 7. Security Rules (project-specific additions to global security.md)

1. Treat the `url` option as **untrusted input** even though it's typically
   developer-supplied, because in many real apps it flows from a CMS field
   or user-generated content. Resolvers must allow-list expected shapes
   before interpolating into `src`/`href`/`iframe.src`.
2. No `innerHTML` anywhere in `src/core/ui/*`. Error messages and dynamic
   text use `textContent`. If templating is needed, use DOM
   `createElement`/`cloneNode` on trusted static templates only.
3. No API keys, tokens, or credentials are ever bundled or required for any
   resolver in the free-tier provider list (plan.md §2). If a future
   professional-hosting provider needs an auth token for signed URLs, it is
   passed in by the caller at runtime via `options`, never hardcoded, never
   committed to fixtures with real values (use obviously-fake placeholder
   tokens in fixtures, e.g. `FAKE_TOKEN_FOR_TESTS_ONLY`).
4. Document required CSP directives (`frame-src`, `media-src`,
   `connect-src`) per provider in that provider's resolver file header
   comment, so the README's CSP table can be generated/checked against code
   rather than drifting from it.

---

## 8. Marketing / Documentation Honesty Rule

Any README, docstring, or example claiming "brand-free," "removes vendor
UI," or similar must match the nuance in plan.md §7:

- **True without qualification:** native `<video>`-backed sources (cloud
  storage links, direct MP4/WebM, HLS, DASH) — no iframe, no vendor chrome,
  full claim stands.
- **Requires qualification:** iframe-backed sources (YouTube, Vimeo,
  Dailymotion, Wistia, Kaltura, etc.) — describe as "brand-minimized,
  ToS-compliant chrome reduction," never as "100% brand-free."

A PR that changes marketing copy or adds a new example must be checked
against this distinction in review; this is treated as a correctness issue
for docs, not a style nit, because overpromising here creates real legal/ToS
exposure for downstream users of the package.

---

## 9. Testing Rules (project-specific additions to global testing.md)

- Coverage floor is 80% overall (house rule), but resolvers specifically
  target 100% branch coverage — they're pure functions with no excuse for
  untested branches.
- Every new provider ships with: unit tests (resolver), an entry in the
  fixture file, and at least one Playwright E2E case if the provider uses a
  new engine type not already covered (e.g. first Cloudflare Stream
  integration needs its own E2E case even though other iframe providers are
  already covered, because embed URL shape differs).
- `destroy()` cleanup (listener removal, DOM teardown) is asserted directly
  in tests — do not rely on "no console errors" as a proxy for "no leak."
- SSR smoke tests (React/Vue adapters) must run in an actual Next.js/Nuxt
  server-render pass, not just a `jsdom` unit test, because SSR footguns
  (`window is not defined`) are exactly the class of bug that unit tests
  with jsdom silently paper over.

---

## 10. Versioning & Public API Change Rules

- `src/core/types.ts` exported types (`ResolvedSource`, `UnifiedPlayerEvent`,
  `PlayerOptions`) are the public API contract. Any breaking change to these
  requires a major version bump and a CHANGELOG entry — no exceptions for
  "it's just adding a field" if the field is required rather than optional.
- New resolvers, new optional `PlayerOptions` fields, and new emitted event
  types are additive and ship as minor versions.
- Removing or renaming a resolver's public subpath export
  (`universal-embed-player/resolvers/<provider>`) is a breaking change.

---

## 11. Definition of Done (per feature/PR in this repo)

A change is done only when all of the following hold — this is the
project-specific checklist layered on top of the global code-review.md
checklist:

- [ ] New/changed resolver has a fixture file and 100% branch coverage.
- [ ] No DOM/network access added to a resolver (unless it's `icloud.ts`,
      which is explicitly allowed and marked experimental).
- [ ] Any iframe/engine change re-reads plan.md §7 and confirms no claim of
      cross-origin DOM manipulation was introduced.
- [ ] Any marketing/README copy change matches §8 of this file (brand-free
      vs brand-minimized distinction).
- [ ] `destroy()` path has an explicit test asserting listener cleanup, if
      the change touches an engine.
- [ ] Export map / subpath exports updated and verified buildable if a new
      resolver or adapter was added.
- [ ] Global house rules satisfied: code-reviewer + security-reviewer agent
      pass, no hardcoded secrets, no `innerHTML` from dynamic data, tests
      pass at 80%+ coverage.
