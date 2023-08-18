'use strict'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (id, openChatCb) {
    // Set availability container
    const container = document.getElementById(id)
    this.container = container

    // Add live element
    container.insertAdjacentHTML('beforebegin', `
      <div class="wc-live" aria-live="polite" data-wc-live></div>
    `)
    this.live = container.previousElementSibling

    // Events
    document.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-open-btn')) {
        console.log('click', e.target.id)
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
    console.log('availability.update()')

    const container = this.container
    const isStart = !container.hasAttribute('data-wc-no-start')
    const isAvailable = (isStart && state.availability === 'AVAILABLE') || state.view == 'OPEN' || state.view == 'END'
    const btnText = state.view === 'OPEN' || state.view === 'END' ? 'Show chat' : 'Start chat'

    // Update container
    container.innerHTML = env.render('webchat-availability.html', {
      model: {
        isAvailable: isAvailable,
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
    
    // Alert assistive technology
    if (state.unseen > 0) {
      const text = `${state.unseen} new message${state.unseen > 1 ? 's' : ''}`
      this.alertAT(text)
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

  alertAT (text) {
    const el = this.live
    el.innerHTML = `<p>${text}</p>`
    setTimeout(() => { el.innerHTML = '' }, 1000)
  }
}

export default Availability
