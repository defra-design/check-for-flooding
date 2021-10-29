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
  // Add on click
  document.addEventListener('click', (e) => {
    // Hide tooltip
    removeTooltip(document.querySelector('.defra-tooltip--open'))
    const tooltip = e.target.closest('.defra-tooltip')
    // Add tooltip
    if (tooltip) {
      e.preventDefault()
      const tool = tooltip.firstElementChild
      const content = tool.nextSibling
      const isXhr = tool.hasAttribute('href')

      if (isXhr) {
        // XMLHttpRequest
        const url = tool.href.split(/\?|#/)[0]
        xhr(url, (err, response) => {
          if (err) {
            console.log('Error: ' + err)
          } else {
            tooltip.classList.add('defra-tooltip--open')
            content.innerHTML = ''
            const fragmentId = tool.href.substring(tool.href.indexOf('#'))
            const fragment = response.querySelector(`${fragmentId}`)
            // Remove any hyperlinks
            fragment.querySelectorAll('a').forEach(link => {
              link.outerHTML = link.innerHTML
            })
            fragment.className = 'defra-tooltip__content'
            window.setTimeout(() => {
              content.appendChild(fragment)
            }, 100)
          }
        })
      } else {
        tooltip.classList.add('defra-tooltip--open')
      }
    }
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    const container = document.querySelector('.defra-tooltip--open')
    if (container && (e.key === 'Escape' || e.key === 'Esc')) {
      removeTooltip(container)
    }
  })
}

const removeTooltip = (tooltip) => {
  if (tooltip) {
    tooltip.classList.remove('defra-tooltip--open')
    const status = tooltip.querySelector('[role="status"]')
    if (status) { status.innerHTML = '' }
  }
}

window.flood.createTooltips = (tooltips) => {
  return Tooltips(tooltips)
}
