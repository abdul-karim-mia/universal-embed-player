// Vue 3 adapter. Plain render function (no SFC/.vue compile step needed).
// Mounts in onMounted (client-side only), so Nuxt SSR just renders the empty
// container element.
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createPlayer } from '../core/controller.js';

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
  },
  emits: ['event'],
  setup(props, { emit }) {
    const containerRef = ref(null);
    let player = null;

    function mount() {
      player?.destroy();
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
    }

    onMounted(mount);
    watch(() => props.url, mount);
    onBeforeUnmount(() => player?.destroy());

    return () =>
      h('div', {
        ref: containerRef,
        style: { position: 'relative', width: '100%', aspectRatio: '16 / 9' },
      });
  },
});
