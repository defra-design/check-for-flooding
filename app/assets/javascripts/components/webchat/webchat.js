'use strict'

import { ChatSdk, EnvironmentName, ChatEvent, LivechatThread } from '@nice-devone/nice-cxone-chat-web-sdk'
import { Button, CharacterCount } from 'govuk-frontend'
import Keyboard from './keyboard'
import State from './state'
import Utils from './utils'
import Config from './config'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor (id) {  
    this.id = id
    this.assignee = null
    this.unseen = 0
    this.messages = []

    // Update meta viewport
    // const metaViewport = document.querySelector('meta[name="viewport"]')
    // metaViewport.content += ', interactive-widget=resizes-content'

    // Instantiate state
    const state = new State(
      this._openChat.bind(this),
      this._closeChat.bind(this)
    )
    this.state = state

    // Initialise keyboard interface
    Keyboard.init(state)

    // Custom events
    this.livechatReady = new CustomEvent('livechatReady', {})
    document.addEventListener('livechatReady', this._handleReadyEvent.bind(this))

    this._init()

    const body = document.body
    if (body.classList.contains('wc-hidden')) {
      body.classList.remove('wc-hidden')
      body.classList.add('wc-body')
    }
  }

  async _init () {
    // Event listeners
    const availability = document.getElementById(this.id)
    availability.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-open-btn')) {
        this._openChat(e)
      }
    })
    document.addEventListener('scroll', this._handleScrollEvent.bind(this))

    // Set initial availability
    this.availability = availability    
    this._updateAvailability()

    // Open panel if fragment exists
    const isOpen = this.state.isOpen
    if (isOpen) {
      this._createPanel()
    }

    // Authorise user
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
    sdk.onChatEvent(ChatEvent.CASE_STATUS_CHANGED, this._handleCaseStatusChangedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ASSIGNED_AGENT_CHANGED, this._handleAssignedAgentChangedEvent.bind(this))

    sdk.onChatEvent(ChatEvent.ROUTING_QUEUE_CREATED, this._handleRoutingQueueCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ROUTING_QUEUE_UPDATED, this._handleRoutingQueueUpdatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.USER_ASSIGNED_TO_ROUTING_QUEUE, this._handleUserAssignedToRoutingQueueEvent.bind(this))
    sdk.onChatEvent(ChatEvent.USER_UNASSIGNED_FROM_ROUTING_QUEUE, this._handleUserUnassignedFromRoutingQueueEvent.bind(this))
    // sdk.onChatEvent(ChatEvent.SET_POSITION_IN_QUEUE, this._handleSetPositionInQueueEvent.bind(this))
    sdk.onChatEvent(ChatEvent.MESSAGE_SEEN_BY_END_USER, this._handleMessageSeenByEndUserEvent.bind(this))

    this.sdk = sdk

    // Authorise
    const response = await sdk.authorize()

    // Set customerId
    const customerId = response?.consumerIdentity.idOnExternalPlatform
    localStorage.setItem('CUSTOMER_ID', customerId || '')
    this.customerId = customerId

    // Set availability
    const state = this.state
    const isOnline = response?.channel.availability.status === 'online'
    const availability = await fetch('/service/webchat/availability')
    const isAvailable = await availability.json()
    state.availability = isOnline ? isAvailable ? 'AVAILABLE' : 'BUSY' : 'OFFLINE'

    // Recover thread
    if (localStorage.getItem('THREAD_ID')) {
      try { // Address issue with no thread but we still have the session id
        await this._getThread()
        await this.thread.recover()
        state.view = 'OPEN'
        return
      } catch (err) {
        console.log(err)
        localStorage.removeItem('THREAD_ID')
        state.view = 'PRECHAT'
      }
    }

    // Auth ready
    document.dispatchEvent(this.livechatReady)  
  }

  async _getThread () {
    const sdk = this.sdk

    // Get thread
    let threadId = localStorage.getItem('THREAD_ID')
    if (!threadId) {
      threadId = Utils.generateThreadId()
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

  async _startChat (userName, message) {
    const sdk = this.sdk

    // Set userName
    sdk.getCustomer().setName(userName)

    console.log('_startChat')

    // Start chat
    await this._getThread()

    console.log(this.thread instanceof LivechatThread)

    try {
      this.thread.startChat(message)
    } catch (err) {
      console.log()
    }

    this._setAttributes()
  }

  _updateAvailability () {
    const state = this.state
    const availability = this.availability
    const isStart = !availability.hasAttribute('data-wc-no-start')

    availability.innerHTML = env.render('webchat-availability.html', {
      model: {
        availability: state.availability,
        isStart: isStart,
        view: state.view,
        unseen: this.unseen
      }
    })

    this._handleScrollEvent()
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

    // iOS Soft keyboard scrolling past document height bug
    // Utils.iosSoftKeyboardOffset(state, container)

    // Event listeners
    container.addEventListener('click', async e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-submit-feedback-btn')) {
        e.preventDefault()
        this._submitFeedback()
      }
      if (e.target.hasAttribute('data-wc-end-btn')) {
        e.preventDefault()
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
      if (e.target.hasAttribute('data-wc-settings-btn')) {
        e.preventDefault()
        this._settings()
      }
      if (e.target.hasAttribute('data-wc-transcript-btn')) {
        e.preventDefault()
        console.log('Transcript')
      }
      if (e.target.hasAttribute('data-wc-save-settings-btn')) {
        e.preventDefault()
        this._saveSettings(e.target)
      }
      if (e.target.hasAttribute('data-wc-audio-btn')) {
        e.preventDefault()
        this._toggleAudio(e.target)
      }
    })

    // Message events
    container.addEventListener('keyup', e => {
      if (e.target.hasAttribute('data-wc-textbox')) {
        const textbox = e.target
        const label = textbox.previousElementSibling
        // Conditionally show label
        Utils.toggleLabel(label, e.key, textbox)
        // Autosize height
        Utils.autosize(e.target, 120)
        // Conditionally submit form
        Utils.submit(e, textbox)
        // Start timeout
        if (this.timeout) {
          this._resetTimeout()
        }
      }
    })
    container.addEventListener('keydown', e => {
      if (e.target.hasAttribute('data-wc-textbox')) {
        const textbox = e.target
        const label = textbox.previousElementSibling
        // Conditionally hide label
        Utils.toggleLabel(label, e.key, textbox)
        // Conditionally suppress enter
        Utils.suppressEnter(e, textbox)
        // Send keystroke event
        this._handleSendKeystrokeEvent.bind(this)
      }
    })
    container.addEventListener('paste', e => {
      console.log('paste: ', e)
      if (e.target.closest('div#message')) {
        e.preventDefault()
        const text = (e.clipboardData || window.clipboardData).getData('text')
        const textbox = document.getElementById('message')
        const label = textbox.previousElementSibling
        textbox.innerText = text
        Utils.toggleLabel(label, 'v', textbox)
      }
    }, true)
    container.addEventListener('submit', e => {
      if (e.target.hasAttribute('data-wc-message')) {
        e.preventDefault()
        this._sendMessage()
      }
    }, true)
  }

  _updatePanel () {
    console.log('_updatePanel')
    const state = this.state

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }
    
    // Update content
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    const model = {
      model: {
        availability: state.availability,
        view: state.view,
        status: state.status,
        isOpen: state.isOpen,
        isBack: state.isBack,
        isMobile: state.isMobile,
        isAudio: state.isAudio,
        messages: this.messages,
        assignee: this.assignee,
        texboxValue: this.texboxValue
      }
    }

    const content = container.querySelector('[data-wc-inner]')
    content.innerHTML = env.render('webchat-panel.html', model)

    // Initialise GOV.UK components
    const buttons = content.querySelectorAll('[data-module="govuk-button"]')
    for (let i = 0; i <= buttons.length; i++) {
      new Button(buttons[i]).init()
    }
    const characterCounts = content.querySelectorAll('[data-module="govuk-character-count"]')
    for (let i = 0; i <= characterCounts.length; i++) {
      new CharacterCount(characterCounts[i]).init()
    }

    // Scroll messages
    this._scrollToLatest()
  }

  _validatePrechat (successCb) {
    const userName = document.getElementById('name').value
    const message = document.getElementById('message').value

    if (!(userName.length && message.length >= 2 && message.length <= 500)) {
      // Validation error
      console.log(`Enter a name and/or message, message length ${message.length}`)
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

    const textbox = container.querySelector('[data-wc-textbox]')
    if (textbox) {
      textbox.setAttribute('aria-multiline', state.isMobile)
    }
  }

  _openChat (e) {
    const state = this.state
    state.isOpen = true

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    if (isBtn) {
      e.preventDefault()
      state.pushState('PRECHAT')
    }

    if (!this.container) {
      this._createPanel()
      this._updatePanel()
    }

    this._handleScrollEvent()
  }

  _closeChat (e) {
    const state = this.state
    state.isOpen = false

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }

    // Reinstate link
    const availability = this.availability
    const link = availability.querySelector('[data-wc-link]')
    if (link) {
      link.classList.remove('wc-link--disabled')
      link.classList.remove('wc-link--hidden')
    }

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent

    if (isBtn && state.isBack) {
      state.back()
    } else if (this.container) {
      this._setAttributes()
      this.container = this.container.remove()
      state.replaceState()
      this._handleScrollEvent(e)
    }

    this._updateAvailability()
  }

  _prechat () {
    const state = this.state
    state.view = 'PRECHAT'
    console.log('_prechat')
    this._updatePanel()
  }

  _continue () {
    const state = this.state
    state.view = 'START'
    console.log('_continue')
    this._updatePanel()
  }

  _timeoutChat() {
    const state = this.state
    const status = state.status
    const thread = this.thread

    // Close thread
    localStorage.removeItem('THREAD_ID')
    this.messages = []
    if (status && status !== 'closed') {
      state.view = 'TIMEOUT'
      thread.endChat()
    }
  }

  _endChat () {
    const state = this.state
    state.view = 'END'
    console.log('_endChat')
    this._updatePanel()
  }

  _resumeChat (e) {
    e.preventDefault()
    const state = this.state
    state.view = 'OPEN'
    console.log('_resumeChat')
    this._updatePanel()
  }

  _confirmEndChat () {
    const state = this.state
    const status = state.status
    const thread = this.thread

    // Close thread
    localStorage.removeItem('THREAD_ID')
    this.messages = []

    // Move to next view
    state.view = 'FEEDBACK'

    if (status && status !== 'closed') {
      // This method has no promise to listen for...
      thread.endChat()
    } else {
      this._updatePanel()
      // Don't need to persist feedback view
      state.view = 'PRECHAT'
      console.log('Done: ', state.view)
      // Start timeout
      this._resetTimeout()
    }
  }

  _submitFeedback () {
    const state = this.state
    state.view = 'FEEDBACK-CONFIRM'
    this._updatePanel()
    state.view = 'PRECHAT'
  }

  _settings () {
    const state = this.state
    state.view = 'SETTINGS'
    console.log('_settings')
    this._updatePanel()
    state.view = 'OPEN'
  }

  _saveSettings (target) {
    const isSave = target.hasAttribute('data-wc-save-settings')
    console.log('_saveSettings: ', isSave)
    this._updatePanel()
  }

  _toggleAudio (target) {
    const state = this.state
    state.isAudio = !state.isAudio
    if (state.isAudio) {
      localStorage.removeItem('AUDIO_OFF')
    } else {
      localStorage.setItem('AUDIO_OFF', true)
    }
    console.log('_toggleAudio: ', state.isAudio)
    const text = target.querySelector('span')
    text.innerText = state.isAudio ? 'off' : 'on'
  }

  _mergeMessages (batch) {
    const messages = []

    // Create message model
    for (let i = 0; i < batch.length; i++) {
      messages.push({
        id: batch[i].id,
        text: Utils.parseMessage(batch[i].messageContent.text),
        assignee: batch[i].authorUser ? batch[i].authorUser.firstName : null,
        date: Utils.formatDate(new Date(batch[i].createdAt)),
        createdAt: new Date(batch[i].createdAt),
        direction: batch[i].direction
      })
    }
    messages.reverse()
    this.messages = messages.concat(this.messages)
  }

  _sendMessage (e) {
    console.log('_sendMessage')

    const thread = this.thread
    const message = document.getElementById('message')
    
    if (!(message && message.textContent.length)) {
      return
    }
    // *** Some times this results in onconsitent data error?
    try {
      thread.sendTextMessage(message.innerText.trim())
    } catch (err) {
      console.log(err)
    }
  }

  _scrollToLatest () {
    // Scroll to latest
    const body = this.container.querySelector('[data-wc-body]')
    if (body) {
      body.scrollTop = body.scrollHeight
    }
    // Mark as seen
    const state = this.state
    if (body && state.isOpen) {
      this.thread.lastMessageSeen()
    }
  }

  _resetTimeout () {
    if (!Config.timeout > 0) {
      return
    }

    // Clear existing timeout
    clearTimeout(this.timeout)
    clearInterval(this.countdown)

    // We dont have an open thread
    const status = this.state.status
    if (!status || status === 'closed') {
      console.log('Timeout stopped...')
      return
    }
    
    const container = this.container
    if (container) {
      const timeout = container.querySelector('[data-wc-timeout]')
      if (timeout) {
        timeout.remove()
      }
    }
    console.log('Timeout started...')
    this.timeout = setTimeout(this._handleTimeout.bind(this), Config.timeout * 1000)
  }

  _debug (text) {
    if (!Utils.getParameterByName('debug')) {
      return
    }
    if (!this.debug) {
      const debug = document.createElement('div')
      debug.id = 'debug'
      debug.className = 'wc-debug'
      debug.setAttribute('style', `
        position: absolute;
        font-size: 12px;
        top: 50%;
        border: 1px solid red;
        padding: 5px;
        width: 200px;
        height: 100px;
        margin-top: -50px;
        overflow: auto;
        z-index: 1000;
      `)
      document.body.appendChild(debug)
      this.debug = document.getElementById('debug')
    }
    this.debug.innerHTML += `${text}<br/>`
  }

  //
  // Event handlers
  //

  _handleConsumerAuthorizedEvent (e) {
    console.log('_handleConsumerAuthorizedEvent')
  }

  _handleReadyEvent (e) {
    console.log('_handleReadyEvent')

    this._updateAvailability()
    this._updatePanel()

    // Start timeout
    this._resetTimeout()
  }

  _handleCaseStatusChangedEvent (e) {
    console.log('_handleCaseStatusChangedEvent')
    console.log(e.detail.data)

    const state = this.state
    state.status = e.detail.data.case.status
    const view = state.view

    // Currently only responding to a closed case
    if (state.status === 'closed') {
      this._updatePanel()
      // If intigated by user view will have been set to FEEDBACK
      state.view = view === 'FEEDBACK' ? 'PRECHAT' : view
      // Start timeout
      this._resetTimeout()
    }
  }

  _handleAgentContactEndedEvent (e) {
    console.log('_handleAgentContactEndedEvent')
  }

  _handleAssignedAgentChangedEvent (e) {
    console.log('_handleAssignedAgentChangedEvent')

    const assignee = e.detail.data.inboxAssignee
    this.assignee = assignee ? assignee.firstName : null

    this._updatePanel()
  }

  _handleRoutingQueueCreatedEvent (e) {
    console.log('_handleRoutingQueueCreatedEvent')
  }

  _handleRoutingQueueUpdatedEvent (e) {
    console.log('_handleRoutingQueueUpdatedEvent')
  }

  _handleUserAssignedToRoutingQueueEvent (e) {
    console.log('_handleUserAssignedToRoutingQueue')
  }

  _handleUserUnassignedFromRoutingQueueEvent (e) {
    console.log('_handleUserUnassignedFromRoutingQueue')
  }

  // _handleSetPositionInQueueEvent (e) {
  //   console.log('_handleSetPositionInQueueEvent')
  //
  //   const queue = e.detail.data.positionInQueue
  //   this.queue = queue || null
  //   this._updatePanel()
  // }

  async _handleLivechatRecoveredEvent (e) {
    console.log('_handleLivechatRecoveredEvent')

    const assignee = e.detail.data.inboxAssignee
    this.assignee = assignee ? assignee.firstName : null

    const state = this.state
    const status = e.detail.data.consumerContact.status
    state.status = status
 
    this.messages = []
    let messages = e.detail.data.messages

    // Get unseen messages
    const unseen = e.detail.data.thread.unseenMessagesCount
    this.unseen = unseen

    // Recursively merge messages with previous messages
    while (messages.length) {
      this._mergeMessages(messages)
      try {
        const response = await this.thread.loadMoreMessages()
        messages = response.data.messages
      } catch (err) {
        console.log(err)
        messages = []
      }
    }
    console.log('All messages loaded')

    // Remove duplicates?? LoadMoreMessages doesnt always get a unique set?
    this.messages = [...new Map(this.messages.map(m => [m.id, m])).values()]

    // Sort on date
    this.messages = Utils.sortMessages(this.messages)

    // Add group end property
    this.messages = Utils.addGroupMeta(this.messages)
    
    // Ready
    document.dispatchEvent(this.livechatReady)
  }

  _handleCaseCreatedEvent (e) {
    console.log('_handleCaseCreatedEvent')

    const state = this.state
    state.view = 'OPEN'
  }

  _handleMessageCreatedEvent (e) {
    console.log('_handleMessageCreatedEvent')

    const state = this.state
    state.view = 'OPEN'

    const response = e.detail.data.message
    state.status = e.detail.data.case.status
    const direction = response.direction.toLowerCase()

    // Add message
    const message = {
      id: response.id,
      text: Utils.parseMessage(response.messageContent.text),
      assignee: response.authorUser ? response.authorUser.firstName : null,
      date: Utils.formatDate(new Date(response.createdAt)),
      createdAt: new Date(response.createdAt),
      direction: direction
    }
    const messages = this.messages
    messages.push(message)

    // Add group end property
    this.messages = Utils.addGroupMeta(messages)

    // Update unseen count
    if (direction === 'outbound' && !state.isOpen) {
      this.unseen += 1
      this._updateAvailability()
    }

    // Start timeout
    this._resetTimeout()

    this._updatePanel()
  }

  _handleAgentTypingEvent (e) {
    console.log('_handleAgentTypingEvent')

    const isTyping = e.type === 'AgentTypingStarted'
    const agentName = e.detail.data.user.firstName
    const list = document.querySelector('[data-wc-message-list]')

    if (!list) {
      return
    }

    // Reset timeout
    this._resetTimeout()

    const el = list.querySelector('[data-wc-agent-typing]')
    
    if (isTyping) {
      list.insertAdjacentHTML('beforeend', `
        <li class="wc-list__item wc-list__item--outbound" data-wc-agent-typing>
          <div class="wc-list__item-inner"><svg width="28" height="16" x="0px" y="0px" viewBox="0 0 28 16"><circle stroke="none" cx="3" cy="8" r="3" fill="currentColor"></circle><circle stroke="none" cx="14" cy="8" r="3" fill="currentColor"></circle><circle stroke="none" cx="25" cy="8" r="3" fill="currentColor"></circle></svg></div>
          <span class="wc-list__item-meta">${agentName} is typing</span>
        </li>
      `)
      this._scrollToLatest()
    } else if (el) {
      el.remove()
    }
  }

  _handleMessageSeenByEndUserEvent (e) {
    console.log('_handleMessageSeenByEndUserEvent')

    this.unseen = 0
    this._updateAvailability()
  }

  _handleTimeout (e) {
    console.log('Countdown starting...')
    const container = this.container
    const seconds = Config.countdown
    let element

    if (container) {
      // *** If we have the list but dont already have the timeout markup
      const list = container.querySelector('[data-wc-message-list]')
      const timeout = container.querySelector('[data-wc-timeout]')
      if (list && !timeout) {
        list.insertAdjacentHTML('afterend', `
          <div class="wc-timeout" data-wc-timeout>
            <div class="wc-timeout__inner">
              <div class="wc-timeout__message">Webchat will end in <span data-wc-countdown>${seconds} seconds</span></div>
            </div>
            <a href="#" class="wc-cancel-timeout-btn" data-wc-cancel-timeout>Continue webchat</a>
          </div>
        `)
        this._scrollToLatest()

        // Reference to the countdown element
        element = container.querySelector('[data-wc-countdown]')

        // Clear timeout
        const clearBtn = container.querySelector('[data-wc-cancel-timeout]')
        clearBtn.addEventListener('click', e => {
          e.preventDefault()
          this._resetTimeout()
        })
      }
    }

    // Set countdown
    this.countdown = Utils.setCountdown(element, () => {
      console.log('Count down ended')
      if (container) {
        this._timeoutChat()
      } else {
        console.log('Chat has timedout')
      }
    })
  }

  _handleScrollEvent (e) {
    const state = this.state
    const availability = this.availability
    const link = availability.querySelector('[data-wc-link]')

    if (!link) {
      return
    }

    const rect = availability.getBoundingClientRect()
    const isBelowFold = rect.top + 35 > (window.innerHeight || document.documentElement.clientHeight)

    link.classList.toggle('wc-link--fixed', (state.view === 'OPEN' || state.view === 'END') && !state.isOpen && isBelowFold)
  }

  _handleSendKeystrokeEvent () {
    this.thread.keystroke(1000)
    setTimeout(() => {
      this.thread.stopTyping()
    }, 1000)
  }

  _handleChatEvent (e) {
    console.log('Chat event: ', e)
  }
}

export default WebChat
