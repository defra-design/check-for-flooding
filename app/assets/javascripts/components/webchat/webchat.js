'use strict'

import { ChatSdk, EnvironmentName, Thread, LivechatThread, ChatEvent, ChatEventData } from '@nice-devone/nice-cxone-chat-web-sdk'
import Keyboard from './keyboard'
import State from './state'
import Utils from './utils'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor (id) {
    this.id = id
    this.queue = null
    this.assignee = null
    this.messages = []

    const state = new State(
      this._openChat.bind(this),
      this._closeChat.bind(this)
    )
    this.state = state

    Keyboard.init(state)

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

    this._setAvailability()

    // Event listeners
    const availability = this.availability
    availability.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-open-btn')) {
        this._openChat(e)
      }
    })
    document.addEventListener('scroll', this._handleScroll.bind(this))

    if (state.view === 'OPEN') {
      this._createPanel()
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
    sdk.onChatEvent(ChatEvent.CONSUMER_AUTHORIZED, this._handleConsumerAuthorizedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.LIVECHAT_RECOVERED, this._handleLivechatRecoveredEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CASE_STATUS_CHANGED, this._handleCaseStatusChangedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ASSIGNED_AGENT_CHANGED, this._handleAssignedAgentChangedEvent.bind(this))

    sdk.onChatEvent(ChatEvent.ROUTING_QUEUE_CREATED, this._handleRoutingQueueCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ROUTING_QUEUE_UPDATED, this._handleRoutingQueueUpdatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.USER_ASSIGNED_TO_ROUTING_QUEUE, this._handleUserAssignedToRoutingQueue.bind(this))
    sdk.onChatEvent(ChatEvent.USER_UNASSIGNED_FROM_ROUTING_QUEUE, this._handleUserUnassignedFromRoutingQueue.bind(this))
    sdk.onChatEvent(ChatEvent.SET_POSITION_IN_QUEUE, this._handleSetPositionInQueueEvent.bind(this))

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
    state.availability = isOnline ? 'ONLINE' : 'OFFLINE'
    if (isOnline && localStorage.getItem('THREAD_ID')) {
      state.status = 'OPEN'
    }

    // Conditionally get thread
    if (state.status === 'OPEN') {
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

  _setAvailability () {
    const state = this.state

    const availability = document.getElementById(this.id)
    availability.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        status: state.status
      }
    })
    this.availability = availability

    this._handleScroll()
  }

  _createPanel () {
    const state = this.state

    const model = {
      availability: state.availability,
      status: state.status,
      view: state.view,
      isBack: state.isBack,
      isMobile: state.isMobile
    }

    const container = document.createElement('div')
    container.id = 'wc-panel'
    container.setAttribute('class', `wc wc--${state.view.toLowerCase()}`)
    container.setAttribute('aria-label', 'webchat')
    container.setAttribute('aria-modal', false)
    container.setAttribute('role', 'dialog')
    container.setAttribute('open', '')
    container.setAttribute('data-wc', '')
    container.innerHTML = '<div class="wc__inner" tabindex="-1" data-wc-inner></div>'
    document.body.appendChild(container)
    this.container = container

    const content = container.querySelector('[data-wc-inner]')
    content.innerHTML = env.render('webchat-panel.html', { model })

    Utils.listenForDevice('mobile', this._setAttributes.bind(this))

    // Event listeners
    container.addEventListener('click', async e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        // state.back()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-end-btn')) {
        this._endChat()
      }
      if (e.target.hasAttribute('data-wc-resume-btn')) {
        this._resumeChat(e)
      }
      if (e.target.hasAttribute('data-wc-confirm-end-btn')) {
        await this._confirmEndChat()
      }
      if (e.target.hasAttribute('data-wc-prechat-btn')) {
        this._validatePrechat(this._startChat.bind(this))
      }
      if (e.target.hasAttribute('data-wc-send-btn')) {
        this._sendMessage()
      }
    })
  }

  _updatePanel () {
    const state = this.state

    // Update header

    // Update content
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }
    const content = container.querySelector('[data-wc-inner]')

    content.innerHTML = env.render('webchat-panel.html', {
      model: {
        availability: state.availability,
        status: state.status,
        view: state.view,
        isBack: state.isBack,
        isMobile: state.isMobile,
        messages: this.messages,
        assignee: this.assignee,
        queue: this.queue
      }
    })
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
    container.setAttribute('aria-modal', isFullscreen)
  }

  _openChat (e) {
    if (e.type !== 'hashchange') {
      return
    }

    const availability = this.availability
    const start = availability.querySelector('[data-wc-start]')
    if (start) {
      start.classList.add('wc-start--disabled')
    }

    if (!this.container) {
      this._createPanel()
      this._updatePanel()
    }
  }

  _closeChat (e) {
    const state = this.state

    const availability = this.availability
    const start = availability.querySelector('[data-wc-start]')
    if (start) {
      start.classList.remove('wc-start--disabled')
    }

    if (state.isBack) {
      state.back()
    } else if (this.container) {
      this._setAttributes()
      this.container = this.container.remove()
      state.replaceView()
      this._handleScroll(e)
    }

    this._setAvailability()
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

  _endChat () {
    const state = this.state
    state.status = 'END'
    console.log('_endChat')
    this._updatePanel()
  }

  _resumeChat (e) {
    e.preventDefault()
    const state = this.state
    state.status = 'OPEN'
    console.log('_resumeChat')
    this._updatePanel()
  }

  _confirmEndChat () {
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

  _handleConsumerAuthorizedEvent (e) {
    console.log('_handleConsumerAuthorizedEvent')
    console.log(e)
  }

  _handleAuthoriseEvent (e) {
    const state = this.state

    // Availability control
    const availability = this.availability
    availability.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        status: state.status
      }
    })

    this._handleScroll()
    this._updatePanel()
  }

  _handleCaseStatusChangedEvent (e) {
    const state = this.state
    const isClosed = e.detail.data.case.status === 'closed'

    if (isClosed) {
      state.status = 'CLOSED'
      localStorage.removeItem('THREAD_ID')
      this.messages = []
      this._updatePanel()
      state.status = 'NEW'
    }
  }

  _handleAssignedAgentChangedEvent (e) {
    const assignee = e.detail.data.inboxAssignee
    this.assignee = assignee ? assignee.firstName : null
    this._updatePanel()
  }

  _handleRoutingQueueCreatedEvent (e) {
    console.log('_handleRoutingQueueCreatedEvent')
    console.log(e)
  }

  _handleRoutingQueueUpdatedEvent (e) {
    console.log('_handleRoutingQueueUpdatedEvent')
    console.log(e)
  }

  _handleUserAssignedToRoutingQueue (e) {
    console.log('_handleUserAssignedToRoutingQueue')
    console.log(e)
  }

  _handleUserUnassignedFromRoutingQueue (e) {
    console.log('_handleUserUnassignedFromRoutingQueue')
    console.log(e)
  }

  _handleSetPositionInQueueEvent (e) {
    const queue = e.detail.data.positionInQueue
    this.queue = queue || null
    this._updatePanel()
  }

  _handleLivechatRecoveredEvent (e) {
    const assignee = e.detail.data.inboxAssignee
    this.assignee = assignee ? assignee.firstName : null

    const messages = e.detail.data.messages

    for (let i = 0; i < messages.length; i++) {
      this.messages.push({
        text: messages[i].messageContent.text,
        assignee: messages[i].authorUser ? messages[i].authorUser.firstName : null,
        date: Utils.formatDate(new Date(messages[i].createdAt)),
        direction: messages[i].direction
      })
    }
    this.messages.reverse()

    this._updatePanel()
  }

  _handleCaseCreatedEvent (e) {
    console.log('_handleCaseCreatedEvent')
    console.log(e)
    const state = this.state
    state.status = 'OPEN'
  }

  _handleMessageCreatedEvent (e) {
    const state = this.state
    state.status = 'OPEN'

    const response = e.detail.data.message

    // Add message
    const message = {
      text: response.messageContent.text,
      assignee: response.authorUser ? response.authorUser.firstName : null,
      date: Utils.formatDate(new Date(response.createdAt)),
      direction: response.direction.toLowerCase()
    }
    const messages = this.messages
    messages.push(message)

    this._updatePanel()
  }

  _handleScroll (e) {
    const state = this.state
    const availability = this.availability
    const start = availability.querySelector('[data-wc-start]')

    if (!start) {
      return
    }

    const rect = availability.getBoundingClientRect()
    const isBelowFold = rect.top + 61 > (window.innerHeight || document.documentElement.clientHeight)

    start.classList.toggle('wc-start--fixed', state.status === 'OPEN' && state.view === 'CLOSED' && isBelowFold)
  }

  _handleChatEvent (e) {
    console.log('Chat event: ', e)
  }
}

export default WebChat
