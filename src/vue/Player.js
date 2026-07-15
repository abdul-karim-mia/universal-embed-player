// Vue 3 adapter. Plain render function (no SFC/.vue compile step needed).
// Mounts in onMounted (client-side only).
//
// SEO note: the outer div below carries a real, server-renderable fallback
// (poster link + optional JSON-LD) as its own Vue-owned children, while the
// actual mount target passed to createPlayer is a separate, always-empty
// *inner* div. This split matters: createPlayer mutates its container with
// plain DOM calls (append/innerHTML), and if that container were the same
// node Vue renders children into, the next render would try to reconcile
// its vnodes against a subtree Vue no longer recognizes (createPlayer
// already replaced it). Keeping createPlayer's target as a leaf div with no
// Vue children sidesteps that entirely. The fallback is hidden once
// `mounted` flips true — both it and the real player are absolutely
// positioned over the same box, so leaving it up forever would permanently
// cover the real player.
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createPlayer } from '../core/controller.js';
import { resolveSource } from '../resolvers/index.js';
import { posterUrlFor } from '../core/lazy.js';
import { buildVideoObjectJsonLd, stringifyForScriptTag } from '../core/seo.js';

export const Player = defineComponent({
  name: 'UniversalEmbedPlayer',
  props: {
    url: { type: String, required: true },
    controls: { type: Boolean, default: true },
    light: { type: Boolean, default: false },
    poster: { type: String, default: undefined },
    autoplay: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
    loop: { type: Boolean, default: false },
    playbackRates: { type: Array, default: undefined },
    volume: { type: Number, default: undefined },
    volumeKey: { type: String, default: undefined },
    videoSize: { type: String, default: 'contain' },
    centerPlayButton: { type: Boolean, default: false },
    theme: { type: Object, default: undefined },
    shield: { type: Boolean, default: true },
    seo: { type: Object, default: undefined },
  },
  emits: ['event'],
  setup(props, { emit }) {
    const containerRef = ref(null);
    const mounted = ref(false);
    let player = null;

    const resolved = computed(() => resolveSource(props.url));
    const fallbackPoster = computed(() => props.poster ?? (resolved.value ? posterUrlFor(resolved.value) : undefined));
    const jsonLd = computed(() => (props.seo ? buildVideoObjectJsonLd(resolved.value, props.url, props.seo) : null));

    function mount() {
      player?.destroy();
      mounted.value = false;
      if (!containerRef.value) return;

      player = createPlayer(containerRef.value, {
        url: props.url,
        controls: props.controls,
        light: props.light,
        poster: props.poster,
        autoplay: props.autoplay,
        muted: props.muted,
        loop: props.loop,
        playbackRates: props.playbackRates,
        volume: props.volume,
        volumeKey: props.volumeKey,
        videoSize: props.videoSize,
        centerPlayButton: props.centerPlayButton,
        theme: props.theme,
        shield: props.shield,
        onEvent: (event) => emit('event', event),
      });
      mounted.value = true;
    }

    onMounted(mount);
    watch(() => props.url, mount);
    onBeforeUnmount(() => player?.destroy());

    return () =>
      h('div', { style: { position: 'relative', width: '100%', aspectRatio: '16 / 9' } }, [
        h('div', { ref: containerRef, style: { position: 'absolute', inset: 0 } }),
        !mounted.value && fallbackPoster.value
          ? h(
              'a',
              { href: props.url, rel: 'noopener', style: { position: 'absolute', inset: 0, display: 'block' } },
              [
                h('img', {
                  src: fallbackPoster.value,
                  alt: props.seo?.name ?? 'Video thumbnail',
                  loading: 'lazy',
                  style: { width: '100%', height: '100%', objectFit: 'cover' },
                }),
              ],
            )
          : null,
        jsonLd.value
          ? h('script', { type: 'application/ld+json', innerHTML: stringifyForScriptTag(jsonLd.value) })
          : null,
      ]);
  },
});
