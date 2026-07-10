# Contributing

Thanks for looking at `universal-embed-player`. Before opening a PR:

1. **Dependency ceiling:** `dependencies` in `package.json` must stay `{}`.
   `hls.js`/`dashjs` are the only two allowed runtime libraries, and only as
   optional peer dependencies, dynamically imported at the point of use.
   `devDependencies` (TypeScript, react/vue for type-checking, etc.) are
   unrestricted since they never ship to consumers.
2. Adding a new provider = a new file in `src/resolvers/`, plus test cases
   added to `tests/all.test.js`. Resolvers must be pure functions — no DOM
   or network access during URL matching — and must allow-list any
   extracted ID before it reaches a `src`/`embedUrl`.
3. Run the suite before opening a PR:
   ```bash
   npm test
   ```
4. If your change touches an iframe engine or the interaction shield: a
   cross-origin iframe's internal DOM cannot be stripped or restyled from
   the outside — that's blocked by the browser's same-origin policy, not
   something regex or JS can work around. No PR should claim otherwise.

## Release process

Releases are published to npm automatically by
[`.github/workflows/publish.yml`](.github/workflows/publish.yml) whenever a
GitHub Release is published, provided the release tag (`vX.Y.Z`) matches the
`version` field in `package.json`. Bump the version with `npm version`, push
the tag, then publish the GitHub Release.
