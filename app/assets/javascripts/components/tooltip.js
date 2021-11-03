'use strict'

// Tooltip component

const { xhr } = window.flood.utils

const Tooltips = () => {
  // Reference to outer element used for positioning
  const govukWidthContainerRect = document.querySelector('.govuk-width-container').getBoundingClientRect()

  // Add tooltip
  const addTooltip = (tool) => {
    // Open tooltip first so we can get dimensions
    tool.parentNode.classList.add('defra-tooltip--open')
    // Typically more text so width is fixed
    if (tool.tagName === 'A') {
      tool.parentNode.classList.add('defra-tooltip--fixed-width')
    }
    // Determin position of overlay
    const toolWidth = tool.getBoundingClientRect().width
    const tip = tool.nextElementSibling
    const tipWidth = tip.getBoundingClientRect().width
    const tipOffsetX = (tipWidth - toolWidth) / 2 - (((tipWidth - toolWidth) / 2) * 2)
    tip.style.marginLeft = `${tipOffsetX}px`
    // console.log(`${tipOffsetX}px`)
    // console.log(govukWidthContainerRect.left, 'Tool:', Math.round(toolRect.left), toolRect.width, 'Tip:', Math.round(tipRect.left), Math.round(tipRect.width))
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
