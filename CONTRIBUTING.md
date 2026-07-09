# Contributing

Thanks for looking at `universal-embed-player`. Before opening a PR:

1. Read [`plan.md`](plan.md) for the architecture and provider matrix, and
   [`rules.md`](rules.md) for the engineering rules this repo is held to —
   in particular the **dependency ceiling** (rules.md §1a): `dependencies`
   in `package.json` must stay `{}`. `hls.js`/`dash.js` are the only two
   allowed runtime libraries, and only as optional peer dependencies,
   dynamically imported at the point of use.
2. Adding a new provider = a new file in `src/resolvers/`, plus test cases
   added to `tests/all.test.js` (rules.md §2 resolver contract: pure
   function, no DOM/network access, allow-list any extracted ID before it
   reaches a `src`/`embedUrl`).
3. Run the suite before opening a PR:
   ```bash
   npm test
   ```
4. If your change touches an iframe engine or the interaction shield, re-read
   plan.md §7 first — no PR may claim to strip vendor UI from inside a
   cross-origin iframe; that's blocked by the browser's same-origin policy,
   not something regex or JS can work around.
5. Try your change against [`demo.html`](demo.html) with a local static
   server (e.g. VS Code's Live Server) before submitting — it exercises every
   resolver/engine end to end with real URLs.

## Release process

Releases are published to npm automatically by
[`.github/workflows/publish.yml`](.github/workflows/publish.yml) whenever a
GitHub Release is published, provided the release tag (`vX.Y.Z`) matches the
`version` field in `package.json`. Bump the version with `npm version`, push
the tag, then publish the GitHub Release.
