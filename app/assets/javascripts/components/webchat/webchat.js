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

    const state = new State(
      this._openChat.bind(this),
      this._closeChat.bind(this)
    )
    this.state = state

    this._init()

    const body = document.body
    if (body.classList.contains('wc-hidden')) {
      body.classList.remove('wc-hidden')
      body.classList.add('wc-body')
    }
  }

  async _authorise () {
    // New SDK instance
    const sdk = new ChatSdk({
      brandId: process.env.WEBCHAT_BRANDID, // Your tenant ID, found in the script on the "Initialization & Test" page for the chat channel.
      channelId: process.env.WEBCHAT_CHANNELID, // Your channel ID, found in the script on the "Initialization & Test" page for the chat channel.
      customerId: localStorage.getItem('CUSTOMER_ID') || '', // This must be generated on every page visit and should be unique to each contact.
      environment: EnvironmentName.EU1, // Your environment's region: AU1, CA1, EU1, JP1, NA1, UK1, or custom.
      isLivechat: true
    })

    // Event listeners
    sdk.onChatEvent(ChatEvent.CONSUMER_AUTHORIZED, this._handleAuthorisedEvent.bind(this))

    // Authorise
    const authResponse = await sdk.authorize()
    const customerId = authResponse?.consumerIdentity.idOnExternalPlatform
    localStorage.setItem('CUSTOMER_ID', customerId || '')
    this.customerId = customerId
    this.sdk = sdk

    // Conditionally get thread
    const state = this.state
    if (state.status === 'CHATTING') {
      await this._getThread()
      const thread = this.thread
      await thread.startChat().then(() => {
        console.log(thread)
      }).catch(err => {
        console.log(err)
      })
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

    console.log(JSON.stringify(model))

    document.body.insertAdjacentHTML('beforeend', env.render('webchat.html', { model }))
    const container = document.getElementById('wc')
    this.container = container

    const content = container.querySelector('[data-wc-content]')
    content.innerHTML = env.render('webchat-content.html', { model })

    Utils.listenForDevice('mobile', this._setAttributes.bind(this))

    // Event listeners
    container.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        state.back()
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        this._closeChat()
      }
      if (e.target.hasAttribute('data-wc-end-btn')) {
        this._endChat()
      }
    })
  }

  _updateContent () {
    const state = this.state

    // Update header

    // Update content
    const container = document.getElementById('wc')
    if (!container) {
      return
    }
    const content = container.querySelector('[data-wc-content]')
    content.innerHTML = env.render('webchat-content.html', {
      model: { status: state.status }
    })

    // Events
    const prechatBtn = content.querySelector('[data-wc-prechat-btn]')
    if (prechatBtn) {
      prechatBtn.addEventListener('click', e => {
        this._validatePrechat(this._startChat.bind(this))
      })
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

    await this._getThread()

    const thread = this.thread

    // Start chat
    thread.startChat(message)

    // await thread.startChat().then(() => {
    //   console.log('Start chat')
    // }).catch(err => {
    //   console.log(err)
    // })

    this._setAttributes()
  }

  async _recoverChat () {

  }

  async _endChat () {
    if (!this.thread) {
      return
    }

    console.log('End chat')

    const thread = this.thread

    console.log(thread)

    thread.endChat().then(() => {
      console.log('End chat')
    }).catch(err => {
      console.log(err)
    })
  }

  async _getMessages () {
    let recoveredData
    try {
      recoveredData = await this.thread.recover()
    } catch (error) {}
    if (recoveredData) {
      sessionStorage.setItem('MESSAGES', '')
      this.content.innerHTML = env.render('webchat-content.html', {
        model: { messages: recoveredData.messages.reverse() }
      })
      this.content.scrollTop = this.content.scrollHeight
    }
  }

  _sendMessage (value) {
    if (!(value && value.length)) return
    this.thread.sendTextMessage(value)
  }

  _addMessage (message) {
    const item = document.createElement('li')
    item.innerText = message.text
    item.className = `wc-list__item wc-list__item--${message.direction}`
    const list = this.content.querySelector('[data-wc-list]')
    list.appendChild(item)
    // Scroll content to bottom
    this.content.scrollTop = this.content.scrollHeight
  }

  //
  // Event handlers
  //

  async _handleAuthorisedEvent (e) {
    // Set availability
    const state = this.state

    let authStatus = e.detail.data.channel.availability.status
    authStatus = authStatus === 'online' ? 'ONLINE' : 'OFFLINE'
    state.status = state.status === 'UNAUTHORISED' ? authStatus : state.status

    // Availability control
    const availability = document.getElementById(this.id)
    availability.innerHTML = env.render('webchat-availability.html', {
      model: { status: state.status }
    })

    const btn = availability.querySelector('[data-wc-open-btn]')
    if (btn) {
      btn.addEventListener('click', this._openChat.bind(this))
    }

    this._updateContent()
  }

  _handleChatEvent (e) {
    console.log('Chat event: ', e)
  }

  _handleCaseCreatedEvent (e) {
    console.log('handleCaseCreatedEvent')
    console.log(e)

    const state = this.state
    state.status = 'CHATTING'
  }

  // This fires when both user and agent send a message
  _handleMessageCreatedEvent (e) {
    console.log('handleMessageCreatedEvent')
    console.log(e)

    const state = this.state
    state.status = 'CHATTING'

    // Add message to modal
    const message = {
      text: e.detail.data.message.messageContent.text,
      direction: e.detail.data.message.direction.toLowerCase()
    }
    // this._addMessage(message)
  }
}

export default WebChat
