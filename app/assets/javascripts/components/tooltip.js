'use strict'

// Tooltip component
const Tooltips = () => {
  const tooltips = document.querySelectorAll('[data-tooltip]')

  tooltips.forEach(tooltip => {
    let timeout

    // Add on mouse enter (basic tooltip only)
    tooltip.addEventListener('mouseenter', () => {
      timeout = setTimeout(() => {
        tooltip.classList.add('defra-tooltip--visible')
      }, 500)
    })

    // Remove on mouse leave (basic tooltip only)
    tooltip.addEventListener('mouseleave', () => {
      clearTimeout(timeout)
      tooltip.classList.remove('defra-tooltip--visible')
    })

    // Remove on escape
    document.addEventListener('keyup', e => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        clearTimeout(timeout)
        tooltip.classList.remove('defra-tooltip--visible')
      }
    })

    // Add on focus (basic tooltip only)
    tooltip.addEventListener('focusin', (e) => {
      timeout = setTimeout(() => {
        tooltip.classList.add('defra-tooltip--visible')
      }, 500)
    })

    // Remove on blur (basic and xhr tooltips)
    tooltip.addEventListener('focusout', (e) => {
      clearTimeout(timeout)
      tooltip.classList.remove('defra-tooltip--visible')
    })
  })
}

window.flood.createTooltips = (options) => {
  return Tooltips(options)
}
