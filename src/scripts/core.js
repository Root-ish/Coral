/**
 * Coral Scroll Core
 */
export class CoralScrollCore {
  constructor(coralScrollElement) {
    this.coralScrollElement = coralScrollElement
    this.sliderElement = coralScrollElement.querySelector('.coral-scroll__slider')
    this.grabOverlayElement = coralScrollElement.querySelector('.coral-scroll__grab-overlay')
    this.sliderConfig = this.createSliderConfig()
    this.slideScrollLeft = this.sliderElement.scrollLeft
    this.showOverlay = false
    this.isDown = false
    this.startX
    this.isTouchDown = false
    this.coralScrollId = Date.now()
    // The shadow active slide position is used to scroll without setting an active slide. (Used for the thumbs slider)
    this.shadowActiveSlidePosition = 0
    this.handleInterval
    this.initializeSlider()
    this.oberserverConfig = {
      attributes: false,
      childList: true,
      subtree: false,
    }
  }

  /**
   * Create slider config object.
   *
   * @returns {object} sliderConfig
   */
  createSliderConfig = () => {
    const firstSlideElement = this.sliderElement.querySelectorAll('.slide:not(.js-hidden)')
      ? this.sliderElement.querySelectorAll('.slide:not(.js-hidden)')[0]
      : null

    return {
      devMode: this.coralScrollElement.dataset.devMode
        ? this.coralScrollElement.dataset.devMode === 'true'
        : false,
      grabVelocity: this.coralScrollElement.dataset.grabVelocity || 100,
      autoScrollDuration: this.coralScrollElement.dataset.autoScroll || false,
      enableThumbs: this.coralScrollElement.dataset.thumbs || false,
      isThumbsSlider: this.coralScrollElement.dataset.isThumbsSlider
        ? true
        : false,
      infinite:
        this.coralScrollElement.dataset.infiniteScroll === 'true'
          ? true
          : false,
      snapAlignStyle: firstSlideElement
        ? getComputedStyle(firstSlideElement)['scroll-snap-align']
        : null,
      startPositionId: this.coralScrollElement.dataset.startPositionId,
      slideGrouping: this.coralScrollElement.dataset.group || 0,
      sliderClass: this.coralScrollElement.classList,
      slidesPerGroup: this.coralScrollElement.dataset.slidesPerGroup || 1,
      verticalOrHorizontal:
        getComputedStyle(this.sliderElement)['scroll-snap-type'] ===
          'y mandatory'
          ? 'vertical'
          : 'horizontal',
    }
  }

  /**
   * Debounce function.
   *
   * @param {function} func
   * @param {number} timeout
   *
   * @returns
   */
  debounce = (func, timeout = 50) => {
    let timer

    return (...args) => {
      // Clear previous set timer.
      clearTimeout(timer)

      // Set timer and perform function when timer runs out.
      timer = setTimeout(() => {
        func.apply(this, args)
      }, timeout)
    }
  }

  /**
   * Create a request to slide to a specific slide.
   * 
   * @param {string} sliderClassName 
   * @param {number} slideId 
   */
  createRequestToSlideEvent = (sliderClassName, slideId) => {
    const event = new CustomEvent('request-to-slide', {
      detail: {
        slideId: slideId,
        targetSliderClass: sliderClassName,
        sendFromSliderElement: this.coralScrollElement,
      },
    })

    document.dispatchEvent(event)
  }

  /**
   * Send event scrolled to new slide
   * 
   * @param {number} activeSlideId
   */
  sendScrolledToSlideEvent = (activeSlideId) => {
    const event = new CustomEvent('scrolled-to-slide', {
      detail: {
        activeSlide: activeSlideId,
        sendFromSliderElement: this.coralScrollElement,
      },
    })

    document.dispatchEvent(event)
  }

  /**
   * Return new slide id.
   * 
   * @returns {number} slideId
   */
  returnNewSlideId = () => {
    return parseInt((Math.random() * 9 + 1) * Math.pow(10, 9 - 1), 10)
  }

