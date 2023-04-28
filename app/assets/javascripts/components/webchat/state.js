'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    this._status = localStorage.getItem('THREAD_ID') ? 'CHATTING' : 'UNAUTHORISED'
    this._isMobile = true
    this._isBack = sessionStorage.getItem('IS_BACK') === 'true'
    this._view = window.location.hash === '#webchat' ? 'OPEN' : this._status === 'CHATTING' ? 'MIN' : 'CLOSED'
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
    if (e.state && e.state.path === '#webchat') {
      this._openChat(e)
    } else {
      this._closeChat(e)
    }
  }

  pushView () {
    this._view = 'OPEN'
    this._isBack = true
    window.history.pushState({ path: '#webchat', isBack: true }, '', '#webchat')
    sessionStorage.setItem('IS_BACK', true)
  }

  removeView () {
    this.view = this.status === 'CHATTING' ? 'MIN' : 'CLOSED'
    const url = window.location.href.substring(0, window.location.href.indexOf('#webchat'))
    window.history.replaceState({ path: null, isBack: false }, '', url)
  }

  back () {
    history.back()
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
