<div align="center">
🪸
</div>

<h1 align="center">🪸 Coral 🪸<br></h1>
<h2 align="center">A slider extension for native CSS Snap Scroll</h2>
<br>

## Instalation
Install the package using `yarn install @root_ish/coral` and import the JS and CSS

``` scss 
@import url('@root_ish/coral/lib/coral-scroll.css');
```

## How to use
``` html
<coral-scroll class="coral-scroll">
  <div class="coral-scroll__grab-overlay"></div>
  <div class="coral-scroll__slider">
    <div class="slide"></div>
    <!-- end .slide -->

  </div>
  <!-- end .coral-scroll__slider -->
  
  <div class="coral-scroll__arrows">
    <button type="button" class="button arrow previous js-disabled" aria-label="previous slide button" name="previous slide button">
      {%- render 'arrow-left' -%}
    </button>
    <!-- end .previous -->

    <button type="button" class="button arrow next" aria-label="next slide button" name="next slide button">
      {%- render 'arrow-right' -%}
    </button>
    <!-- end .next -->

  </div>
  <!-- end .coral-scroll__arrows -->

  <div class="coral-scroll__indicator">
    <button type="button" class="dot" data-index="0" aria-label="Select slide 0" name="Select slide 0"></button>
    <!-- end .dot -->

  </div>
  <!-- end .coral-scroll__indicator -->

</coral-scroll>
<!-- end coral-scroll -->
```

To connect the JS with the HTML you can use the CoralScrollCore class however you like.

``` js
import CoralScrollCore from '@root_ish/coral'

class CoralScrollElement extends HTMLElement {
  constructor() {
    super()

    const coralScrollElement = this

    new CoralScrollCore(coralScrollElement)
  }
}

// Check if element is defined, if not define it.
// eslint-disable-next-line no-undefined
if (customElements.get('coral-scroll') === undefined) {
  customElements.define('coral-scroll', CoralScrollElement)
}
```

## Coral scroll features

### Dev mode
To see what the start end points are on the slider and get some stats about the slider when scrolling in your console. Add the following to the 
 `data-dev-mode="true"` coral-scroll element.

### Auto scroll
An auto scroll can be set using  `data-auto-scroll="3000"` on the coral-scroll element. The delay can be any number you want.

#### The slider can be also paused when hovering over the slider with auto scroll on.
`data-auto-scroll="true"`, by default this is on.
### Infinte scroll
To enable infinte scrolling on the slider use `data-infinite-scroll="true"`


## Snap align support.
Currently Coral scroll supports `scroll-snap-align` start and center.

