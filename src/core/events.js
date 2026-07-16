



const VALID_TYPES = new Set([
  'ready',
  'play',
  'pause',
  'buffering',
  'timeupdate',
  'volumechange',
  'ratechange',
  'ended',
  'error',
]);

export class UnifiedEventEmitter {
  #listeners = new Map();

  on(type, handler) {
    if (!VALID_TYPES.has(type)) {
      
      console.warn(`[uep] Unknown event type "${type}" — valid types: ${[...VALID_TYPES].join(', ')}`);
      return () => {}; 
    }
    if (typeof handler !== 'function') {
      console.warn(`[uep] event handler for "${type}" must be a function`);
      return () => {};
    }
    if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());
    this.#listeners.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    this.#listeners.get(type)?.delete(handler);
  }

  emit(type, payload = {}) {
    const event = { type, ...payload };
    for (const handler of this.#listeners.get(type) ?? []) {
      try {
        handler(event);
      } catch (err) {
        
        console.error(`[uep] Uncaught error in "${type}" handler:`, err);
      }
    }
    return event;
  }

  removeAllListeners() {
    this.#listeners.clear();
  }
}
