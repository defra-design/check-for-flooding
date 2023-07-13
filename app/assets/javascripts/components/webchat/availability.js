'use strict'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (id, openChatCb) {
    const container = document.getElementById(id)

    // Event
    container.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-open-btn')) {
        openChatCb(e)
      }
    })

    this.container = container
  }

  update (state) {
    const container = this.container
    const isStart = !container.hasAttribute('data-wc-no-start')

    const hasFocus = document.activeElement.hasAttribute('data-wc-open-btn')

    container.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        isStart: isStart,
        view: state.view,
        unseen: state.unseen
      }
    })

    const link = container.querySelector('[data-wc-open-btn]')
    if (hasFocus && link) {
      link.focus()
    }
  }
}

export default Availability
