'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    this._isMobile = true
    this._isAvailable = sessionStorage.getItem('IS_ONLINE') === 'true'
    this._isBack = sessionStorage.getItem('IS_BACK') === 'true'
    this._status = localStorage.getItem('THREAD_ID') ? 'STARTED' : 'PRECHAT'
    this._isOpen = window.location.hash === '#webchat' || this.status === 'STARTED'
    this._openChat = openChat
    this._closeChat = closeChat

    console.log(this._isOpen, window.location.hash)

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
    if (e.state && e.state.path === '#webchat') {
      this._openChat(e)
    } else {
      this._closeChat(e)
    }
  }

  pushView () {
    this._isOpen = true
    this._isBack = true
    window.history.pushState({ path: '#webchat', isBack: true }, '', '#webchat')
    sessionStorage.setItem('IS_BACK', true)
  }

  removeView () {
    this.isOpen = false
    const url = window.location.href.substring(0, window.location.href.indexOf('#webchat'))
    window.history.replaceState({ path: null, isBack: false }, '', url)
  }

  back () {
    history.back()
  }

  set isAvailable (isAvailable) {
    this._isAvailable = isAvailable
  }

  get isAvailable () {
    return this._isAvailable
  }

  get isOpen () {
    return this._isOpen
  }

  set isOpen (isOpen) {
    this._isOpen = isOpen
  }

  get status () {
    return this._status
  }

  set status (status) {
    this._status = status
  }

  get isMobile () {
    return this._isMobile
  }

  get isBack () {
    return this._isBack
  }
}

export default State
