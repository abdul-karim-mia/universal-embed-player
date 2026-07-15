import { resolve as youtube } from './youtube.js';
import { resolve as vimeo } from './vimeo.js';
import { resolve as wistia } from './wistia.js';
import { resolve as cloudflareStream } from './cloudflare-stream.js';
import { resolve as fastpix } from './fastpix.js';
import { resolve as jwplayer } from './jwplayer.js';
import { resolve as kaltura } from './kaltura.js';
import { resolve as dropbox } from './dropbox.js';
import { resolve as direct } from './direct.js';

// Host-specific resolvers run first; the extension-based `direct` resolver
// runs last as the fallback for raw HLS/DASH/MP4 links (plan.md §3 "Fallback rule").
export const RESOLVERS = [
  youtube,
  vimeo,
  wistia,
  cloudflareStream,
  fastpix,
  jwplayer,
  kaltura,
  dropbox,
  direct,
];

/**
 * @param {string} url
 * @returns {import('../core/types.js').ResolvedSource | null}
 */
export function resolveSource(url) {
  if (typeof url !== 'string' || url.length === 0) return null;

  for (const resolver of RESOLVERS) {
    const result = resolver(url);
    if (result) return result;
  }

  return null;
}
