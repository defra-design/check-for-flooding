'use strict'
// This file represents the map container.
// It is responsible for initialising the map
// using the ol.view, layers and other options passed.
// It also controls the zoom, full screen controls, responsiveness etc.
// No implementation details specific to a map should be in here.
// This is a generic container that could be reused for LTFRI maps, FMfP etc.
// ***To include a key, include an element with `.map-key__container` in the main inner element.
// To include a key pass its template name as an option

// DL: Includes body-scroll-lock package.

import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { Map } from 'maplibre-gl'

const { addOrUpdateParameter, forEach } = window.flood.utils

window.flood.maps.MapContainer = function MapContainer (mapId, options) {
  // Setup defaults
  const defaults = {
    minIconResolution: window.flood.maps.minResolution,
    keyTemplate: ''
  }
  options = Object.assign({}, defaults, options)

  // State object
  const state = {
    isKeyOpen: false,
    isInfoOpen: false,
    isAttributionsOpen: false,
    isMobile: false,
    isTablet: false,
    isBack: options.isBack
  }

  // Disable body scrolling and hide non-map elements
  document.title = options.title
  document.body.classList.add('defra-map-body')
  document.documentElement.classList.add('defra-map-html')

  // Create the map container element
  const containerElement = document.createElement('div')
  containerElement.id = mapId
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-labelledby', 'mapLabel')
  document.body.appendChild(containerElement)

  // Create the main dialog heading
  const mapLabel = document.createElement('h1')
  mapLabel.id = 'mapLabel'
  mapLabel.className = 'defra-map__title'
  mapLabel.innerText = options.heading || 'Map view'
  containerElement.appendChild(mapLabel)

  // Remove default controls
  // const controls = defaultControls({
  //   zoom: false,
  //   rotate: false,
  //   attribution: false
  // })

  // Render map
  // const map = new Map({
  //   target: containerElement,
  //   layers: options.layers,
  //   view: options.view,
  //   controls: controls
  // })

  // Define viewport
  const viewport = document.createElement('div')
  viewport.id = 'viewport'
  viewport.setAttribute('role', 'application')
  viewport.setAttribute('aria-label', 'Interactive map viewer')
  viewport.setAttribute('aria-describedby', 'viewportDescription')
  viewport.setAttribute('aria-live', 'assertive')
  viewport.className = `defra-map-viewport ${viewport.className}`
  viewport.tabIndex = 0
  containerElement.appendChild(viewport)

  // Create viewport description container
  const viewportDescription = document.createElement('div')
  viewportDescription.id = 'viewportDescription'
  viewportDescription.className = 'govuk-visually-hidden'
  viewport.appendChild(viewportDescription)

  // Create controls container
  const controlsElement = document.createElement('div')
  controlsElement.className = 'defra-map-controls'
  containerElement.appendChild(controlsElement)

  // Create exit map button
  const exitMapButtonElement = document.createElement('button')
  exitMapButtonElement.innerHTML = state.isBack ? '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M4.828,11L12.314,18.485L10.899,19.899L1,10L10.899,0.101L12.314,1.515L4.828,9L19,9L19,11L4.828,11Z" style="fill:currentColor;stroke:currentColor;stroke-width:0.1px"/></svg><span>Exit map</span>' : '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M10,8.6L15.6,3L17,4.4L11.4,10L17,15.6L15.6,17L10,11.4L4.4,17L3,15.6L8.6,10L3,4.4L4.4,3L10,8.6Z" style="fill:currentColor;stroke:currentColor;stroke-width:0.1px;"/></svg><span>Exit map</span>'
  exitMapButtonElement.className = 'defra-map__exit'
  controlsElement.appendChild(exitMapButtonElement)

  // Create the open key button
  const openKeyButtonElement = document.createElement('button')
  openKeyButtonElement.className = 'defra-map__open-key'
  openKeyButtonElement.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M17.215,11.31L19,12.5L10,18.5L1,12.5L2.785,11.31L9.945,16.083C9.978,16.106 10.022,16.106 10.055,16.083L17.215,11.31Z" style="fill:currentColor;"/><path d="M10,1.5L1,7.5L10,13.5L19,7.5L10,1.5ZM10,3.88L15.43,7.5L10,11.12L4.57,7.5L10,3.88Z" style="fill:currentColor;"/></svg><span class="govuk-visually-hidden">Open key</span>'
  controlsElement.appendChild(openKeyButtonElement)

  // Create controls container element
  const controlsBottomElement = document.createElement('div')
  controlsBottomElement.className = 'defra-map-controls__bottom'
  controlsElement.appendChild(controlsBottomElement)

  // Create reset control
  const resetButtonElement = document.createElement('button')
  resetButtonElement.className = 'defra-map-reset'
  resetButtonElement.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M2.054,7.871L5.25,1.407L9.25,8.335L2.054,7.871Z" style="fill:currentColor;"/><path d="M7.25,4.871C8.206,4.317 9.316,4 10.5,4C14.087,4 17,6.913 17,10.5C17,14.087 14.087,17 10.5,17C6.913,17 4,14.087 4,10.5" style="fill:none;fill-rule:nonzero;stroke:currentColor;stroke-width:2px;"/></svg><span class="govuk-visually-hidden">Reset location</span>'
  resetButtonElement.setAttribute('disabled', '')
  resetButtonElement.setAttribute('aria-controls', 'viewport')
  controlsBottomElement.appendChild(resetButtonElement)

  // Create zoom controls
  const zoomInElement = document.createElement('button')
  zoomInElement.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;"><rect x="3" y="9" width="14" height="2"/><rect x="9" y="3" width="2" height="14"/></svg><span class="govuk-visually-hidden">Zoom in</span>'
  zoomInElement.setAttribute('class', 'defra-map-zoom-in')
  zoomInElement.setAttribute('aria-controls', 'viewport')
  const zoomOutElement = document.createElement('button')
  zoomOutElement.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;"><rect x="3" y="9" width="14" height="2"/></svg><span class="govuk-visually-hidden">Zoom out</span>'
  zoomOutElement.setAttribute('class', 'defra-map-zoom-out')
  zoomOutElement.setAttribute('aria-controls', 'viewport')
  controlsBottomElement.appendChild(zoomInElement)
  controlsBottomElement.appendChild(zoomOutElement)

  // Create attribution control
  const attributtionElement = document.createElement('button')
  attributtionElement.className = 'defra-map-attribution'
  attributtionElement.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M10,2.5C11.286,2.5 12.52,2.823 13.701,3.469C14.883,4.116 15.811,5.038 16.487,6.235C17.162,7.433 17.5,8.688 17.5,10C17.5,11.305 17.169,12.551 16.506,13.735C15.844,14.92 14.92,15.844 13.735,16.506C12.551,17.169 11.305,17.5 10,17.5C8.695,17.5 7.449,17.169 6.265,16.506C5.08,15.844 4.156,14.92 3.494,13.735C2.831,12.551 2.5,11.305 2.5,10C2.5,8.688 2.838,7.433 3.513,6.235C4.189,5.038 5.117,4.116 6.299,3.469C7.48,2.823 8.714,2.5 10,2.5ZM10,3.978C8.969,3.978 7.978,4.236 7.028,4.752C6.079,5.268 5.333,6.007 4.791,6.97C4.249,7.932 3.978,8.943 3.978,10C3.978,11.044 4.244,12.043 4.776,12.996C5.308,13.949 6.051,14.692 7.004,15.224C7.957,15.756 8.956,16.022 10,16.022C11.044,16.022 12.043,15.756 12.996,15.224C13.949,14.692 14.692,13.949 15.224,12.996C15.756,12.043 16.022,11.044 16.022,10C16.022,8.949 15.751,7.941 15.209,6.975C14.667,6.008 13.921,5.268 12.972,4.752C12.022,4.236 11.031,3.978 10,3.978ZM11.821,11.116L13.398,11.645C13.149,12.467 12.738,13.097 12.164,13.535C11.589,13.972 10.904,14.191 10.108,14.191C8.992,14.191 8.081,13.825 7.376,13.094C6.671,12.363 6.319,11.354 6.319,10.069C6.319,9.227 6.475,8.476 6.789,7.817C7.102,7.157 7.554,6.664 8.145,6.338C8.735,6.012 9.396,5.849 10.127,5.849C10.93,5.849 11.601,6.039 12.139,6.421C12.678,6.803 13.097,7.405 13.398,8.228L11.811,8.6C11.629,8.123 11.392,7.777 11.102,7.562C10.811,7.347 10.467,7.239 10.069,7.239C9.475,7.239 8.988,7.462 8.61,7.91C8.231,8.357 8.042,9.057 8.042,10.01C8.042,10.963 8.228,11.664 8.6,12.115C8.972,12.565 9.419,12.79 9.941,12.79C10.379,12.79 10.757,12.662 11.077,12.404C11.397,12.146 11.645,11.717 11.821,11.116Z" style="fill:currentColor;"/></svg><span class="govuk-visually-hidden">Copyright information</span>'
  controlsBottomElement.appendChild(attributtionElement)

  // Create feature information panel
  const infoElement = document.createElement('div')
  infoElement.className = 'defra-map-info'
  infoElement.id = 'info'
  infoElement.setAttribute('role', 'dialog')
  infoElement.setAttribute('open', true)
  infoElement.setAttribute('aria-modal', true) // Technically this should be false
  infoElement.setAttribute('aria-labelledby', 'infoLabel')
  infoElement.setAttribute('aria-describedby', 'infoDescription')
  infoElement.tabIndex = -1
  const infoLabel = document.createElement('h2')
  infoLabel.id = 'infoLabel'
  infoLabel.classList.add('govuk-visually-hidden')
  const closeInfoButton = document.createElement('button')
  closeInfoButton.className = 'defra-map-info__close'
  closeInfoButton.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M10,8.6L15.6,3L17,4.4L11.4,10L17,15.6L15.6,17L10,11.4L4.4,17L3,15.6L8.6,10L3,4.4L4.4,3L10,8.6Z" style="fill:currentColor;stroke:currentColor;stroke-width:0.1px;"/></svg><span class="govuk-visually-hidden">Close</span>'
  const infoContainer = document.createElement('div')
  infoContainer.className = 'defra-map-info__container'
  const infoContent = document.createElement('div')
  infoContent.id = 'infoContent'
  infoContent.className = 'defra-map-info__content'
  infoContainer.appendChild(infoContent)
  infoContainer.appendChild(closeInfoButton)
  infoElement.appendChild(infoLabel)
  infoElement.appendChild(infoContainer)

  // Create key
  const keyElement = document.createElement('div')
  keyElement.className = 'defra-map-key'
  keyElement.id = 'key'
  keyElement.setAttribute('aria-labelledby', 'mapKeyLabel')
  keyElement.tabIndex = -1
  const keyContainer = document.createElement('div')
  keyContainer.className = 'defra-map-key__container'
  const keyTitle = document.createElement('h2')
  keyTitle.id = 'mapKeyLabel'
  keyTitle.className = 'defra-map-key__title'
  keyTitle.innerHTML = '<span role="text">Key <span class="govuk-visually-hidden">for map features</span></span>'
  keyContainer.appendChild(keyTitle)
  const closeKeyButton = document.createElement('button')
  closeKeyButton.className = 'defra-map-key__close'
  closeKeyButton.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M10,8.6L15.6,3L17,4.4L11.4,10L17,15.6L15.6,17L10,11.4L4.4,17L3,15.6L8.6,10L3,4.4L4.4,3L10,8.6Z" style="fill:currentColor;stroke:currentColor;stroke-width:0.1px;"/></svg><span class="govuk-visually-hidden">Close key</span>'
  keyContainer.appendChild(closeKeyButton)
  const keyContent = document.createElement('div')
  keyContent.className = 'defra-map-key__content'
  keyContent.innerHTML = window.nunjucks.render(options.keyTemplate)
  keyContainer.appendChild(keyContent)
  keyElement.appendChild(keyContainer)
  containerElement.appendChild(keyElement)

  // Hide all map siblings from screen readers
  const mapSiblings = document.querySelectorAll('body > *:not(.defra-map):not(script):not([aria-hidden="true"])')
  forEach(mapSiblings, (mapSibling) => {
    mapSibling.setAttribute('aria-hidden', 'true')
    mapSibling.classList.add('defra-map-visibility-hidden')
  })

  // Move focus to first interactive element inside the dialog
  viewport.focus()

  //
  // Private methods
  //

  const hideSiblings = (isHidden) => {
    const siblings = document.querySelectorAll(`#${mapId} > *:not(#info):not(#key)`)
    forEach(siblings, (sibling) => { sibling.setAttribute('aria-hidden', isHidden) })
  }

  const exitMap = () => {
    if (state.isBack) {
      // Browser back
      window.history.back()
    } else {
      // Remove url parameters
      let uri = window.location.href
      options.queryParamKeys.forEach(key => {
        uri = addOrUpdateParameter(uri, key, '')
      })
      // Reset history
      const data = { v: '', isBack: false }
      const title = document.title.replace('Map view: ', '')
      window.history.replaceState(data, title, uri)
    }
    // Reset document
    map.remove()
    removeContainer()
  }

  const removeContainer = () => {
    if (containerElement) { // Safari fires popstate on page load
      // Reinstate document properties
      document.title = options.originalTitle
      // Unlock body scroll
      document.body.classList.remove('defra-map-body')
      document.documentElement.classList.remove('defra-map-html')
      clearAllBodyScrollLocks()
      // Re-instate aria-hidden elements
      forEach(mapSiblings, (mapSibling) => {
        mapSibling.removeAttribute('aria-hidden')
        mapSibling.classList.remove('defra-map-visibility-hidden')
      })
      // Remove map and return focus
      containerElement.parentNode.removeChild(containerElement)
      const button = document.getElementById(mapId + '-btn')
      button.focus()
      // Remove any document or window listeners
      window.removeEventListener('keydown', manageTabRings)
      window.removeEventListener('keydown', manageZoomPan)
      window.removeEventListener('keyup', manageEscapeKeyPress)
      window.removeEventListener('popstate', popstate)
      window.removeEventListener('resize', windowResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', visualViewportResize)
      }
    }
  }

  const openKey = () => {
    // Close info if its currently open
    if (state.isInfoOpen) { closeInfo() }
    // Prevent screen reader from accessing siblings
    hideSiblings(true)
    state.isKeyOpen = true
    containerElement.classList.add('defra-map--key-open')
    keyElement.style.display = 'block' // Safari v14 bug
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    keyElement.setAttribute('aria-hidden', false)
    keyElement.focus()
    // Lock body scroll
    disableBodyScroll(document.querySelector('.defra-map-key__content'))
  }

  const closeKey = () => {
    state.isKeyOpen = false
    containerElement.classList.remove('defra-map--key-open')
    if (state.isTablet) {
      keyElement.setAttribute('open', false)
      keyElement.setAttribute('aria-modal', true)
      keyElement.style.display = 'none' // Safari v14 bug
    }
    keyElement.setAttribute('aria-hidden', state.isTablet)
    hideSiblings(false)
    openKeyButtonElement.focus()
  }

  const closeInfo = () => {
    // Re-enable screen reader announcement of viewport changes
    viewport.setAttribute('aria-live', 'assertive')
    state.isInfoOpen = false
    infoElement.parentNode.removeChild(infoElement)
    containerElement.classList.remove('defra-map--info-open')
    // Re-enable screen reader access to siblings
    hideSiblings(false)
    keyElement.setAttribute('aria-hidden', state.isTablet)
    state.isAttributionsOpen ? attributtionElement.focus() : viewport.focus()
    state.isAttributionsOpen = false
  }

  const removeCanvasAttributes = () => {
    // Remove unecessary elements
    containerElement.getElementsByClassName('maplibregl-control-container')[0].remove()
    const canvas = containerElement.getElementsByClassName('mapboxgl-canvas')[0]
    canvas.removeAttribute('class')
    canvas.removeAttribute('tabindex')
    canvas.removeAttribute('aria-label')
    canvas.setAttribute('role', 'presentation')
  }

  // Tabrings and regions
  const manageTabRings = (e) => {
    const keys = ['Tab', 'F6']
    if (!keys.includes(e.key)) { return }
    tabletListener(tabletMediaQuery)
    if (e.key === 'Tab') {
      // Constrain tab keypress to current dialog
      const tabring = document.activeElement.closest('*[role="dialog"]') || containerElement
      const selectors = [
        'a[href]:not([disabled]):not([hidden])',
        'button:not([disabled]):not([hidden])',
        'textarea:not([disabled]):not([hidden])',
        'input[type="text"]:not([disabled]):not([hidden])',
        'input[type="radio"]:not([disabled]):not([hidden])',
        'input[type="checkbox"]:not([disabled]):not([hidden])',
        'select:not([disabled]):not([hidden])',
        '*[tabindex="0"]:not([disabled]):not([hidden])'
      ]
      let specificity = selectors.map(i => `#${tabring.id} ${i}`).join(',')
      if (tabring.classList.contains('defra-map')) {
        specificity = `#${tabring.id} div[role="application"]` + ','
        specificity += selectors.map(i => `#${tabring.id} > .defra-map-controls ${i}`).join(',') + ','
        specificity += selectors.map(i => `#${tabring.id} div[role="region"] ${i}`).join(',')
      }
      const focusableEls = document.querySelectorAll(specificity)
      const firstFocusableEl = focusableEls[0]
      const lastFocusableEl = focusableEls[focusableEls.length - 1]
      // Tab and shift tab
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableEl || document.activeElement.getAttribute('tabindex') === '-1') {
          lastFocusableEl.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus()
          e.preventDefault()
        }
      }
      // VoiceOver verbosity issues?? Remove info label and descrition
      if (state.isInfoOpen) {
        infoElement.removeAttribute('aria-labelledby')
        infoElement.removeAttribute('aria-describedby')
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'F6') {
      // Move focus between regions
      const regionSelector = '.defra-map div[role="dialog"][open="true"], .defra-map div[role="region"], .defra-map div[role="application"]'
      const regions = [].slice.call(document.querySelectorAll(regionSelector))
      const activeRegion = document.activeElement.closest(regionSelector) || viewport
      const activeIndex = regions.indexOf(activeRegion)
      let nextIndex = activeIndex
      if (e.shiftKey) {
        nextIndex = activeIndex === 0 ? regions.length - 1 : activeIndex - 1
      } else {
        nextIndex = activeIndex === regions.length - 1 ? 0 : activeIndex + 1
      }
      regions[nextIndex].focus()
      document.activeElement.setAttribute('keyboard-focus', '')
    }
  }

  // Zoom and pan
  const manageZoomPan = (e) => {
    const isInput = document.activeElement.tagName === 'INPUT'
    const keys = ['-', '+', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!keys.includes(e.key) || e.ctrlKey || e.metaKey || isInput) {
      return
    }
    const direction = { ArrowUp: [0, -100], ArrowDown: [0, 100], ArrowLeft: [-100, 0], ArrowRight: [100, 0] }
    if (e.key === '+') {
      map.zoomIn({ duration: 250 })
    } else if (e.key === '-') {
      map.zoomOut({ duration: 250 })
    } else {
      map.panBy(direction[e.key], { duration: 250 })
    }
  }

  // Escape (keyup) to close dialogs
  const manageEscapeKeyPress = (e) => {
    // Tabbing into web area from browser controls
    if (!containerElement.contains(document.activeElement)) {
      const firstInteractiveElement = containerElement.querySelector('#info[open="true"], #key[open="true"][role="dialog"]') || viewport
      firstInteractiveElement.focus()
      firstInteractiveElement.setAttribute('keyboard-focus', '')
    }
    const keys = ['Escape', 'Esc']
    if (!keys.includes(e.key)) { return }
    // Escape key behavior
    if (state.isInfoOpen) {
      closeInfoButton.click()
    } else if (state.isTablet && state.isKeyOpen) {
      closeKeyButton.click()
    } else {
      exitMapButtonElement.click()
    }
    // VoiceOver verbosity issues?? Re-instate info label and description
    if (state.isInfoOpen) {
      infoElement.setAttribute('aria-labelledby', 'infoLabel')
      infoElement.setAttribute('aria-describedby', 'infoDescription')
    }
  }

  //
  // Setup
  //

  const map = new Map({
    style: 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-outdoor/style.json?optimize=true',
    // style: 'https://api.os.uk/maps/vector/v1/vts/resources/styles?key=4flNisK69QG6w6NGkDZ4CZz0CObcUA5h',
    attributionControl: false,
    container: 'viewport',
    center: options.centre,
    bounds: options.bounds,
    touchZoomRotate: false,
    dragRotate: false,
    minZoom: 6,
    maxZoom: 16,
    zoom: options.zoom,
    fadeDuration: 0
    // transformRequest: url => {
    //   url += '&srs=3857'
    //   return {
    //     url: url
    //   }
    // }
  })

  // Remove default keyboardZoom interaction
  // map.getInteractions().forEach((interaction) => {
  //   if (interaction instanceof KeyboardZoom || interaction instanceof PinchRotate) {
  //     interaction.setActive(false)
  //   }
  // })

  //
  // Public properties
  //

  this.map = map
  this.containerElement = containerElement
  this.viewport = viewport
  this.viewportDescription = viewportDescription
  this.keyElement = keyElement
  this.infoElement = infoElement
  this.resetButton = resetButtonElement
  this.openKeyButton = openKeyButtonElement
  this.closeKeyButton = closeKeyButton
  this.closeInfoButton = closeInfoButton
  this.attributionButton = attributtionElement
  this.state = state

  //
  // Public methods
  //

  this.showInfo = (title, body) => {
    // Close key if its currently open
    closeKey()
    // Prevent screen reader from accessing siblings and key
    hideSiblings(true)
    keyElement.setAttribute('aria-hidden', true)
    containerElement.classList.add('defra-map--info-open')
    // Temporarily stop screen reader announcing viewport changes
    viewport.setAttribute('aria-live', 'off')
    infoLabel.innerText = title
    infoContent.innerHTML = body
    containerElement.appendChild(infoElement)
    state.isInfoOpen = true
    // infoElement.focus()
  }

  //
  // Events
  //

  // Amend canvas properties
  map.once('load', removeCanvasAttributes)

  // Mobile behavior
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  const zoomButtons = document.querySelectorAll('.defra-map-zoom button')
  const mobileListener = (mobileMediaQuery) => {
    state.isMobile = mobileMediaQuery.matches
    forEach(zoomButtons, (button) => {
      button.hidden = state.isMobile
    })
  }
  mobileMediaQuery.addListener(mobileListener)
  mobileListener(mobileMediaQuery)

  // Tablet (upto portrait) behavior
  const tabletMediaQuery = window.matchMedia('(max-width: 834px)')
  const tabletListener = (tabletMediaQuery) => {
    state.isTablet = tabletMediaQuery.matches
    state.isKeyOpen = (containerElement.classList.contains('defra-map--key-open') && state.isTablet) || !state.isTablet
    keyElement.setAttribute('role', state.isTablet ? 'dialog' : 'region')
    hideSiblings(state.isInfoOpen || (state.isKeyOpen && state.isTablet))
    closeKeyButton.hidden = !state.isTablet
    openKeyButtonElement.hidden = !state.isTablet
    if (state.isTablet) {
      keyElement.setAttribute('open', state.isKeyOpen)
      keyElement.setAttribute('aria-modal', true)
      keyElement.style.display = state.isKeyOpen ? 'block' : 'none' // Safari v14 bug
    } else {
      keyElement.removeAttribute('open')
      keyElement.removeAttribute('aria-modal')
      keyElement.style.display = 'block' // Safari v14 bug
    }
    keyElement.setAttribute('aria-hidden', (state.isTablet && !state.isKeyOpen) || (!state.isTablet && state.isInfoOpen))
  }
  tabletMediaQuery.addListener(tabletListener)
  tabletListener(tabletMediaQuery)

  // Map click
  map.on('click', (e) => {
  // viewport.addEventListener('click', (e) => {
    // Hide key
    if (state.isTablet && state.isKeyOpen) { closeKey() }
    // Close info panel
    if (state.isInfoOpen) { closeInfo() }
    viewport.focus()
  })

  // Exit map click
  exitMapButtonElement.addEventListener('click', (e) => {
    exitMap()
  })

  // Open key click
  openKeyButtonElement.addEventListener('click', (e) => {
    openKey()
  })

  // Close key click
  closeKeyButton.addEventListener('click', (e) => {
    closeKey()
  })

  // Zoom in
  zoomInElement.addEventListener('click', (e) => {
    map.zoomIn({ duration: 250 })
  })

  // Zoom in
  zoomOutElement.addEventListener('click', (e) => {
    map.zoomOut({ duration: 250 })
  })

  // Show attributions click
  attributtionElement.addEventListener('click', (e) => {
    const infoDescription = document.createElement('div')
    infoDescription.id = 'infoDescription'
    state.isAttributionsOpen = true
    // const attribution = new Attribution({
    //   collapsible: false,
    //   target: infoDescription
    // })
    this.showInfo('Attributions', '')
    // map.addControl(attribution)
    infoContent.appendChild(infoDescription)
    // infoDescription.querySelector('button').parentNode.removeChild(infoDescription.querySelector('button'))
  })

  // Close info click
  closeInfoButton.addEventListener('click', (e) => {
    closeInfo()
  })

  // Mouse or touch interaction
  containerElement.addEventListener('pointerdown', (e) => {
    viewport.removeAttribute('keyboard-focus')
    // Address OpenLayers performance bug when viewport has focus?
    if (document.activeElement === viewport) {
      exitMapButtonElement.focus()
    }
  })

  // Disable pinch and double tap zoom
  containerElement.addEventListener('gesturestart', function (e) {
    e.preventDefault()
    document.body.style.zoom = 0.99 // Disable Safari zoom-to-tabs gesture
  })
  containerElement.addEventListener('gesturechange', function (e) {
    e.preventDefault()
    document.body.style.zoom = 0.99 // Disable Safari zoom-to-tabs gesture
  })
  containerElement.addEventListener('gestureend', function (e) {
    e.preventDefault()
    document.body.style.zoom = 0.99 // Disable Safari zoom-to-tabs gesture
  })

  window.addEventListener('keydown', manageTabRings)
  window.addEventListener('keydown', manageZoomPan)
  window.addEventListener('keyup', manageEscapeKeyPress)

  // Remove map on popsate change
  const popstate = (e) => {
    removeContainer()
  }
  window.addEventListener('popstate', popstate)

  // Address hiDpi margin/size issue? May be a better way to do this
  // map.canvasWidth = map.getCanvas().width
  // map.on('zoomstart', (e) => {
  //   const newWidth = map.getCanvas().width
  //   if (map.canvasWidth === newWidth) {
  //     map.resize()
  //     map.canvasWidth = newWidth
  //   }
  // })

  // Redraw map on browser zoom otherise it becomes pixelated
  // We need to refreh any vector layers as this appears the only way to redraw canvas
  // Doesnt work in Safari as devicePixelRatio doesn't change on browserZoom
  // let devicePixelRatio = window.devicePixelRatio
  const windowResize = (e) => {
    // const newPixelRatio = window.devicePixelRatio
    // if (newPixelRatio !== devicePixelRatio) {
    //   map.pixelRatio_ = window.devicePixelRatio
    //   const newPixelRatio = window.devicePixelRatio
    //   const layers = map.getLayers()
    //   layers.forEach((layer) => {
    //     if (layer instanceof Vector || layer instanceof VectorTile || layer instanceof VectorImage) {
    //       console.log('windowResize: ', layer.get('ref'))
    //       layer.setStyle(layer.getStyle())
    //     }
    //   })
    //   devicePixelRatio = newPixelRatio
    // }
  }
  window.addEventListener('resize', windowResize)

  // Rescale map on mobile browser zoom
  // iOS doesn't fire resize event on browser zoom
  let isMobileBrowserZoom = false
  const visualViewportResize = (e) => {
    if (window.visualViewport.scale !== 1 || isMobileBrowserZoom) {
      // map.updateSize()
      isMobileBrowserZoom = true
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', visualViewportResize)
  }
}
