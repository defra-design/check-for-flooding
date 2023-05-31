'use strict'

import { ChatSdk, EnvironmentName, ChatEvent, LivechatThread } from '@nice-devone/nice-cxone-chat-web-sdk'
import Keyboard from './keyboard'
import State from './state'
import Utils from './utils'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor (id) {

    if (!Utils.isClientSupported()) {
      console.log('Browser not supported')
      return
    }
  
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

    if (state.isOpen) {
      this._createPanel()
    }

    this._authorise()
  }

  async _authorise () {
    // New SDK instance
    const sdk = new ChatSdk({
      brandId: process.env.CXONE_BRANDID, // Your tenant ID, found in the script on the "Initialization & Test" page for the chat channel.
      channelId: process.env.CXONE_CHANNELID, // Your channel ID, found in the script on the "Initialization & Test" page for the chat channel.
      customerId: localStorage.getItem('CUSTOMER_ID') || '', // This must be generated on every page visit and should be unique to each contact.
      environment: EnvironmentName.EU1 // Your environment's region: AU1, CA1, EU1, JP1, NA1, UK1, or custom.
    })

    // Event listeners
    sdk.onChatEvent(ChatEvent.CONSUMER_AUTHORIZED, this._handleConsumerAuthorizedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.LIVECHAT_RECOVERED, this._handleLivechatRecoveredEvent.bind(this))
    sdk.onChatEvent(ChatEvent.MORE_MESSAGES_LOADED, this._handleMoreMessagesLoadedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CASE_STATUS_CHANGED, this._handleCaseStatusChangedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ASSIGNED_AGENT_CHANGED, this._handleAssignedAgentChangedEvent.bind(this))

    sdk.onChatEvent(ChatEvent.ROUTING_QUEUE_CREATED, this._handleRoutingQueueCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ROUTING_QUEUE_UPDATED, this._handleRoutingQueueUpdatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.USER_ASSIGNED_TO_ROUTING_QUEUE, this._handleUserAssignedToRoutingQueue.bind(this))
    sdk.onChatEvent(ChatEvent.USER_UNASSIGNED_FROM_ROUTING_QUEUE, this._handleUserUnassignedFromRoutingQueue.bind(this))
    sdk.onChatEvent(ChatEvent.SET_POSITION_IN_QUEUE, this._handleSetPositionInQueueEvent.bind(this))

    this.sdk = sdk

    console.log(sdk.getCustomer())

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

    // Recover thread
    if (isOnline && localStorage.getItem('THREAD_ID')) {
      try { // Address issue with no thread but we still have the session id
        await this._getThread()
        await this.thread.recover()
        state.view = 'OPEN'
      } catch (err) {
        console.log(err)
        localStorage.removeItem('THREAD_ID')
        state.view = 'PRECHAT'
      }
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
    thread.onThreadEvent(ChatEvent.AGENT_TYPING_STARTED, this._handleAgentTypingEvent.bind(this))
    thread.onThreadEvent(ChatEvent.AGENT_TYPING_ENDED, this._handleAgentTypingEvent.bind(this))
    thread.onThreadEvent(ChatEvent.AGENT_CONTACT_ENDED, this._handleAgentContactEndedEvent.bind(this))
  }

  _setAvailability () {
    const state = this.state

    const availability = document.getElementById(this.id)
    availability.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        view: state.view
      }
    })
    this.availability = availability

    this._handleScroll()
  }

  _createPanel () {
    console.log('_createPanel')

    const state = this.state

    const model = {
      availability: state.availability,
      view: state.view,
      isBack: state.isBack,
      isMobile: state.isMobile
    }

    const container = document.createElement('div')
    container.id = 'wc-panel'
    container.setAttribute('class', `wc${state.isOpen ? ' wc--open' : ''}`)
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
      if (e.target.hasAttribute('data-wc-continue-btn')) {
        this._continue(e)
      }
      if (e.target.hasAttribute('data-wc-back-prechat')) {
        e.preventDefault()
        this._prechat(e)
      }
      if (e.target.hasAttribute('data-wc-submit-btn')) {
        this._validatePrechat(this._startChat.bind(this))
      }
      if (e.target.hasAttribute('data-wc-send-btn')) {
        this._sendMessage()
      }
    })
  }

  _updateChat () {
    console.log('_updateChat: ', this.messages.length)
    const state = this.state

    // Update content
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }
    const content = container.querySelector('[data-wc-inner]')

    content.innerHTML = env.render('webchat-panel.html', {
      model: {
        availability: state.availability,
        view: state.view,
        isOpen: state.isOpen,
        isBack: state.isBack,
        isMobile: state.isMobile,
        messages: this.messages,
        assignee: this.assignee,
        queue: this.queue
      }
    })

    // Scroll messages
    const body = container.querySelector('[data-wc-body]')
    if (body) {
      body.scrollTop = body.scrollHeight
    }

    // Textarea events
    const textarea = container.querySelector('[data-wc-message]')
    if (textarea) {
      // Autosize
      textarea.addEventListener('keyup', e => Utils.autosize(e.target, 120))
      // User start stop typing
      textarea.addEventListener('keydown', () => {
        this.thread.keystroke(1000)
        setTimeout(() => {
          this.thread.stopTyping()
        }, 1000)
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
    const isFullscreen = state.isMobile && state.isOpen
    const root = document.getElementsByTagName('html')[0]
    root.classList.toggle('wc-html', isFullscreen)
    const body = document.body
    body.classList.toggle('wc-body', isFullscreen)
    container.setAttribute('aria-modal', isFullscreen)
  }

  _openChat (e) {
    const state = this.state
    state.isOpen = true

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    if (isBtn) {
      e.preventDefault()
      state.pushState('PRECHAT')
    }

    if (!this.container) {
      this._createPanel()
      this._updateChat()
    }

    this._handleScroll()
  }

  _closeChat (e) {
    const state = this.state
    state.isOpen = false

    const availability = this.availability
    const start = availability.querySelector('[data-wc-start]')
    if (start) {
      start.classList.remove('wc-start--disabled')
    }

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent

    if (isBtn && state.isBack) {
      state.back()
    } else if (this.container) {
      this._setAttributes()
      this.container = this.container.remove()
      state.replaceState()
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

  _prechat () {
    const state = this.state
    state.view = 'PRECHAT'
    console.log('_prechat')
    this._updateChat()
  }

  _continue () {
    const state = this.state
    state.view = 'START'
    console.log('_continue')
    this._updateChat()
  }

  _endChat () {
    const state = this.state
    state.view = 'END'
    console.log('_endChat')
    this._updateChat()
  }

  _resumeChat (e) {
    e.preventDefault()
    const state = this.state
    state.view = 'OPEN'
    console.log('_resumeChat')
    this._updateChat()
  }

  _confirmEndChat () {
    const state = this.state
    const thread = this.thread
    console.log('View: ', state.view, ' Status: ', state.status)
    thread.endChat()
  }

  _mergeMessages (messages) {
    const batch = []
    for (let i = 0; i < messages.length; i++) {
      batch.push({
        text: Utils.parseMessage(messages[i].messageContent.text),
        assignee: messages[i].authorUser ? messages[i].authorUser.firstName : null,
        date: Utils.formatDate(new Date(messages[i].createdAt)),
        direction: messages[i].direction
      })
    }
    batch.reverse()
    this.messages = batch.concat(this.messages)
  }

  _sendMessage (e) {
    const thread = this.thread
    const value = document.getElementById('message').value
    if (!(value && value.length)) {
      return
    }
    try {
      thread.sendTextMessage(value)
    } catch (err) {
      console.log(thread instanceof LivechatThread)
      console.log(err)
    }
  }

  //
  // Event handlers
  //

  _handleConsumerAuthorizedEvent (e) {
    console.log('_handleConsumerAuthorizedEvent')
    console.log(e)
  }

  _handleAuthoriseEvent (e) {
    console.log('_handleAuthoriseEvent')
    console.log(e)
    const state = this.state

    // Availability control
    const availability = this.availability
    availability.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        view: state.view
      }
    })

    this._handleScroll()
    console.log('Calling _updateChat')
    // this._updateChat()
  }

  _handleCaseStatusChangedEvent (e) {
    console.log('_handleCaseStatusChangedEvent')
    console.log(e)
    const state = this.state
    const status = e.detail.data.case.status
    const isClosed = status === 'closed'

    if (isClosed) {
      state.view = 'CLOSED'
      localStorage.removeItem('THREAD_ID')
      this.messages = []
      this._updateChat()
      state.view = 'PRECHAT'
    }
  }

  _handleAgentContactEndedEvent (e) {
    console.log('_handleAgentContactEndedEvent')
    console.log(e)
  }

  _handleAssignedAgentChangedEvent (e) {
    console.log('_handleAssignedAgentChangedEvent')
    console.log(e)
    const assignee = e.detail.data.inboxAssignee
    this.assignee = assignee ? assignee.firstName : null
    this._updateChat()
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
    console.log('_handleSetPositionInQueueEvent')
    console.log(e)
    const queue = e.detail.data.positionInQueue
    this.queue = queue || null
    this._updateChat()
  }

  async _handleLivechatRecoveredEvent (e) {
    console.log('_handleLivechatRecoveredEvent')
    console.log(e)
    const assignee = e.detail.data.inboxAssignee
    this.assignee = assignee ? assignee.firstName : null

    const state = this.state
    const status = e.detail.data.consumerContact.status
    state.status = status
 
    // Merge messages
    const messages = e.detail.data.messages
    this._mergeMessages(messages)

    // Recursively merge previous messages
    let response = []
    while (response) {
      response = await this.thread.loadMoreMessages()
      console.log('loading more messages')
    }

    console.log('all loaded')
    // Update html
    this._updateChat()
  }

  _handleMoreMessagesLoadedEvent (e) {
    console.log('_handleMoreMessagesLoadedEvent')
    console.log(e)

    const messages = e.detail.data.messages

    if (messages.length) {
      this._mergeMessages(messages)
    }
  }

  _handleCaseCreatedEvent (e) {
    console.log('_handleCaseCreatedEvent')
    console.log(e)
    const state = this.state
    state.view = 'OPEN'
  }

  _handleMessageCreatedEvent (e) {
    const state = this.state
    state.view = 'OPEN'

    const response = e.detail.data.message

    // Add message
    const message = {
      text: Utils.parseMessage(response.messageContent.text),
      assignee: response.authorUser ? response.authorUser.firstName : null,
      date: Utils.formatDate(new Date(response.createdAt)),
      direction: response.direction.toLowerCase()
    }
    const messages = this.messages
    messages.push(message)

    this._updateChat()
  }

  _handleAgentTypingEvent (e) {
    console.log('_handleAgentTypingStartedEvent')
    console.log(e)

    const isTyping = e.type === 'AgentTypingStarted'
    const agentName = e.data.user.firstName
    const list = document.querySelector('[data-wc-message-list]')

    if (!list) {
      return
    }

    const el = list.querySelector('[data-wc-agent-typing]')
    
    if (isTyping) {
      list.insertAdjacentHTML('beforeend', `
        <li class="wc-list__item wc-list__item--outbound" data-wc-agent-typing>
          <span class="wc-list__item-meta">${agentName} is typing</span>
          <div class="wc-list__item-inner">
            <svg width="28" height="16" x="0px" y="0px" viewBox="0 0 28 16">
              <circle stroke="none" cx="3" cy="8" r="3" fill="currentColor">
                <animate attributeName="cy" dur="1s" values="12;4;12" repeatCount="indefinite" begin="0.1"/>
              </circle>
              <circle stroke="none" cx="14" cy="8" r="3" fill="currentColor">
                <animate attributeName="cy" dur="1s" values="12;4;12" repeatCount="indefinite" begin="0.3"/>
              </circle>
              <circle stroke="none" cx="25" cy="8" r="3" fill="currentColor">
                <animate attributeName="cy" dur="1s" values="12;4;12" repeatCount="indefinite" begin="0.5"/>
              </circle>
            </svg>
          </div>
        </li>
      `)
    } else if (el) {
      el.remove()
    }
  }

  _handleScroll (e) {
    const state = this.state
    const availability = this.availability
    const start = availability.querySelector('[data-wc-start]')

    if (!start) {
      return
    }

    const rect = availability.getBoundingClientRect()
    const isBelowFold = rect.top + 35 > (window.innerHeight || document.documentElement.clientHeight)

    start.classList.toggle('wc-start--fixed', (state.view === 'OPEN' || state.view === 'END') && !state.isOpen && isBelowFold)
  }

  _handleChatEvent (e) {
    console.log('Chat event: ', e)
  }
}

export default WebChat
