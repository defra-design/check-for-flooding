'use strict'

// Toggletip component

const { forEach } = window.flood.utils

const toggletips = () => {
  // Add tooltip
  const openToggletip = (toggletip) => {
    // Update reference
    currentToggletip = toggletip
    // Outer margin
    const viewportMargin = 15
    // Determin position of overlay
    const info = toggletip.querySelector('.defra-toggletip__info')
    const text = info.querySelector('.defra-toggletip__text')
    const arrow = info.querySelector('.defra-toggletip__arrow')
    text.innerHTML = ''
    // Timeout recommend to ensure aria-live region is re-read
    window.setTimeout(() => {
      closeToggletips()
      text.innerHTML = toggletip.getAttribute('data-toggletip-content')
      toggletip.classList.add('defra-toggletip--open')
      const toggletipLeft = toggletip.getBoundingClientRect().left
      const toggletipWidth = toggletip.getBoundingClientRect().width
      const viewportWidth = window.innerWidth
      let infoWidth = info.getBoundingClientRect().width
      infoWidth = infoWidth > (viewportWidth - (viewportMargin * 2)) ? viewportWidth - (viewportMargin * 2) : infoWidth
      // Centre tip
      let infoOffsetX = ((infoWidth - toggletipWidth) / 2) - (((infoWidth - toggletipWidth) / 2) * 2)
      // Correct offset if near sides
      if ((toggletipLeft + infoOffsetX) < viewportMargin) {
        // Left side
        infoOffsetX = viewportMargin - toggletipLeft
      } else if ((toggletipLeft + infoWidth + infoOffsetX) > (viewportWidth - viewportMargin)) {
        // Right side
        infoOffsetX = (viewportWidth - viewportMargin - toggletipLeft) - infoWidth
      }
      arrow.style.left = `${Math.round((toggletipWidth / 2) - infoOffsetX)}px`
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
    toggletip.setAttribute('tabindex', 0)
    const info = document.createElement('span')
    info.className = 'defra-toggletip__info'
    info.setAttribute('role', 'status')
    info.innerHTML = '<span class="defra-toggletip__text"></span><span class="defra-toggletip__arrow"></span>'
    toggletip.appendChild(info)
  })

  // Add on click
  document.addEventListener('click', (e) => {
    const isToggletip = e.target.classList && e.target.classList.contains('defra-toggletip')
    isToggletip ? openToggletip(e.target) : closeToggletips()
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeToggletips()
    }
  })

  // Add on mouse enter
  document.addEventListener('mouseover', (e) => {
    if (e.target.classList && e.target.classList.contains('defra-toggletip')) {
      closeToggletips()
      openToggletip(e.target)
    }
  })

  // Remove on mouse leave
  document.addEventListener('mouseleave', (e) => {
    console.log(e.target.classList)
    if (e.target.classList && e.target.classList.contains('defra-toggletip')) {
      closeToggletips()
    }
  }, true)

  // Add on focus
  document.addEventListener('focusin', (e) => {
    if (e.target.classList && e.target.classList.contains('defra-toggletip')) {
      closeToggletips()
      openToggletip(e.target)
    }
  })

  // Remove on blur
  document.addEventListener('focusout', (e) => {
    if (e.target.classList && e.target.classList.contains('defra-toggletip')) {
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

window.flood.createToggletips = () => {
  return toggletips()
}
