'use strict'

import Utils from './utils'

const env = window.nunjucks.configure('views')

class Availability {
  constructor (isAvailable, openChat) {
    const target = document.getElementById('webchat-availability')
    target.innerHTML = env.render('webchat-availability.html', {
      model: { isAvailable: isAvailable }
    })

    const button = target.querySelector('[data-webchat-open-btn]')
    if (button) {
      button.addEventListener('click', openChat)
    }
  }

  // const element = target.querySelector('[data-am-map-btn]')

  // let uri = `${window.location.pathname}${window.location.search}`
  // uri = Utils.addOrUpdateParameter(uri, 'v', options.id)
  // element.setAttribute('href', uri)

  // this.element = element

  // // Events
  // element.addEventListener('click', callback)
}

export default Availability
