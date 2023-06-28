'use strict'

import { ChatSdk, EnvironmentName, ChatEvent } from '@nice-devone/nice-cxone-chat-web-sdk'
import State from './state'
import Panel from './panel'
import Notification from './notification'
import Keyboard from './keyboard'
import Utils from './utils'
import Transcript from './transcript'
import Config from './config'
import Availability from './availability'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor (id) {  
    this.id = id
    this.messages = []

    // Update meta viewport
    // const metaViewport = document.querySelector('meta[name="viewport"]')
    // metaViewport.content += ', interactive-widget=resizes-content'

    // Initialise state
    this.state = new State(this._openChat.bind(this), this._closeChat.bind(this))

    // Initialise availability
    this.availability = new Availability(id, this._openChat.bind(this))

    // Initialise panel
    this.panel = new Panel()

    // Initialise notification
    this.notification = new Notification()

    // Initialise keyboard interface
    Keyboard.init(this.state)

    // Attach custom ready event listener
    this.livechatReady = new CustomEvent('livechatReady', {})
    document.addEventListener('livechatReady', this._handleReadyEvent.bind(this))

    // Reinstate html visiblity
    const body = document.body
    if (body.classList.contains('wc-hidden')) {
      body.classList.remove('wc-hidden')
      body.classList.add('wc-body')
    }

    // Render availability
    const state = this.state
    this.availability.update(state)
    this._handleScrollEvent()
    
    // Open panel if #webchat exists
    if (state.isOpen) {
      const panel = this.panel
      panel.create(state, this._addEvents.bind(this))
      panel.update(state)
    }

    // Attach sticky footer scroll event
    document.addEventListener('scroll', this._handleScrollEvent.bind(this))

    // Conditionally recover thread
    if (state.hasThread) {
      this._recoverThread()
    } else {
      document.dispatchEvent(this.livechatReady)
    }
  }

  async _authorise () {
    const state = this.state

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

    // How do we know they have been authorised?
    state.isAuthorised = true

    // Confirm availability from SDK
    const isOnline = response?.channel.availability.status === 'online'
    state.availability = isOnline ? 'AVAILABLE' : 'OFFLINE' 
  }

  async _recoverThread () {
    const state = this.state

    // Recover thread
    try { // Address issue with no thread but we still have the session id
      await this._authorise()
      await this._getThread()
      this.thread.recover()
      return
    } catch (err) {
      console.log(err)
      localStorage.removeItem('THREAD_ID')
      state.view = 'PRECHAT'
      document.dispatchEvent(this.livechatReady)
    }
  }

  async _getThread () {
    const state = this.state
    const sdk = this.sdk

    // Get thread
    let threadId = localStorage.getItem('THREAD_ID')
    if (!threadId) {
      threadId = Utils.generateThreadId()
      localStorage.setItem('THREAD_ID', threadId)
    }
    const thread = await sdk.getThread(threadId)
    this.thread = thread
    state.hasThread = true

    // Add event listeners
    thread.onThreadEvent(ChatEvent.CASE_CREATED, this._handleCaseCreatedEvent.bind(this))
    thread.onThreadEvent(ChatEvent.MESSAGE_CREATED, this._handleMessageCreatedEvent.bind(this))
    thread.onThreadEvent(ChatEvent.AGENT_TYPING_STARTED, this._handleAgentTypingEvent.bind(this))
    thread.onThreadEvent(ChatEvent.AGENT_TYPING_ENDED, this._handleAgentTypingEvent.bind(this))
    thread.onThreadEvent(ChatEvent.AGENT_CONTACT_ENDED, this._handleAgentContactEndedEvent.bind(this))
  }

  async _startChat (userName, message) {
    const state = this.state
  
    // Authorise user
    await this._authorise()
    const sdk = this.sdk

    // Can we send messages when offline?
    console.log('_startChat')

    // Set userName
    sdk.getCustomer().setName(userName)

    // Start chat
    await this._getThread()

    try {
      this.thread.startChat(message)
    } catch (err) {
      console.log()
    }

    this.panel.setAttributes(state)
  }

  _addEvents () {
    const container = this.panel.container

    // Button events
    container.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        e.preventDefault()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        e.preventDefault()
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
        e.preventDefault()
        this._resumeChat(e)
      }
      if (e.target.hasAttribute('data-wc-confirm-end-btn')) {
        e.preventDefault()
        this._confirmEndChat()
      }
      if (e.target.hasAttribute('data-wc-continue-btn')) {
        e.preventDefault()
        this._continue(e)
      }
      if (e.target.hasAttribute('data-wc-back-prechat')) {
        e.preventDefault()
        this._prechat(e)
      }
      if (e.target.hasAttribute('data-wc-submit-btn')) {
        e.preventDefault()
        this._validatePrechat(this._startChat.bind(this))
      }
      if (e.target.hasAttribute('data-wc-settings-btn')) {
        e.preventDefault()
        this._settings()
      }
      if (e.target.hasAttribute('data-wc-transcript-btn')) {
        e.preventDefault()
        this._download()
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
    // Send keystroke event
    container.addEventListener('keydown', e => {
      if (e.target.hasAttribute('data-wc-textbox')) {
        this._handleSendKeystrokeEvent()
      }
    })
    // Reset timeout event
    container.addEventListener('keyup', e => {
      if (e.target.hasAttribute('data-wc-textbox') && this.timeout) {
        this._resetTimeout()
      }
    })
    // Send message
    container.addEventListener('submit', e => {
      if (e.target.hasAttribute('data-wc-message')) {
        e.preventDefault()
        this._sendMessage()
      }
    }, true)
  }

  _updateMessages () {
    console.log('_updateMessages')

    const messages = this.messages
    const len = messages.length
    const message = messages[len - 1]
    const isAddition = len > 1 && messages[len - 2].direction === message.direction
    
    const list = document.querySelector('[data-wc-message-list]')
    if (!list) {
      return
    }

    // Remove group meta
    if (isAddition) {
      list.querySelector('li:last-child [data-wc-item-meta]').remove()
    }

    // Add new item
    list.insertAdjacentHTML('beforeend', message.html)

    // Scroll messages
    const panel = this.panel
    panel.scrollToLatest()

    // Mark as seen
    const thread = this.thread
    if (thread) {
      thread.lastMessageSeen()
    }
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

  _openChat (e) {
    console.log('_openChat')

    const state = this.state
    state.isOpen = true

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }

    // Conditionally push new state to history
    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    if (isBtn) {
      e.preventDefault()
      state.pushState('PRECHAT')
    }

    const panel = this.panel
    if (!panel.container) {
      // Create panel
      panel.create(state, this._addEvents.bind(this))
      panel.update(state, this.messages)

      // Mark messages as seen
      const thread = this.thread
      if (thread && state.view === 'OPEN') {
        thread.lastMessageSeen()
      }
    }

    // Hide sticky availability
    this._handleScrollEvent()
  }

  _closeChat (e) {
    console.log('_closeChat')

    const state = this.state
    state.isOpen = false

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    const panel = this.panel

    if (isBtn && state.isBack) {
      state.back()
    } else if (panel.container) {
      panel.setAttributes(state)
      panel.container = panel.container.remove()
      state.replaceState()
      this._handleScrollEvent(e)
    }

    this.availability.update(state)
  }

  _timeoutChat() {
    const state = this.state
    const status = state.status

    // Close thread
    localStorage.removeItem('THREAD_ID')
    this.messages = []
    if (status && status !== 'closed') {
      this.thread.endChat()
    }

    // Show timeout view
    state.view = 'TIMEOUT'
    this.panel.update(state)
    state.view = 'PRECHAT'
  }

  _confirmEndChat () {
    console.log('_confirmEndChat')
  
    // Close thread
    localStorage.removeItem('THREAD_ID')
    this.messages = []

    // Move to next view
    const state = this.state
    state.view = 'FEEDBACK'

    const status = state.status
    if (status && status !== 'closed') {
      // This method has no promise to listen for...
      // ** Event doesnt fire on Heroku
      this.thread.endChat()
    }
    
    // Show feedback view
    this.panel.update(state)
    state.view = 'PRECHAT'
    // Start/reset timeout
    this._resetTimeout()
  }

  _prechat () {
    const state = this.state
    state.view = 'PRECHAT'
    console.log('_prechat')
    this.panel.update(state)
  }

  _continue () {
    const state = this.state
    state.view = 'START'
    console.log('_continue')
    this.panel.update(state)
  }

  _endChat () {
    const state = this.state
    state.view = 'END'
    console.log('_endChat')
    this.panel.update(state)
  }

  _resumeChat () {
    const state = this.state
    state.view = 'OPEN'
    console.log('_resumeChat')
    this.panel.update(state, this.messages)
  }

  _submitFeedback () {
    const state = this.state
    state.view = 'FINISH'
    this.panel.update(state)
    // Don't need to persist view
    state.view = 'PRECHAT'
  }

  _toggleAudio (target) {
    const state = this.state
    state.hasAudio = !state.hasAudio
    const hasAudio = state.hasAudio

    if (hasAudio) {
      localStorage.removeItem('AUDIO_OFF')
    } else {
      localStorage.setItem('AUDIO_OFF', true)
    }
    console.log('_toggleAudio: ', hasAudio)
    const text = target.querySelector('span')
    text.innerText = hasAudio ? 'off' : 'on'
  }

  _mergeMessages (batch) {
    const messages = []

    // Create message model
    for (let i = 0; i < batch.length; i++) {
      messages.push({
        id: batch[i].id,
        text: Utils.parseMessage(batch[i].messageContent.text),
        user: batch[i].authorEndUserIdentity ? batch[i].authorEndUserIdentity.fullName.trim() : null,
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
    
    const container = this.panel.container
    if (container) {
      const timeout = container.querySelector('[data-wc-timeout]')
      if (timeout) {
        timeout.remove()
      }
    }
    console.log('Timeout started...')
    this.timeout = setTimeout(this._handleTimeout.bind(this), Config.timeout * 1000)
  }

  _download () {
    console.log('download')
    const transcript = new Transcript(this.messages)
    const data = transcript.data
    const anchor = document.createElement('a')
    anchor.className = 'govuk-visually-hidden'
    anchor.setAttribute('href', data)
    anchor.setAttribute('download', 'transcript.txt')
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  //
  // Event handlers
  //

  _handleConsumerAuthorizedEvent (e) {
    console.log('_handleConsumerAuthorizedEvent')
  }

  _handleReadyEvent (e) {
    console.log('_handleReadyEvent')
    const state = this.state
    console.log('state.view: ', state.view)

    // Start/reset timeout
    this._resetTimeout()

    // Poll availability
    let isPageLoad = true
    Utils.poll({
      fn: () => {
        fetch(Config.availabilityEndPoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        .then(response => response.json())
        .then(isAvailable => {
          console.log('Polling availability')
          state.availability = isAvailable ? 'AVAILABLE' : 'OFFLINE'
          this.availability.update(state)
          const panel = this.panel
          if (isPageLoad) {
            panel.update(state, this.messages)
          } else {
            panel.setStatus(state)
          }
          isPageLoad = false
        })
      },
      interval: Config.poll * 1000
    }) 
  }

  _handleCaseStatusChangedEvent (e) {
    console.log('_handleCaseStatusChangedEvent')

    const state = this.state
    state.status = e.detail.data.case.status

    // Currently only responding to a closed case
    if (state.status === 'closed' && state.view === 'OPEN') {
      // Instigated by adviser
      this.panel.setStatus(state)

      // Start/reset timeout
      this._resetTimeout()
    }
  }

  _handleAgentContactEndedEvent (e) {
    console.log('_handleAgentContactEndedEvent')
  }

  _handleAssignedAgentChangedEvent (e) {
    console.log('_handleAssignedAgentChangedEvent')
    const state = this.state

    const assignee = e.detail.data.inboxAssignee
    state.assignee = assignee ? assignee.firstName : null

    this.panel.setStatus(state)
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

  async _handleLivechatRecoveredEvent (e) {
    console.log('_handleLivechatRecoveredEvent')
    const state = this.state
    const status = e.detail.data.consumerContact.status
    state.status = status

    // Latest datetime
    let messages = e.detail.data.messages
    const latestDatetime = new Date(messages[0].createdAt)
    const elapsed = Math.abs((new Date()) - latestDatetime) / 1000
    const timeout = Config.timeout
    const countdown = Config.countdown
    const isExpired = (timeout + countdown) - elapsed <= 0

    // End chat if elapsed time outside allowance
    if (isExpired) {
      localStorage.removeItem('THREAD_ID')
      state.view = 'TIMEOUT'
      if (state.status !== 'closed') {
        this.thread.endChat()
      }
      document.dispatchEvent(this.livechatReady)
      return
    }

    const assignee = e.detail.data.inboxAssignee
    state.assignee = assignee ? assignee.firstName : null
    const unseen = e.detail.data.thread.unseenMessagesCount
    state.unseen = unseen
    state.view = 'OPEN'

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

    // Add html
    this.messages = Utils.addMessagesHtml(env, this.messages)
    
    // Ready
    document.dispatchEvent(this.livechatReady)
  }

  _handleCaseCreatedEvent (e) {
    // Fires on local but no on Heroku?
    console.log('_handleCaseCreatedEvent')

    // const state = this.state
    // state.view = 'OPEN'
    // this.panel.update(state)
  }

  _handleMessageCreatedEvent (e) {
    console.log('_handleMessageCreatedEvent')

    const state = this.state  
    const response = e.detail.data.message
    const assignee = response.authorUser ? response.authorUser.firstName : null
    const user = response.authorEndUserIdentity ? response.authorEndUserIdentity.fullName.trim() : null
    const direction = response.direction.toLowerCase()
    state.status = e.detail.data.case.status
    state.assignee = assignee

    // Update messages array
    const message = {
      id: response.id,
      text: Utils.parseMessage(response.messageContent.text),
      user: user,
      assignee: assignee,
      date: Utils.formatDate(new Date(response.createdAt)),
      createdAt: new Date(response.createdAt),
      direction: direction
    }
    this.messages.push(message)

    // Add html to messages
    this.messages = Utils.addMessagesHtml(env, this.messages)

    // Update unseen count
    if (direction === 'outbound' && !state.isOpen) {
      state.unseen += 1
      this.availability.update(state)
    }

    // Clear input
    const textbox = document.querySelector('[data-wc-textbox]')
    if (textbox && direction === 'inbound') {
      textbox.innerHTML = ''
      const event = new Event('change')
      textbox.dispatchEvent(event)
    }

    // Update panel
    if (state.view === 'START') {
      state.view = 'OPEN'
      this.panel.update(state, this.messages)
    } else if (state.view === 'OPEN') {
      this._updateMessages()
    }

    // Start/reset timeout
    this._resetTimeout()

    // Play notification sound
    if (state.hasAudio && direction === 'outbound') {
      const notification = this.notification
      notification.playSound()
    }
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
      const panel = this.panel
      panel.scrollToLatest()
    } else if (el) {
      el.remove()
    }
  }

  _handleMessageSeenByEndUserEvent (e) {
    console.log('_handleMessageSeenByEndUserEvent')
    const state = this.state

    state.unseen = 0
    this.availability.update(state)
  }

  _handleTimeout (e) {
    console.log('Countdown starting...')
    const container = this.panel.container
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
        this.panel.scrollToLatest()

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
    const container = this.availability.container
    const link = container.querySelector('[data-wc-link]')

    if (!link) {
      return
    }

    const rect = container.getBoundingClientRect()
    const isBelowFold = rect.top + 35 > (window.innerHeight || document.documentElement.clientHeight)

    link.classList.toggle('wc-link--fixed', (state.view === 'OPEN' || state.view === 'END') && !state.isOpen && isBelowFold)
  }

  _handleSendKeystrokeEvent () {
    console.log('_handleSendKeystrokeEvent')

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
