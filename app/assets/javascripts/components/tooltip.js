'use strict'

// Tooltip component

const { xhr } = window.flood.utils

const Tooltips = () => {
  // Add tooltip
  const addTooltip = (tool) => {
    // Position tooltip left or right
    const viewportWidth = window.innerWidth
    const toolRect = tool.getBoundingClientRect()
    const isRight = toolRect.left < (viewportWidth / 2)
    tool.parentNode.classList.add('defra-tooltip--open')
    // Tool too close to left for default display
    if (isRight) {
      tool.parentNode.classList.add('defra-tooltip--right')
    }
    // Typically more text so width is fixed
    if (tool.tagName === 'A') {
      tool.parentNode.classList.add('defra-tooltip--fixed-width')
    }
  }

  // Remove tooltip
  const removeTooltips = () => {
    const tooltips = document.querySelectorAll('.defra-tooltip--open')
    if (tooltips.length) {
      tooltips.forEach((tooltip) => {
        tooltip.classList.remove('defra-tooltip--open')
        tooltip.classList.remove('defra-tooltip--right')
        // xhr tooltips
        const status = tooltip.querySelector('[role="status"]')
        if (status) { status.innerHTML = '' }
      })
    }
  }

  // Add on click (xhr tooltip only)
  document.addEventListener('click', (e) => {
    // Hide tooltip
    if (!(e.target.classList.contains('defra-tooltip__tool') && e.target.tagName === 'A')) {
      return
    }
    e.preventDefault()
    const tool = e.target
    const content = tool.nextElementSibling
    const url = tool.href.split(/\?|#/)[0]
    // XMLHttpRequest
    xhr(url, (err, response) => {
      if (err) {
        console.log('Error: ' + err)
      } else {
        content.innerHTML = ''
        const fragmentId = tool.href.substring(tool.href.indexOf('#'))
        const fragment = response.querySelector(`${fragmentId}`)
        // Remove any hyperlinks
        fragment.querySelectorAll('a').forEach(link => {
          link.outerHTML = link.innerHTML
        })
        content.appendChild(fragment)
        addTooltip(tool)
      }
    })
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      removeTooltips()
    }
  })

  // Add on mouse enter (basic tooltip only)
  document.addEventListener('mouseenter', (e) => {
    const isTooltip = e.target.classList.contains('defra-tooltip')
    if (isTooltip && e.target.firstElementChild.tagName !== 'A') {
      removeTooltips()
      addTooltip(e.target.firstElementChild)
    }
  }, true)

  // Remove on mouse leave (basic tooltip only)
  document.addEventListener('mouseleave', (e) => {
    const isTooltip = e.target.classList.contains('defra-tooltip')
    if (isTooltip && e.target.firstElementChild.tagName !== 'A') {
      removeTooltips()
    }
  }, true)

  // Add on focus (basic tooltip only)
  document.addEventListener('focusin', (e) => {
    const isTool = e.target.classList.contains('defra-tooltip__tool')
    if (isTool && e.target.tagName !== 'A') {
      removeTooltips()
      addTooltip(e.target)
    }
  })

  // Remove on blur (basic and xhr tooltips)
  document.addEventListener('focusout', (e) => {
    const isTool = e.target.classList.contains('defra-tooltip__tool')
    if (isTool) {
      removeTooltips()
    }
  })
}

window.flood.createTooltips = (tooltips) => {
  return Tooltips(tooltips)
}
