// React adapter. Written with createElement (not JSX) so this file needs no
// build step / JSX transform of its own — consistent with the zero-tooling
// posture of the rest of the package. Mounts only in useEffect (client-side),
// so server rendering in Next.js just renders the empty container div.
import { createElement, useEffect, useRef } from 'react';
import { createPlayer } from '../core/controller.js';

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

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const options = {};
    for (const key of PLAYER_OPTION_KEYS) {
      if (props[key] !== undefined) options[key] = props[key];
    }

    playerRef.current = createPlayer(containerRef.current, options);
    return () => playerRef.current?.destroy();
    // Re-mounts only when the source URL changes — every other option is
    // read fresh on that same mount, matching the vanilla API's one-shot
    // createPlayer(container, options) contract (plan.md §4.1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.url]);

  return createElement('div', {
    ref: containerRef,
    className: props.className,
    style: { position: 'relative', width: '100%', aspectRatio: '16 / 9', ...props.style },
  });
}
