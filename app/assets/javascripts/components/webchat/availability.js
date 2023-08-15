'use strict'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (id, openChatCb) {
    // Add skiplink *Move to template
    const skipLink = document.createElement('a')
    skipLink.id = 'wc-skip'
    skipLink.setAttribute('href', '#webchat')
    skipLink.className = 'govuk-skip-link'
    skipLink.setAttribute('data-module', 'govuk-skip-link')
    skipLink.setAttribute('data-wc-open-btn', '')
    skipLink.innerHTML = 'Skip to web chat'
    skipLink.style.display = 'none'
    const skipMain = document.querySelector('a[data-module="govuk-skip-link"]')
    skipMain.parentNode.insertBefore(skipLink, skipMain.nextSibling)
    this.skipLink = skipLink

    // Add start chat container
    const container = document.getElementById(id)
    container.innerHTML = env.render('webchat-availability.html')
    this.container = container

    const link = container.querySelector('[data-wc-link]')
    const linkText = container.querySelector('[data-wc-link-text]')
    const linkUnseen = container.querySelector('[data-wc-link-unseen]')
    const noLink = container.querySelector('[data-wc-no-link]')
    this.link = link
    this.linkText = linkText
    this.linkUnseen = linkUnseen
    this.noLink = noLink

    // Events
    document.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-open-btn')) {
        openChatCb(e, e.target.id)
      }
    })
    document.addEventListener('keydown', e => {
      if (e.key === ' ' && e.target.hasAttribute('data-wc-open-btn')) {
        e.preventDefault()
      }
    })
    document.addEventListener('keyup', e => {
      if (e.key === ' ' && e.target.hasAttribute('data-wc-open-btn')) {
        openChatCb(e, e.target.id)
      }
    })
  }

  update (state) {
    const container = this.container
    const isStart = !container.hasAttribute('data-wc-no-start')
    const isLink = (isStart && state.availability === 'AVAILABLE') || state.view == 'OPEN' || state.view == 'END'
    const isNoLink = !isLink && isStart

    // Update link availability
    this.link.toggleAttribute('hidden', !isLink)
    this.noLink.toggleAttribute('hidden', !isNoLink)

    // Update link text
    this.linkText.innerHTML = state.view === 'OPEN' || state.view === 'END' ? 'Show chat' : 'Start chat'
    this.linkUnseen.innerHTML = state.unseen > 0 ? `<span class="wc-open-btn__unseen">${state.unseen}</span> <span class="govuk-visually-hidden">new message${state.unseen > 1 ? 's' : ''}</span>` : ''

    // Conditionally reinstate focus after dom replacement
    const link = container.querySelector('[data-wc-open-btn]')
    const hasFocus = document.activeElement.hasAttribute('data-wc-open-btn')
    if (hasFocus && link) {
      link.focus()
    }
    
    // Toggle skip link
    const hasSkip = (state.view === 'OPEN' || state.view === 'END') && !state.isOpen
    if (hasSkip) {
      this.skipLink.removeAttribute('style')
    } else {
      this.skipLink.style.display = 'none'
    }
  }

  scroll (state) {
    const container = this.container
    const link = container.querySelector('[data-wc-link]')
    if (!link) {
      return
    }

    // Calculate offset
    const rect = container.getBoundingClientRect()
    const isBelowFold = rect.top + 35 > (window.innerHeight || document.documentElement.clientHeight)

    // Toggle static/sticky display
    const isHidden = (state.view === 'OPEN' || state.view === 'END') && !state.isOpen
    const isFixed = isHidden && isBelowFold
    document.documentElement.classList.toggle('wc-scroll-padding', isFixed)
    document.body.classList.toggle('wc-scroll-padding', isFixed)
    link.classList.toggle('wc-link--fixed', isFixed)
  }
}

export default Availability
