'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    this._availability = null // ONLINE | OFFLINE
    this._status = localStorage.getItem('THREAD_ID') ? 'OPEN' : 'PRECHAT'
    this._isMobile = true
    this._isBack = sessionStorage.getItem('IS_BACK') === 'true'
    this._view = window.location.hash === '#webchat' ? 'OPEN' : 'CLOSED'
    this._openChat = openChat
    this._closeChat = closeChat

    if (history.length <= 1) {
      this._isBack = false
      sessionStorage.removeItem('IS_BACK')
    }

    Utils.listenForDevice('mobile', this._setMobile.bind(this))

    // Events
    window.addEventListener('hashchange', this._hashchange.bind(this))
  }

  _setMobile (isMobile) {
    this._isMobile = isMobile
  }

  _hashchange (e) {
    e.preventDefault()

    const newHash = e.newURL.split('#')[1]
    const isSamePage = e.oldURL === e.newURL.split('#')[0]

    if (newHash === 'webchat' && isSamePage) {
      this._view = 'OPEN'
      this._isBack = true
      sessionStorage.setItem('IS_BACK', true)
      this.offsetY = window.scrollY
      this._openChat(e)
    } else {
      this._view = 'CLOSED'
      this._isBack = false
      sessionStorage.setItem('IS_BACK', false)
      this._closeChat(e)
    }
  }

  replaceView () {
    this._view = 'CLOSED'
    const url = window.location.href.split('#')[0]
    window.history.replaceState(null, null, url)
    if (this._isMobile) {
      window.scrollTo(0, this.offsetY)
    }
  }

  back () {
    const offsetY = window.scrollY
    history.back()
    if (this._isMobile) {
      window.scrollTo(0, this.offsetY)
    } else {
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

  get view () {
    return this._view
  }

  set view (view) {
    this._view = view
  }

  get isMobile () {
    return this._isMobile
  }

  get isBack () {
    return this._isBack
  }
}

export default State
