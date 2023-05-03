'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    this._status = 'UNAUTHORISED'
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
    window.addEventListener('popstate', this._popstate.bind(this))
    window.addEventListener('hashchange', this._hashchange.bind(this))
  }

  _setMobile (isMobile) {
    this._isMobile = isMobile
  }

  _popstate (e) {
    if (e.state && e.state.fragment === '#webchat') {
      this._openChat(e)
    } else {
      this._closeChat(e)
    }
  }

  _hashchange (e) {
    const newHash = e.newURL.split('#')[1]
    const isSamePage = e.oldURL === e.newURL.split('#')[0]

    if (newHash === 'webchat' && isSamePage) {
      // this.replaceView(true)
      this._openChat(e)
    } else {
      // this.replaceView(false)
      this._closeChat(e)
    }
  }

  // replaceView (isBack) {
  //   this._view = isBack ? 'OPEN' : 'CLOSED'
  //   this._isBack = isBack
  //   window.history.replaceState({ fragment: '#webchat', isBack: isBack }, '')
  //   sessionStorage.setItem('IS_BACK', true)
  // }

  pushView () {
    this._view = 'OPEN'
    this._isBack = true
    window.history.pushState({ fragment: '#webchat', isBack: true }, '', '#webchat')
    sessionStorage.setItem('IS_BACK', true)
  }

  removeView () {
    this.view = 'CLOSED'
    const url = window.location.href.substring(0, window.location.href.indexOf('#webchat'))
    window.history.replaceState({ fragment: null, isBack: false }, '', url)
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
