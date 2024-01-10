'use strict'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (id, openChatCb) {
    // Set availability container
    const container = document.getElementById(id)
    this.container = container

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
    const isText = !container.hasAttribute('data-wc-no-text')
    const hasThread = state.threadId
    const isLink = hasThread || (isText && state.availability === 'AVAILABLE')
    const btnText = hasThread ? 'Show chat' : 'Start chat'

    // Update container
    container.innerHTML = env.render('webchat-availability.html', {
      model: {
        isText: isText,
        isLink: isLink,
        availability: state.availability,
        btnText: btnText,
        unseen: state.unseen
      }
    })

    // Conditionally reinstate focus after dom replacement
    const link = container.querySelector('[data-wc-open-btn]')
    const hasFocus = document.activeElement.hasAttribute('data-wc-open-btn')
    if (hasFocus && link) {
      link.focus()
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
    link.classList.toggle('wc-availability--fixed', isFixed)
  }
}

export default Availability
