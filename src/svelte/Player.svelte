<!--
  Svelte 5 adapter (runes syntax — requires svelte >=5.0.0, no Svelte 3/4
  legacy-syntax support). Same thin-wrapper pattern as src/react/Player.js
  and src/vue/Player.js: compute resolveSource(url) at render time, render
  an SSR-visible poster+link+JSON-LD fallback around an always-empty inner
  mount div, call createPlayer(innerDiv, options) once mounted client-side.

  Two-node split — same reasoning as React/Vue, ported to Svelte's own
  mechanism: Svelte's compiler generates DOM-anchor bookkeeping for {#if}
  blocks against nodes it created. If the mount target (bind:this)
  were inside a block Svelte also manages, createPlayer's innerHTML/append()
  calls would remove anchors Svelte still expects there, corrupting the DOM
  on the next `mounted` flip. Keeping the mount div as an always-rendered
  sibling — never inside an {#if} — sidesteps that entirely, same as
  React's/Vue's separate inner div.

  onEvent is a plain callback prop, not a dispatched CustomEvent — Svelte 5
  deprecated createEventDispatcher in favor of exactly this pattern, so this
  needs less glue than Vue's `emits: ['event']` wrapper and matches
  PlayerOptions.onEvent's signature directly.
-->
<script>
  import { onDestroy, onMount } from 'svelte';
  import { createPlayer } from '../core/controller.js';
  import { resolveSource } from '../resolvers/index.js';
  import { posterUrlFor } from '../core/lazy.js';
  import { buildVideoObjectJsonLd, stringifyForScriptTag } from '../core/seo.js';

  let {
    url,
    controls = true,
    light = false,
    poster,
    autoplay = false,
    muted = false,
    loop = false,
    playbackRates,
    volume,
    volumeKey,
    videoSize = 'contain',
    centerPlayButton = false,
    loadingSpinner = true,
    theme,
    shield = true,
    seo,
    onEvent,
    class: className,
    style,
  } = $props();

  let containerEl = $state(null);
  // Tracks whether createPlayer has actually taken over the inner div.
  // Starts false so server and initial-client render agree (no hydration
  // mismatch); the SEO poster fallback below is only shown until then —
  // both it and the real player are absolutely positioned over the same
  // box, so leaving the fallback mounted forever would permanently cover
  // the real player once it's up.
  let mounted = $state(false);
  let player = null;

  const resolved = $derived(resolveSource(url));
  const fallbackPoster = $derived(poster ?? (resolved ? posterUrlFor(resolved) : undefined));
  const jsonLd = $derived(seo ? buildVideoObjectJsonLd(resolved, url, seo) : null);
  const jsonLdScript = $derived(jsonLd ? `<script type="application/ld+json">${stringifyForScriptTag(jsonLd)}<\/script>` : '');

  function mount() {
    player?.destroy();
    mounted = false;
    if (!containerEl) return;

    player = createPlayer(containerEl, {
      url,
      controls,
      light,
      poster,
      autoplay,
      muted,
      loop,
      playbackRates,
      volume,
      volumeKey,
      videoSize,
      centerPlayButton,
      loadingSpinner,
      theme,
      shield,
      seo,
      onEvent,
    });
    mounted = true;
  }

  // Client-only — onMount never runs during SSR, matching React's
  // useEffect / Vue's onMounted. Re-mounts only when `url` changes, matching
  // the vanilla API's one-shot createPlayer(container, options) contract and
  // the React/Vue adapters' existing behavior.
  onMount(mount);
  let previousUrl = url;
  $effect(() => {
    if (url !== previousUrl) {
      previousUrl = url;
      mount();
    }
  });
  onDestroy(() => player?.destroy());
</script>

<div class={className} style="position: relative; width: 100%; aspect-ratio: 16 / 9; {style ?? ''}">
  <div bind:this={containerEl} style="position: absolute; inset: 0;"></div>
  {#if !mounted && fallbackPoster}
    <a href={url} rel="noopener" style="position: absolute; inset: 0; display: block;">
      <img
        src={fallbackPoster}
        alt={seo?.name ?? 'Video thumbnail'}
        loading="lazy"
        style="width: 100%; height: 100%; object-fit: cover;"
      />
    </a>
  {/if}
  {#if jsonLd}
    {@html jsonLdScript}
  {/if}
</div>
