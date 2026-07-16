













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
