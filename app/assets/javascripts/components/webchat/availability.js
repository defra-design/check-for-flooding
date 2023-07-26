'use strict'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (id, openChatCb) {
    const container = document.getElementById(id)

    // Add skiplink
    const skipLink = document.createElement('a')
    skipLink.id = 'wc-skip'
    skipLink.setAttribute('href', '#webchat')
    skipLink.className = 'govuk-skip-link'
    skipLink.setAttribute('data-module', 'govuk-skip-link')
    skipLink.setAttribute('data-wc-open-btn', '')
    skipLink.innerHTML = 'Skip to webchat'
    skipLink.style.display = 'none'
    const skipMain = document.querySelector('a[data-module="govuk-skip-link"]')
    skipMain.parentNode.insertBefore(skipLink, skipMain.nextSibling)

    // Event
    document.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-open-btn')) {
        openChatCb(e, e.target.id)
      }
    })

    this.skipLink = skipLink
    this.container = container
  }

  update (state) {
    const container = this.container
    const isStart = !container.hasAttribute('data-wc-no-start')

    container.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        isStart: isStart,
        view: state.view,
        unseen: state.unseen
      }
    })

    // Conditionally reinstate focus
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