  /**
   * Handle initial slide id.
   * 
   * Check if each slide in the slider has a slide id.
   * If not create a random slide id.
   */
  handleInitialSlideId = () => {
    const slides = this.sliderElement.querySelectorAll('.slide:not(.js-hidden)')

    slides.forEach((slide) => {
      if (!slide.dataset.slideId) {
        const slideId = this.returnNewSlideId()
        slide.dataset.slideId = slideId
      }
    })
  }

  /**
   * Handle next slide.
   * 
   * Facade function to handle the next slide.
   */
  handleNextSlide = () => {
    const nextSlide = this.sliderElement.querySelector(
      '.slide.js-next-slide:not(.js-hidden)',
    )

    // Check if there is a 
    if (nextSlide) {
      const nextSlideId = nextSlide?.dataset.slideId
      const parentSliderClassName = this.coralScrollElement.dataset.thumbsParentClass
      const sliderClassName = this.coralScrollElement.classList
      // const event = new CustomEvent('request-to-slide', {
      //   detail: {
      //     slideId: nextSlideId,
      //     targetSliderClass: parentSliderClassName,
      //     sendFromSliderElement: this.coralScrollElement,
      //   },
      // })

      this.createRequestToSlideEvent(sliderClassName, nextSlideId)

      // if (this.sliderConfig.isThumbsSlider) {
      //   document.dispatchEvent(event)
      // }
    }
  }

  /**
   * Handle next slide grab.
   */
  handleNextGrabSlide = this.debounce(() => {
    this.handleNextSlide()
  }, 100)

  /**
   * Handle previous slide.
   * 
   * Facade function to handle the previous slide.
   */
  handlePreviousSlide = () => {
    const previousSlide = this.sliderElement.querySelector(
      '.slide.js-previous-slide:not(.js-hidden)',
    )

    // Check if there is a 
    if (previousSlide) {
      const previousSlideId = previousSlide?.dataset.slideId
      const parentSliderClassName = this.coralScrollElement.dataset.thumbsParentClass
      const sliderClassName = this.coralScrollElement.classList
      // const event = new CustomEvent('request-to-slide', {
      //   detail: {
      //     slideId: nextSlideId,
      //     targetSliderClass: parentSliderClassName,
      //     sendFromSliderElement: this.coralScrollElement,
      //   },
      // })

      this.createRequestToSlideEvent(sliderClassName, previousSlideId)

      // if (this.sliderConfig.isThumbsSlider) {
      //   document.dispatchEvent(event)
      // }
    }
  }

  /**
   * Handle previous slide grab.
   */
  handlePreviousGrabSlide = this.debounce(() => {
    this.handlePreviousSlide()
  }, 100)

