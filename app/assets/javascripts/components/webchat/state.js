'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    this._availability = null // ONLINE | OFFLINE
    this._status = localStorage.getItem('THREAD_ID') ? 'OPEN' : 'PRECHAT'
    this._isMobile = true
    this._isBack = sessionStorage.getItem('IS_BACK') === 'true'
    this._isOpen = window.location.hash === '#webchat'
    this._openChat = openChat
    this._closeChat = closeChat

    if (history.length <= 1) {
      this._isBack = false
      sessionStorage.removeItem('IS_BACK')
    }

    Utils.listenForDevice('mobile', this._setMobile.bind(this))

    // Events
    window.addEventListener('popstate', this._popstate.bind(this))
  }

  _setMobile (isMobile) {
    this._isMobile = isMobile
  }

  _popstate (e) {
    console.log(e)
    console.log(e.state)
    console.log(window.location.hash === '#webchat')
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

  pushState (view) {
    this._isOpen = true
    this._isBack = true
    const url = `${window.location.href.split('#')[0]}#webchat`
    history.pushState({ view: view, isBack: true }, '', url)
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

  get availability () {
    return this._availability
  }

  set availability (availability) {
    this._availability = availability
  }

  get status () {
    return this._status
  }

  set status (status) {
    this._status = status
  }

  get isOpen () {
    return this._isOpen
  }

  set isOpen (isOpen) {
    this._isOpen = isOpen
  }

  get isMobile () {
    return this._isMobile
  }

  get isBack () {
    return this._isBack
  }
}

export default State
