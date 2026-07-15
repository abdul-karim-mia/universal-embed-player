// React adapter. Written with createElement (not JSX) so this file needs no
// build step / JSX transform of its own — consistent with the zero-tooling
// posture of the rest of the package. Mounts only in useEffect (client-side).
//
// SEO note: the outer div below carries a real, server-renderable fallback
// (poster link + optional JSON-LD) as its own React-owned children, while
// the actual mount target passed to createPlayer is a separate, always-empty
// *inner* div. This split matters: createPlayer mutates its container with
// plain DOM calls (append/innerHTML), and if that container were the same
// node React renders children into, the next React re-render would try to
// reconcile its virtual children against a subtree React no longer
// recognizes (createPlayer already replaced it) — React throws trying to
// remove/update nodes it doesn't own. Keeping createPlayer's target as a
// leaf div with no React children sidesteps that entirely.
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { createPlayer } from '../core/controller.js';
import { resolveSource } from '../resolvers/index.js';
import { posterUrlFor } from '../core/lazy.js';
import { buildVideoObjectJsonLd, stringifyForScriptTag } from '../core/seo.js';

const PLAYER_OPTION_KEYS = [
  'url',
  'controls',
  'light',
  'poster',
  'autoplay',
  'muted',
  'loop',
  'playbackRates',
  'volume',
  'volumeKey',
  'videoSize',
  'centerPlayButton',
  'theme',
  'shield',
  'onEvent',
];

/**
 * @typedef {import('../core/types.js').PlayerOptions & {
 *   className?: string,
 *   style?: import('react').CSSProperties,
 * }} PlayerProps
 */

/**
 * @param {PlayerProps} props
 * @returns {import('react').ReactElement}
 */
export function Player(props) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  // Tracks whether createPlayer has actually taken over the inner div.
  // Starts false so server and initial-client render agree (no hydration
  // mismatch); the SEO poster fallback below is only shown until then —
  // both it and the real player are absolutely positioned over the same
  // box, so leaving the fallback mounted forever would permanently cover
  // the real player once it's up.
  const [mounted, setMounted] = useState(false);

  const resolved = useMemo(() => resolveSource(props.url), [props.url]);
  const fallbackPoster = props.poster ?? (resolved ? posterUrlFor(resolved) : undefined);
  const jsonLd = props.seo ? buildVideoObjectJsonLd(resolved, props.url, props.seo) : null;

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const options = {};
    for (const key of PLAYER_OPTION_KEYS) {
      if (props[key] !== undefined) options[key] = props[key];
    }

    playerRef.current = createPlayer(containerRef.current, options);
    setMounted(true);
    return () => playerRef.current?.destroy();
    // Re-mounts only when the source URL changes — every other option is
    // read fresh on that same mount, matching the vanilla API's one-shot
    // createPlayer(container, options) contract (plan.md §4.1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.url]);

  return createElement(
    'div',
    {
      className: props.className,
      style: { position: 'relative', width: '100%', aspectRatio: '16 / 9', ...props.style },
    },
    createElement('div', { ref: containerRef, style: { position: 'absolute', inset: 0 } }),
    !mounted &&
      fallbackPoster &&
      createElement(
        'a',
        {
          key: 'seo-fallback',
          href: props.url,
          rel: 'noopener',
          style: { position: 'absolute', inset: 0, display: 'block' },
        },
        createElement('img', {
          src: fallbackPoster,
          alt: props.seo?.name ?? 'Video thumbnail',
          loading: 'lazy',
          style: { width: '100%', height: '100%', objectFit: 'cover' },
        }),
      ),
    jsonLd &&
      createElement('script', {
        key: 'seo-jsonld',
        type: 'application/ld+json',
        dangerouslySetInnerHTML: { __html: stringifyForScriptTag(jsonLd) },
      }),
  );
}
