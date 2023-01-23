import CoralScrollCore from './lib/core.js'

class CoralScrollElement extends HTMLElement {
  constructor() {
    super()

    const coralScrollElement = this

    new CoralScrollCore(coralScrollElement)
  }
}

// Check if element is defined, if not define it..
// eslint-disable-next-line no-undefined
if (customElements.get('coral-scroll') === undefined) {
  customElements.define('coral-scroll', CoralScrollElement)
}
