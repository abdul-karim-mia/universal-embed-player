// Tiny dependency-free event emitter shared by every engine. Engines call
// `emit()` with the unified event shapes documented in plan.md §5; consumers
// subscribe via player.on(type, handler) (wired up in controller.js).

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
      // Warn rather than throw — a bad event name shouldn't crash caller code.
      console.warn(`[uep] Unknown event type "${type}" — valid types: ${[...VALID_TYPES].join(', ')}`);
      return () => {}; // no-op unsubscriber
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
        // One bad handler must not silence the rest.
        console.error(`[uep] Uncaught error in "${type}" handler:`, err);
      }
    }
    return event;
  }

  removeAllListeners() {
    this.#listeners.clear();
  }
}
