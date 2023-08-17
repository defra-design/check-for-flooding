'use strict'

import Utils from './utils'

class State {
  constructor (openChat, closeChat) {
    const isAuthorised = false
    const hasThread = !!localStorage.getItem('THREAD_ID')
    const hasAudio = !localStorage.getItem('AUDIO_OFF')
    const isBack = sessionStorage.getItem('IS_BACK') === 'true'
    const isOpen = window.location.hash === '#webchat'

    this._availability = null
    this._assignee = null
    this._view = hasThread ? 'OPEN' : 'PRECHAT'
    this._unseen = 0
    this._isAuthorised = isAuthorised
    this._hasThread = hasThread
    this._hasAudio = hasAudio
    this._isMobile = true
    this._isBack = isBack
    this._isOpen = isOpen
    this._openChat = openChat
    this._closeChat = closeChat
    this._messages = []

    // Help with browser back behaviour
    if (history.length <= 1) {
      this._isBack = false
      sessionStorage.removeItem('IS_BACK')
    }

    // We need to toggle some attributes depending on screen size
    Utils.listenForDevice('mobile', this._setMobile.bind(this))

    // Events
    window.addEventListener('popstate', this._popstate.bind(this))
  }

  _setMobile (isMobile) {
    this._isMobile = isMobile
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

  get availability () {
    return this._availability
  }

  set availability (availability) {
    this._availability = availability
  }

  get assignee () {
    return this._assignee
  }

  set assignee (assignee) {
    this._assignee = assignee
  }

  get unseen () {
    return this._unseen
  }

  set unseen (unseen) {
    this._unseen = unseen
  }

  get view () {
    return this._view
  }

  set view (view) {
    this._view = view
  }

  get isAuthorised () {
    return this._isAuthorised
  }

  set isAuthorised (isAuthorised) {
    this._isAuthorised = isAuthorised
  }

  get hasThread () {
    return this._hasThread
  }

  set hasThread (hasThread) {
    this._hasThread = hasThread
  }

  get hasAudio () {
    return this._hasAudio
  }

  set hasAudio (hasAudio) {
    this._hasAudio = hasAudio
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

  get messages () {
    return this._messages
  }

  set messages (messages) {
    this._messages = messages
  }
}

export default State
