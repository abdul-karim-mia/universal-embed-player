













import { UepPlayerElement } from './element.js';

if (typeof customElements !== 'undefined' && !customElements.get('uep-player')) {
  customElements.define('uep-player', UepPlayerElement);
}
