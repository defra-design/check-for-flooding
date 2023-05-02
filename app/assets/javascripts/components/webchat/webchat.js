'use strict'

import { ChatSdk, EnvironmentName, Thread, LivechatThread, ChatEvent, ChatEventData } from '@nice-devone/nice-cxone-chat-web-sdk'
import Keyboard from './keyboard'
import State from './state'
import Availability from './availability'
import Utils from './utils'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor (id) {
    this.id = id
    this.messages = []

    const state = new State(
      this._openChat.bind(this),
      this._closeChat.bind(this)
    )
    this.state = state

    // Custom events
    this.livechatAuthReady = new CustomEvent('livechatAuthReady', {})
    document.addEventListener('livechatAuthReady', this._handleAuthoriseEvent.bind(this))

    this._init()

    const body = document.body
    if (body.classList.contains('wc-hidden')) {
      body.classList.remove('wc-hidden')
      body.classList.add('wc-body')
    }
  }

  async _init () {
    const state = this.state

    this._createAvailability()

    if (state.view === 'OPEN' || state.view === 'MIN') {
      this._createDialog()
    }

    this._authorise()
  }

  async _authorise () {
    // New SDK instance
    const sdk = new ChatSdk({
      brandId: process.env.WEBCHAT_BRANDID, // Your tenant ID, found in the script on the "Initialization & Test" page for the chat channel.
      channelId: process.env.WEBCHAT_CHANNELID, // Your channel ID, found in the script on the "Initialization & Test" page for the chat channel.
      customerId: localStorage.getItem('CUSTOMER_ID') || '', // This must be generated on every page visit and should be unique to each contact.
      environment: EnvironmentName.EU1 // Your environment's region: AU1, CA1, EU1, JP1, NA1, UK1, or custom.
    })

    // Event listeners
    sdk.onChatEvent(ChatEvent.LIVECHAT_RECOVERED, this._handleLivechatRecoveredEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CASE_STATUS_CHANGED, this._handleCaseStatusChangedEvent.bind(this))

    this.sdk = sdk

    // Authorise
    const response = await sdk.authorize()

    // Set customerId
    const customerId = response?.consumerIdentity.idOnExternalPlatform
    localStorage.setItem('CUSTOMER_ID', customerId || '')
    this.customerId = customerId

    // Set status
    const state = this.state
    const isOnline = response?.channel.availability.status === 'online'
    let status = isOnline ? 'ONLINE' : 'OFFLINE'
    if (isOnline && localStorage.getItem('THREAD_ID')) {
      status = 'OPEN'
    }
    state.status = status

    // Conditionally get thread
    if (status === 'OPEN') {
      await this._getThread()
      await this.thread.recover()
    }

    // Auth ready
    document.dispatchEvent(this.livechatAuthReady)
  }

  async _getThread () {
    const sdk = this.sdk

    // Get thread
    let threadId = localStorage.getItem('THREAD_ID')
    if (!threadId) {
      threadId = Math.floor(Math.random() * 1000).toString()
      localStorage.setItem('THREAD_ID', threadId)
    }
    const thread = await sdk.getThread(threadId)
    this.thread = thread

    // Add event listeners
    thread.onThreadEvent(ChatEvent.CASE_CREATED, this._handleCaseCreatedEvent.bind(this))
    thread.onThreadEvent(ChatEvent.MESSAGE_CREATED, this._handleMessageCreatedEvent.bind(this))
  }

  _createAvailability () {
    const state = this.state

    // Availability control
    const availability = document.getElementById(this.id)
    availability.innerHTML = env.render('webchat-availability.html', {
      model: { status: state.status }
    })
  }

  _createDialog () {
    const state = this.state

    const model = {
      status: state.status,
      view: state.view,
      isBack: state.isBack
    }

    document.body.insertAdjacentHTML('beforeend', env.render('webchat.html', { model }))
    const container = document.getElementById('wc')
    this.container = container

    const content = container.querySelector('[data-wc-inner]')
    content.innerHTML = env.render('webchat-content.html', { model })

    Utils.listenForDevice('mobile', this._setAttributes.bind(this))

    // Event listeners
    container.addEventListener('click', async e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        state.back()
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        this._closeChat()
      }
      if (e.target.hasAttribute('data-wc-end-btn')) {
        await this._endChat()
      }
    })
  }

  _updateDialog () {
    const state = this.state

    // Update header

    // Update content
    const container = document.getElementById('wc')
    if (!container) {
      return
    }
    const content = container.querySelector('[data-wc-inner]')

    content.innerHTML = env.render('webchat-content.html', {
      model: {
        status: state.status,
        messages: this.messages
      }
    })

    // Events
    const prechatBtn = content.querySelector('[data-wc-prechat-btn]')
    if (prechatBtn) {
      prechatBtn.addEventListener('click', e => {
        this._validatePrechat(this._startChat.bind(this))
      })
    }

    const sendBtn = content.querySelector('[data-wc-send-btn]')
    if (sendBtn) {
      sendBtn.addEventListener('click', this._sendMessage.bind(this))
    }
  }

  _validatePrechat (successCb) {
    const userName = document.getElementById('name').value
    const message = document.getElementById('message').value

    if (!(userName.length && message.length)) {
      // Validation error
      console.log('Enter a name and/or message')
      return
    }

    successCb(userName, message)
  }

  _setAttributes () {
    const container = this.container
    if (!container) {
      return
    }

    const state = this.state
    const isFullscreen = state.isMobile && state.view === 'OPEN'
    const root = document.getElementsByTagName('html')[0]
    root.classList.toggle('wc-html', isFullscreen)
    const body = document.body
    body.classList.toggle('wc-body', isFullscreen)
  }

  _toggleDialog (isVisible) {
    this.container.classList.toggle('wc--visible', isVisible)
  }

  _openChat (e) {
    const state = this.state
    state.view = 'OPEN'

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent

    if (!this.container) {
      this._createDialog()

      if (isBtn) {
        state.pushView()
      }
    }
  }

  _closeChat (e) {
    const state = this.state
    state.view = 'CLOSED'

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    const container = this.container
    if (isBtn && state.isBack) {
      state.back()
      return
    }
    if (container) {
      this._setAttributes()
      this.container = container.remove()
    }
    if (isBtn && container) {
      state.removeView()
    }
  }

  async _startChat (userName, message) {
    const sdk = this.sdk

    // Set userName
    sdk.getCustomer().setName(userName)

    // Start chat
    await this._getThread()
    this.thread.startChat(message)

    this._setAttributes()
  }

  async _recoverChat () {

  }

  _endChat () {
    const thread = this.thread
    thread.endChat()
  }

  _sendMessage (e) {
    const thread = this.thread
    const value = document.getElementById('message').value
    if (!(value && value.length)) {
      return
    }
    thread.sendTextMessage(value)
  }

  //
  // Event handlers
  //

  _handleAuthoriseEvent (e) {
    console.log('_handleAuthoriseEvent')

    const state = this.state

    // Availability control
    const availability = document.getElementById(this.id)
    availability.innerHTML = env.render('webchat-availability.html', {
      model: { status: state.status }
    })

    const btn = availability.querySelector('[data-wc-open-btn]')
    if (btn) {
      btn.addEventListener('click', this._openChat.bind(this))
    }

    this._updateDialog()
  }

  _handleCaseStatusChangedEvent (e) {
    const state = this.state
    const isClosed = e.detail.data.case.status === 'closed'

    if (isClosed) {
      state.status = 'CLOSED'
      localStorage.removeItem('THREAD_ID')
      this._updateDialog()
    }
  }

  _handleLivechatRecoveredEvent (e) {
    console.log('_handleLivechatRecoveredEvent')
    console.log(e)
    const messages = e.detail.data.messages
    for (let i = 0; i < messages.length; i++) {
      this.messages.push({
        text: messages[i].messageContent.text,
        direction: messages[i].direction
      })
    }
    this.messages.reverse()

    this._updateDialog()
  }

  _handleCaseCreatedEvent (e) {
    const state = this.state
    state.status = 'OPEN'
  }

  _handleMessageCreatedEvent (e) {
    const state = this.state
    state.status = 'OPEN'

    // Add message
    const message = {
      text: e.detail.data.message.messageContent.text,
      direction: e.detail.data.message.direction.toLowerCase()
    }
    const messages = this.messages
    messages.push(message)

    this._updateDialog()
  }

  _handleChatEvent (e) {
    console.log('Chat event: ', e)
  }
}

export default WebChat
