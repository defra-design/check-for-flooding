'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    const isAuthorised = false
    const hasThread = !!localStorage.getItem('THREAD_ID')
    const hasAudio = !localStorage.getItem('AUDIO_OFF')
    const isBack = sessionStorage.getItem('IS_BACK') === 'true'
    const isOpen = window.location.hash === '#webchat'

    // Public properties
    this.availability = null
    this.assignee = null
    this.view = hasThread ? 'OPEN' : 'PRECHAT'
    this.unseen = 0
    this.isAuthorised = isAuthorised
    this.hasThread = hasThread
    this.hasAudio = hasAudio
    this.isMobile = true
    this.isBack = isBack
    this.isOpen = isOpen
    this.messages = []

    // Private methods (callbacks)
    this._openChat = openChat
    this._closeChat = closeChat

    // Help with browser back behaviour
    if (history.length <= 1) {
      this._isBack = false
      sessionStorage.removeItem('IS_BACK')
    }

    // We need to toggle some attributes depending on screen size
    Utils.listenForDevice('mobile', (isMobile) => { this.isMobile = isMobile})

    // Events
    window.addEventListener('popstate', this._popstate.bind(this))
  }

  _popstate (e) {
    if (window.location.hash === '#webchat') {
      this._openChat(e)
    } else {
      this._closeChat(e)
    }
  }

  replaceState () {
    this.isOpen = false
    const url = window.location.href.split('#')[0]
    history.replaceState(null, null, url)
  }

  pushState () {
    this._isOpen = true
    this._isBack = true
    const url = `${window.location.href.split('#')[0]}#webchat`
    history.pushState({ view: 'webchat', isBack: true }, '', url)
    sessionStorage.setItem('IS_BACK', true)
  }

  back () {
    const offsetY = window.scrollY
    history.back()
    if (!this._isMobile) {
      window.addEventListener('scroll', e => {
        window.scrollTo(0, offsetY)
      }, { once: true })
    }
  }
}

export default State
