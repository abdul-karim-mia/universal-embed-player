// The only file in this adapter with a real side effect — registering the
// tag is why package.json's `sideEffects` array explicitly lists this file
// (a bundler doing strict tree-shaking is otherwise free to drop
// `customElements.define(...)` as an unused call).
//
// A given class can only ever be passed to `customElements.define()` once
// (the spec throws `NotSupportedError` on a second registration of the same
// constructor, even under a different tag name) — so importing the class
// for custom registration must come from `element.js` directly, a module
// with zero side effects of its own, NOT from this file. Re-exporting
// `UepPlayerElement` here would defeat that: any import from this module,
// even just for the class, still runs the registration below first.
//   import 'universal-embed-player/webcomponent';                  // auto-registers <uep-player>
//   import { UepPlayerElement } from 'universal-embed-player/webcomponent/element'; // register your own tag
import { UepPlayerElement } from './element.js';

if (typeof customElements !== 'undefined' && !customElements.get('uep-player')) {
  customElements.define('uep-player', UepPlayerElement);
}
