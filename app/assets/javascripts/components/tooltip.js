'use strict'
// Tooltip component

const { xhr } = window.flood.utils

const Tooltip = (tooltip) => {
  const link = tooltip.firstElementChild
  const url = link.href.split(/\?|#/)[0]
  const container = tooltip.querySelector('.defra-tooltip__status')
  // Show text
  link.addEventListener('click', (e) => {
    e.preventDefault()
    link.focus()
    // XMLHttpRequest
    xhr(url, (err, response) => {
      if (err) {
        console.log('Error: ' + err)
      } else {
        tooltip.classList.add('defra-tooltip--open')
        container.innerHTML = ''
        const fragmentId = link.href.substring(link.href.indexOf('#'))
        const fragment = response.querySelector(`${fragmentId}`)
        // Remove any hyperlinks
        fragment.querySelectorAll('a').forEach(link => {
          link.outerHTML = link.innerHTML
        })
        fragment.className = 'defra-tooltip__container'
        window.setTimeout(() => {
          container.appendChild(fragment)
        }, 100)
      }
    })
  })
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (e.target !== container) {
      tooltip.classList.remove('defra-tooltip--open')
      container.innerHTML = ''
    }
  })
  // Key presses
  tooltip.addEventListener('keyup', (e) => {
    // Close on escape
    if ((e.keyCode || e.which) === 27) {
      tooltip.classList.remove('defra-tooltip--open')
      container.innerHTML = ''
    }
  })
  // Remove on blur
  link.addEventListener('blur', (e) => {
    tooltip.classList.remove('defra-tooltip--open')
    container.innerHTML = ''
  })
}

window.flood.createTooltip = (tooltip) => {
  return Tooltip(tooltip)
}