  /**
   * Set start position slide active.
   * 
   * @param {number} slideIndex 
   */
  setStartPositionSlideActive = (slideIndex) => {
    const allSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden)',
    )
    const arrayOfAllSlideElements = allSlideElements
      ? [...allSlideElements]
      : null
    const initialActiveSlideElement = arrayOfAllSlideElements[slideIndex]
    const intialActiveSlideId = initialActiveSlideElement.dataset.slideId
    const sliderClassName = this.coralScrollElement.classList

    this.scrollToSlideId(intialActiveSlideId)
  }

  /**
   * Set listnener arrows.
   * 
   * Listen to the previous and next arrow click.
   */
  setListenerArrows = () => {
    const arrowsElement = this.coralScrollElement.querySelector(
      '.coral-scroll__arrows',
    )

    if (!arrowsElement) return null

    const previousArrow = arrowsElement?.querySelector('.previous')
    const nextArrow = arrowsElement?.querySelector('.next')

    previousArrow?.addEventListener('click', () => this.handlePreviousSlide())
    nextArrow.addEventListener('click', () => this.handleNextSlide())
  }

  /**
   * Set next and previous slide class.
   * 
   * @param {HTMLElement} newActiveSlideElement 
   */
  setNextAndPreviousSlideClass = (newActiveSlideElement) => {
    const allSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden)',
    )
    const arrayOfAllSlideElements = allSlideElements
      ? [...allSlideElements]
      : null
    const allNonCloneSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden):not(.js-clone)',
    )
    const arrayOfAllNonCloneSlideElements = allNonCloneSlideElements
      ? [...allNonCloneSlideElements]
      : null
    const firstSlideInSlider = arrayOfAllNonCloneSlideElements[0]
    const lastSlideInSlider = arrayOfAllNonCloneSlideElements[arrayOfAllNonCloneSlideElements.length - 1]

    arrayOfAllSlideElements.forEach((slideElement) => {
      slideElement.classList.remove('js-previous-slide')
      slideElement.classList.remove('js-next-slide')
    })

    // Set next and previous slide class.
    let previousSlideElement = newActiveSlideElement?.previousElementSibling
    let nextSlideElement = newActiveSlideElement?.nextElementSibling

    if (lastSlideInSlider === newActiveSlideElement) {
      // This is the last slide, so don't set a next slide.
      console.log('last slide')

      if (this.sliderConfig.slidesPerGroup > 1) {
        for (let i = 1; i < this.sliderConfig.slidesPerGroup; i++) {
          previousSlideElement = previousSlideElement?.previousElementSibling || previousSlideElement
        }
      }

      if (previousSlideElement) {
        previousSlideElement?.classList.add('js-previous-slide')
      }

      // If inifite loop is true, set the next slide to be the clone of the first slide.
      if (this.sliderConfig.infinite) {
        // Give the first slide in the slider an next class.
        firstSlideInSlider?.classList.add('js-next-slide')
      }
    } else if (firstSlideInSlider === newActiveSlideElement) {
      console.log('first slide')

      if (this.sliderConfig.slidesPerGroup > 1) {
        for (let i = 1; i < this.sliderConfig.slidesPerGroup; i++) {
          nextSlideElement = nextSlideElement?.nextElementSibling || nextSlideElement
        }
      }

      if (nextSlideElement) {
        nextSlideElement?.classList.add('js-next-slide')
      }

      // If inifite loop is true, set the next slide to be the clone of the first slide.
      if (this.sliderConfig.infinite) {
        // Give the first slide in the slider an next class.
        lastSlideInSlider?.classList.add('js-previous-slide')
      }
    } else {
      console.log('genreral slide case')

      if (this.sliderConfig.slidesPerGroup > 1) {
        for (let i = 1; i < this.sliderConfig.slidesPerGroup; i++) {
          previousSlideElement = previousSlideElement?.previousElementSibling || previousSlideElement
          nextSlideElement = nextSlideElement?.nextElementSibling || nextSlideElement
        }
      }

      if (previousSlideElement) {
        previousSlideElement?.classList.add('js-previous-slide')
      }

      if (nextSlideElement) {
        nextSlideElement?.classList.add('js-next-slide')
      }
    }
  }

  /**
   * Create groups of all the slides in the slider.
   * 
   * @param {*} data 
   * @param {*} n
   * 
   * @returns 
   */
  groupArr = (data, n) => {
    const group = []
    for (let i = 0, j = 0; i < data.length; i++) {
      if (i >= n && i % n === 0) j++
      group[j] = group[j] || []
      group[j].push(data[i])
    }
    return group
  }

  /**
   * Set clonse of slides for infitite scroll.
   */
  setClonesOfSlideForInifiteScroll = () => {
    if (this.sliderConfig.infinite === true) {
      if (this.sliderElement.dataset.clonesActive !== 'true') {
        const allSlideElements = this.sliderElement.querySelectorAll(
          '.slide:not(.js-hidden):not(.js-clone)',
        )
        const arrayOfAllSlideElements = allSlideElements
          ? [...allSlideElements]
          : null

        this.sliderElement.dataset.clonesActive = 'true'

        // Set clones of the last slide group before the first slide, and the first slide group after the last slide.
        const allGroups = this.groupArr(
          arrayOfAllSlideElements,
          this.sliderConfig.slidesPerGroup,
        )
        const firstGroup = allGroups[0]
        const lastGroup = allGroups[allGroups.length - 1]

        if (lastGroup) {
          lastGroup.map((slideElement) => {
            const cloneSlide = slideElement.cloneNode(true)
            // Remove active class from clone slide.
            cloneSlide.classList.remove('js-active')
            cloneSlide.classList.add('js-clone')
            cloneSlide.dataset.slideId = this.returnNewSlideId()
            cloneSlide.dataset.cloneId = slideElement.dataset.slideId

            this.sliderElement.insertAdjacentElement('afterbegin', cloneSlide)
          })
        }

        if (firstGroup) {
          firstGroup.map((slideElement) => {
            const cloneSlide = slideElement.cloneNode(true)
            // Remove active class from clone slide.
            cloneSlide.classList.remove('js-active')
            cloneSlide.classList.add('js-clone')
            cloneSlide.dataset.slideId = this.returnNewSlideId()
            cloneSlide.dataset.cloneId = slideElement.dataset.slideId

            this.sliderElement.insertAdjacentElement('beforeend', cloneSlide)
          })
        }
      }
    }
  }

  /**
   * Scroll to slide id,
   * 
   * @param {number} slideId 
   */
  scrollToSlideId = (slideId) => {
    let newActiveSlideElement = this.sliderElement.querySelector(`[data-slide-id="${slideId}"]:not(.js-hidden)`)

    if (this.sliderConfig.verticalOrHorizontal === 'vertical') {
      const offsetTopSlide = newActiveSlideElement?.offsetTop

      this.sliderElement.scrollTo({
        top: offsetTopSlide,
        left: 0,
        behavior: 'smooth',
      })
    } else {
      const offsetLeftSlide = newActiveSlideElement?.offsetLeft

      this.sliderElement.scrollTo({
        top: 0,
        left: offsetLeftSlide,
        behavior: 'smooth',
      })
    }
  }

  /**
   * Set active slide class on slide element.
   * 
   * @param {HTMLElement} newActiveSlideElement 
   */
  setActiveSlideClass = (newActiveSlideElement) => {
    const allSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden)',
    )
    const arrayOfAllSlideElements = allSlideElements
      ? [...allSlideElements]
      : null

    arrayOfAllSlideElements.map((slideElement) => {
      slideElement?.classList.remove('js-active')
    })

    newActiveSlideElement?.classList.add('js-active')
  }

  /**
   * Set styling arrows.
   * 
   * If the active slide is the first slide, disable the previous arrow.
   * If the active slide is the last slide, disable the next arrow.
   * 
   * If the slider is inifite, always show the arrows.
   */
  setStylingArrows = (activeSlideElement) => {
    const arrowsElement = this.coralScrollElement.querySelector(
      '.coral-scroll__arrows',
    )

    if (!arrowsElement) return null

    const previousArrow = arrowsElement?.querySelector('.previous')
    const nextArrow = arrowsElement?.querySelector('.next')
    const allSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden):not(.js-clone)',
    )
    const arrayOfAllSlideElements = allSlideElements
      ? [...allSlideElements]
      : null
    const firstSlideInSlider = arrayOfAllSlideElements[0]
    const lastSlideInSlider = arrayOfAllSlideElements[arrayOfAllSlideElements.length - 1]

    if (previousArrow) {
      if (this.sliderConfig.infinite === true) {
        previousArrow.classList.remove('js-disabled')
      } else if (firstSlideInSlider === activeSlideElement) {
        previousArrow.classList.add('js-disabled')
      } else {
        previousArrow.classList.remove('js-disabled')
      }
    }

    if (nextArrow) {
      if (this.sliderConfig.infinite === true) {
        nextArrow.classList.remove('js-disabled')
      } else if (lastSlideInSlider === activeSlideElement) {
        nextArrow.classList.add('js-disabled')
      } else {
        nextArrow.classList.remove('js-disabled')
      }
    }
  }

  /**
   * Set active thumb
   */
  setActiveThumbs = (slideElement) => {
    const thumbsSliderClassName = this.sliderConfig.enableThumbs
    const allThumbsSliderElements = document.querySelectorAll(
      `.coral-scroll.${thumbsSliderClassName}`,
    )

    allThumbsSliderElements?.forEach((thumbsSliderElement) => {
      if (this.sliderConfig.isThumbsSlider === false && thumbsSliderElement) {
        const allThumbsElement = thumbsSliderElement.querySelectorAll('.slide')

        allThumbsElement.forEach((thumbElement) => {
          thumbElement.classList.remove('js-active')
          const slideId = thumbElement.dataset.slideId

          const event = new CustomEvent('request-to-slide', {
            detail: {
              slideId: slideId,
              targetSliderClass: this.sliderConfig.enableThumbs.classList,
              sendFromSliderElement: this.coralScrollElement,
            },
          })

          document.dispatchEvent(event)
        })
      }
    })
  }

  /**
   * Set next and previous slide class by slide id.
   * 
   * Set the previous class to the previous slide element of the element givern by the slide id.
   * Set the next class to the next slide element of the element givern by the slide id.
   * 
   * @param {Number} slideId 
   */
  handleSettingNextAndPreviousSlide = (slideId) => {
    // Get the new active slide element,
    const newActiveSlideElement = this.sliderElement.querySelector(`[data-slide-id="${slideId}"]:not(.js-hidden)`)

    console.log(newActiveSlideElement)

    this.setNextAndPreviousSlideClass(newActiveSlideElement)
  }

  /**
   * Set next and previous slide class by slide index.
   * 
   * Set the previous class to the previous slide element of the element givern by the slide index.
   * Set the next class to the next slide element of the element givern by the slide index.
   * 
   * @param {Number} slideIndex
   */
  handleSettingNextAndPreviousSlideBySlideIndex = (slideIndex) => {
    // Get the new active slide element,
    const allSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden)',
    )
    const arrayOfAllSlideElements = allSlideElements
      ? [...allSlideElements]
      : null
    const newActiveSlideElement = arrayOfAllSlideElements[slideIndex]

    this.setNextAndPreviousSlideClass(newActiveSlideElement)
  }

  /**
   * Set general slider listeners.
   */
  setGeneralSliderListeners = () => {
    document.addEventListener('request-to-slide', (event) => {
      const eventDetails = event.detail
      const targetSliderClass = eventDetails.targetSliderClass
      const newActiveSlideId = eventDetails.slideId

      if (targetSliderClass === this.sliderConfig.sliderClass) {
        console.log('request to slide', newActiveSlideId)
        let newActiveSlideElement = this.sliderElement.querySelector(`[data-slide-id="${newActiveSlideId}"]:not(.js-hidden)`)
        // this.setActiveIndicator(newSlide)
        // this.setActiveThumbs(newSlide)

        this.setNextAndPreviousSlideClass(newActiveSlideElement)
        this.setActiveSlideClass(newActiveSlideElement)
        this.setStylingArrows(newActiveSlideElement)
        this.scrollToSlideId(newActiveSlideId)
        this.sendScrolledToSlideEvent(newActiveSlideId)
      }
    })

    document.addEventListener('scrolled-to-slide', (event) => {
      const eventDetails = event.detail
      const activeSlide = eventDetails.activeSlide
      const eventFromSlider = eventDetails.sendFromSliderElement
      let newActiveSlideElement = this.sliderElement.querySelector(`[data-slide-id="${activeSlide}"]:not(.js-hidden)`)

      if (eventFromSlider == this.coralScrollElement) {
        if (newActiveSlideElement.classList.contains('js-clone')) {
          // This is the a clone slide, so go to the orignal slide.
          this.handleNextSlide()
        }
      }
    })
  }

  /**
   * Set listeners for the grab overlay.
   */
  setListenersGrab = () => {
    // Mouse down shows the overlay.
    this.sliderElement.addEventListener('mousedown', () => {
      this.showOverlay = true
    })

    // Mousemove over the slider. When the overlay is visible it will trigger an mousedown event on the graboverlay element.
    this.sliderElement.addEventListener('mousemove', (event) => {
      if (this.showOverlay) {
        this.grabOverlayElement?.classList.add('js-active')
        const mouseEvent = new MouseEvent('mousedown', event)

        this.grabOverlayElement?.dispatchEvent(mouseEvent)
      }
    })

    // This will stop the overlay from showing when the mouse is up.
    this.sliderElement.addEventListener('mouseup', () => {
      const mouseEvent = new MouseEvent('mouseup')
      this.grabOverlayElement?.classList.remove('js-active')

      this.grabOverlayElement?.dispatchEvent(mouseEvent)

      this.showOverlay = false
    })

    if (this.grabOverlayElement) {
      this.grabOverlayElement.addEventListener('mousedown', (event) => {
        const allSlidesInScroll = this.sliderElement.querySelectorAll(
          '.slide:not(.js-hidden)',
        )
        const arrayAllSlidesInScroll = [...allSlidesInScroll]

        this.isDown = true
        this.sliderElement.classList.add('js-active')
        this.startX = event.pageX - this.sliderElement.offsetLeft

        arrayAllSlidesInScroll.map((slideElement) => {
          slideElement.ondragstart = function () {
            return false
          }
        })
      })

      const handleMouseUpAndOut = () => {
        this.isDown = false
        this.grabOverlayElement.classList.remove('js-active')
        this.showOverlay = false

        setTimeout(() => {
          this.sliderElement.classList.remove('js-active')
        }, 1000)
      }

      this.grabOverlayElement.addEventListener('mouseup', (event) =>
        handleMouseUpAndOut(event),
      )

      this.grabOverlayElement.addEventListener('mousemove', (event) => {
        if (!this.isDown) return
        event.preventDefault()

        const x = event.pageX - this.sliderElement.offsetLeft
        const walk = x - this.startX //scroll-fast

        if (walk >= -this.sliderConfig.grabVelocity && walk <= 0) {
          this.handleNextGrabSlide()
        }

        if (walk >= this.sliderConfig.grabVelocity && walk >= 0) {
          this.handlePreviousGrabSlide()
        }
      })
    }
  }

  /**
   * Initialize slider.
   * 
   * Set the classes and prepare the slider for use.
   */
  initializeSlider = () => {
    // Check if the slides have a slide id. If not, add one.
    this.handleInitialSlideId()

    const allSlideElements = this.sliderElement.querySelectorAll(
      '.slide:not(.js-hidden)',
    )
    const arrayOfAllSlideElements = allSlideElements
      ? [...allSlideElements]
      : null
    let activeSlideIndex = 0

    if (this.sliderConfig.startPositionId) {
      activeSlideIndex = this.sliderConfig.startPositionId
    } else {
      const firstNonCloneSlideElement = this.sliderElement.querySelector('.slide:not(.js-hidden):not(.js-clone)')
      const indexOfFirstNonCloneSlide = arrayOfAllSlideElements.indexOf(firstNonCloneSlideElement)

      activeSlideIndex = indexOfFirstNonCloneSlide
    }
    const firstSlideElement = arrayOfAllSlideElements[activeSlideIndex]
    const firstSlideId = firstSlideElement?.dataset.slideId

    this.coralScrollElement.dataset.coralScrollId = this.coralScrollId

    // Set start position slide active.
    this.setStartPositionSlideActive(activeSlideIndex)

    // Set the dots for indicator in the slider.
    // this.setNewDots()

    // Set the first or dataset slide as active slide.
    if (!this.sliderConfig.isThumbsSlider) {
      this.setActiveSlideClass(firstSlideElement)
    }

    // Set the styling for the arrows.
    this.setStylingArrows(firstSlideElement)

    // Set lisntener arrows.
    this.setListenerArrows()

    // Set the clones for the infinite scroll option.
    this.setClonesOfSlideForInifiteScroll()

    // Set the next and previous slide class.
    this.handleSettingNextAndPreviousSlide(firstSlideId)

    // Set listener to the slider.
    this.setGeneralSliderListeners()

    // Set listener to the grab overlay.
    this.setListenersGrab()

    setTimeout(() => {
      // Set listener dots.
      // this.setListenersToTheDots()

      // Set listener to thumbs
      // this.setListenersToThumbs()

      // Set active indicator.
      // this.setActiveIndicator(activeSlide)

      this.setActiveThumbs(firstSlideElement)
    }, 50)
  }
}

export default CoralScrollCore