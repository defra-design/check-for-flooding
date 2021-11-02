'use strict'

// Tooltip component

const { xhr } = window.flood.utils

// ie11 element.closest() polyfil
const Element = window.Element
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector
}
if (!Element.prototype.closest) {
  Element.prototype.closest = (s) => {
    let el = this
    do {
      if (Element.prototype.matches.call(el, s)) return el
      el = el.parentElement || el.parentNode
    } while (el !== null && el.nodeType === 1)
    return null
  }
}

const Tooltips = () => {
  // Add tooltip
  const addTooltip = (tool) => {
    removeTooltips()
    tool.parentNode.classList.add('defra-tooltip--open')
  }

  // Remove tooltip
  const removeTooltips = () => {
    const tooltips = document.querySelectorAll('.defra-tooltip--open')
    if (tooltips.length) {
      tooltips.forEach((tooltip) => {
        tooltip.classList.remove('defra-tooltip--open')
        // xhr tooltips
        const status = tooltip.querySelector('[role="status"]')
        if (status) { status.innerHTML = '' }
      })
    }
  }

  // Add on click (xhr tooltip only)
  document.addEventListener('click', (e) => {
    // Hide tooltip
    removeTooltips()
    const isTooltip = e.target.classList.contains('defra-tooltip__tool')
    if (isTooltip && e.target.tagName === 'a') {
      e.preventDefault()
      const tool = e.target
      const content = tool.nextSibling
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
    }
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
    if (isTooltip && e.target.firstElementChild !== 'a') {
      window.setTimeout(() => {
        addTooltip(e.target.firstElementChild)
      }, 100)
    }
  }, true)

  // Remove on mouse leave (basic tooltip only)
  document.addEventListener('mouseleave', (e) => {
    const isTooltip = e.target.classList.contains('defra-tooltip')
    if (isTooltip && e.target.firstElementChild !== 'a') {
      removeTooltips()
    }
  }, true)

  // Add on focus (basic tooltip only)
  document.addEventListener('focusin', (e) => {
    const isTool = e.target.classList.contains('defra-tooltip__tool')
    console.log(e.target)
    if (isTool && e.target.tagName !== 'a') {
      addTooltip(e.target)
    }
  })

  // Remove on blur (basic tooltip only)
  document.addEventListener('focusout', (e) => {
    const isTool = e.target.classList.contains('defra-tooltip__tool')
    if (isTool && e.target.tagName !== 'a') {
      removeTooltips()
    }
  })
}

window.flood.createTooltips = (tooltips) => {
  return Tooltips(tooltips)
}
