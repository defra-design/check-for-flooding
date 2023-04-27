'use strict'

import { ChatSdk, EnvironmentName, Thread, LivechatThread, ChatEvent, ChatEventData } from '@nice-devone/nice-cxone-chat-web-sdk'
import Keyboard from './keyboard'
import State from './state'
import Availability from './availability'
import Utils from './utils'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor () {
    const state = new State(
      this._openChat.bind(this),
      this._closeChat.bind(this)
    )
    this.state = state

    this._init()

    const body = document.body
    if (body.classList.contains('webchat-hidden')) {
      body.classList.remove('webchat-hidden')
      body.classList.add('webchat-body')
    }
  }

  async _init () {
    // Conditionally dialog
    const state = this.state

    if (state.isOpen) {
      this._createDialog()
    }

    // New SDK instance
    this.sdk = new ChatSdk({
      brandId: process.env.WEBCHAT_BRANDID, // Your tenant ID, found in the script on the "Initialization & Test" page for the chat channel.
      channelId: process.env.WEBCHAT_CHANNELID, // Your channel ID, found in the script on the "Initialization & Test" page for the chat channel.
      customerId: localStorage.getItem('CUSTOMER_ID') || '', // This must be generated on every page visit and should be unique to each contact.
      environment: EnvironmentName.EU1, // Your environment's region: AU1, CA1, EU1, JP1, NA1, UK1, or custom.
      isLivechat: true
    })

    // Authorise
    await this.sdk.authorize().then(response => {
      const customerId = response?.consumerIdentity.idOnExternalPlatform
      localStorage.setItem('CUSTOMER_ID', customerId || '')
      this.customerId = customerId

      // Add availability
      const isAvailable = response?.channel.availability.status === 'online'
      const availability = new Availability(isAvailable, this._openChat.bind(this))
      state.isAvailable = isAvailable

      // Start chat if we already have a thread
      if (state.isOpen) {
        this._addContent()
      }

      if (state.status === 'STARTED') {
        this._startChat()
      }
    }).catch(err => {
      console.log(err)
    })
  }

  _createDialog () {
    const state = this.state

    const model = {
      isBack: state.isBack
    }

    document.body.insertAdjacentHTML('beforeend', env.render('webchat.html', { model }))
    const container = document.getElementById('webchat')
    this.container = container

    Utils.listenForDevice('mobile', this._setAttributes.bind(this))

    container.addEventListener('click', e => {
      if (e.target.hasAttribute('data-webchat-back-btn')) {
        state.back()
      }
      if (e.target.hasAttribute('data-webchat-close-btn')) {
        this._endChat()
      }
    })
  }

  _addContent () {
    const state = this.state
    const container = this.container
    const loading = container.querySelector('[data-webchat-loading]')
    loading.remove()

    const model = {
      status: state.status,
      isAvailable: state.isAvailable
    }

    const target = container.querySelector('[data-webchat-inner]')
    target.insertAdjacentHTML('beforeend', env.render('webchat-content.html', { model }))
  }

  _setAttributes () {
    const container = this.container
    if (!container) {
      return
    }

    const state = this.state
    const isFullscreen = state.isMobile && state.isOpen
    const root = document.getElementsByTagName('html')[0]
    root.classList.toggle('webchat-html', isFullscreen)
    const body = document.body
    body.classList.toggle('webchat-body', isFullscreen)
    const closeBtn = container.querySelector('[data-webchat-back-btn], [data-webchat-close-btn]')
    closeBtn.toggleAttribute('data-webchat-back-btn', state.status === 'PRECHAT')
    closeBtn.toggleAttribute('data-webchat-close-btn', state.status === 'STARTED')
  }

  _toggleDialog (isVisible) {
    this.container.classList.toggle('webchat--visible', isVisible)
  }

  _openChat (e) {
    const state = this.state
    state.isOpen = true

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    if (isBtn) {
      state.pushView()
    }

    this._createDialog()

    if (localStorage.getItem('CUSTOMER_ID')) {
      this._addContent()
    }
  }

  _closeChat (e) {
    const state = this.state
    state.isOpen = false

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

  async _startChat () {
    let threadId = localStorage.getItem('THREAD_ID')
    if (!threadId) {
      threadId = Math.floor(Math.random() * 1000).toString()
      localStorage.setItem('THREAD_ID', threadId)
    }
    const thread = this.sdk.getThread(threadId)

    thread.onThreadEvent(ChatEvent.THREAD_METADATA_LOADED, e => {
      console.log('Thread metadata loaded')
      console.log(e)
    })

    // thread.onThreadEvent(ChatEvent.MESSAGE_CREATED, this._messageCreatedEvent)

    // if (!thread._isInitialized) { /* is there a public property to detemine this? */
    await thread.startChat().then(() => {
      console.log('Start chat')
      const state = this.state
      state.status = 'STARTED'
      thread.onThreadEvent(ChatEvent.MESSAGE_CREATED, e => {
        console.log('Message created')
        console.log(e)
      })
    }).catch(err => {
      console.log(err)
    })
    // }

    this.thread = thread

    this._setAttributes()
  }

  async _endChat (e) {
    if (!this.thread) {
      return
    }

    console.log('End chat')

    const thread = this.thread

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
    item.className = `webchat-list__item webchat-list__item--${message.direction}`
    const list = this.content.querySelector('[data-message-list]')
    list.appendChild(item)
    // Scroll content to bottom
    this.content.scrollTop = this.content.scrollHeight
  }

  //
  // Events
  //

  // This fires when both user and agent send a message
  _messageCreatedEvent (e) {
    // Add message to modal
    const message = {
      text: e.detail.data.message.messageContent.text,
      direction: e.detail.data.message.direction.toLowerCase()
    }
    console.log(e)
    // this._addMessage(message)
  }
}

export default WebChat
