'use strict'

// Toggletip component

const { forEach } = window.flood.utils

const toggletips = (options) => {
  // Defaults
  const defaults = { type: 'default' }
  options = Object.assign({}, defaults, options)

  // Add tooltip
  const openToggletip = (toggletip) => {
    // Outer margin
    const viewportMargin = 15
    // Determin position of overlay
    const info = toggletip.querySelector('.defra-toggletip__info')
    const text = info.querySelector('.defra-toggletip__text')
    const arrow = info.querySelector('.defra-toggletip__arrow')
    text.innerHTML = ''
    // Timeout recommended to ensure aria-live region is re-read
    window.setTimeout(() => {
      // Update reference
      closeToggletips()
      currentToggletip = toggletip
      text.innerHTML = toggletip.getAttribute('data-toggletip-content')
      toggletip.classList.add('defra-toggletip--open')
      const tooltipWidth = toggletip.getBoundingClientRect().width
      const target = toggletip.querySelector('button') || toggletip
      const targetLeft = target.getBoundingClientRect().left
      const targetWidth = target.getBoundingClientRect().width
      const targetOffsetLeft = toggletip.querySelector('button') ? tooltipWidth - targetWidth : 0
      const viewportWidth = window.innerWidth
      let infoWidth = info.getBoundingClientRect().width
      // Limit info width when zoomed
      infoWidth = infoWidth > (viewportWidth - (viewportMargin * 2)) ? viewportWidth - (viewportMargin * 2) : infoWidth
      const infoOffsetCentre = (infoWidth - targetWidth) / 2
      // Centre tip
      let infoOffsetX = targetOffsetLeft - infoOffsetCentre
      // Correct offset if near sides
      if (((targetLeft - targetOffsetLeft) + infoOffsetX) < viewportMargin) {
        // Left side
        infoOffsetX = viewportMargin - (targetLeft - targetOffsetLeft)
      } else if ((targetLeft - infoOffsetX + infoOffsetCentre) > (viewportWidth - viewportMargin)) {
        // Right side
        infoOffsetX = targetOffsetLeft - (targetLeft - (viewportWidth - viewportMargin - infoWidth))
      }
      arrow.style.left = `${Math.round(targetOffsetLeft + ((targetWidth / 2) - infoOffsetX))}px`
      info.style.marginLeft = `${infoOffsetX}px`
      // Overide width so it doesn't truncate at zoom levels
      info.style.width = `${infoWidth}px`
      // Switch position if near top
      if (info.getBoundingClientRect().top < viewportMargin) {
        toggletip.classList.add('defra-toggletip--bottom')
      }
    }, 100)
  }

  // Remove tooltip
  const closeToggletips = () => {
    // Update reference
    currentToggletip = null
    const toggletips = document.querySelectorAll('.defra-toggletip--open')
    if (toggletips.length) {
      forEach(toggletips, toggletip => {
        toggletip.classList.remove('defra-toggletip--open')
        toggletip.classList.remove('defra-toggletip--bottom')
        toggletip.classList.remove('defra-toggletip--keyboard-focus')
        const info = toggletip.querySelector('.defra-toggletip__info')
        info.style.removeProperty('width')
        info.style.removeProperty('margin-left')
        const text = info.querySelector('span:first-child')
        text.innerHTML = ''
        const arrow = info.querySelector('.defra-toggletip__arrow')
        arrow.style.removeProperty('left')
      })
    }
  }

  // Reference to current button
  let currentToggletip

  // Create toggletips
  const toggletips = document.querySelectorAll('[data-toggletip]')
  forEach(toggletips, (toggletip) => {
    toggletip.classList.add('defra-toggletip')
    if (['i', '?'].includes(options.type)) {
      const button = document.createElement('button')
      button.className = 'defra-toggletip__button'
      button.setAttribute('aria-label', 'More information')
      button.innerHTML = `<span>${options.type}</span>`
      toggletip.appendChild(button)
    } else {
      toggletip.classList.add('defra-toggletip--no-button')
      toggletip.setAttribute('tabindex', 0)
    }
    const info = document.createElement('span')
    info.className = 'defra-toggletip__info'
    info.setAttribute('role', 'status')
    info.innerHTML = '<span class="defra-toggletip__text"></span><span class="defra-toggletip__arrow"></span>'
    toggletip.appendChild(info)
  })

  // Add on click
  document.addEventListener('click', (e) => {
    const toggletip = e.target.closest('.defra-toggletip')
    if (toggletip) {
      openToggletip(toggletip)
    } else {
      closeToggletips()
    }
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeToggletips()
    }
  })

  // Add on mouse enter
  document.addEventListener('mouseenter', (e) => {
    const isToggletip = !!e.target.closest('.defra-toggletip--no-button') ||
      !!e.target.classList.contains('defra-toggletip__button')
    if (isToggletip && !currentToggletip) {
      const toggletip = e.target.closest('.defra-toggletip')
      openToggletip(toggletip)
    }
  }, true)

  // Remove on mouse leave
  document.addEventListener('mouseleave', (e) => {
    const toggletip = e.target.classList.contains('defra-toggletip')
    if (toggletip) {
      closeToggletips()
    }
  }, true)

  // Add on focus
  document.addEventListener('focusin', (e) => {
    const toggletip = e.target.closest('.defra-toggletip')
    if (toggletip) {
      closeToggletips()
      openToggletip(toggletip)
    }
  })

  // Remove on blur
  document.addEventListener('focusout', (e) => {
    const toggletip = e.target.closest('.defra-toggletip')
    if (toggletip) {
      closeToggletips()
    }
  })

  // Page zoom
  window.addEventListener('resize', (e) => {
    if (currentToggletip) {
      openToggletip(currentToggletip)
    }
  })
}

window.flood.createToggletips = (options) => {
  return toggletips(options)
}
