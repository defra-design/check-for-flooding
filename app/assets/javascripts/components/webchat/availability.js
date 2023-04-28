'use strict'

import Utils from './utils'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (isAvailable, openChat) {
    const target = document.getElementById('webchat-availability')
    const model = {
      isAvailable: isAvailable
    }
    target.innerHTML = env.render('webchat-availability.html', { model })

    const button = target.querySelector('[data-webchat-open-btn]')
    if (button) {
      button.addEventListener('click', openChat)
    }
  }
}

export default Availability
