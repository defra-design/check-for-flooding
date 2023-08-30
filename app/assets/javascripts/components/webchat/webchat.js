'use strict'

import { ChatSdk, EnvironmentName, ChatEvent } from '@nice-devone/nice-cxone-chat-web-sdk'
import State from './state'
import Skiplink from './skiplink'
import Availability from './availability'
import Panel from './panel'
import Notification from './notification'
import Keyboard from './keyboard'
import Transcript from './transcript'
import Config from './config'
import Utils from './utils'

class WebChat {
  constructor (id) {  
    this.id = id

    // Initialise state
    this.state = new State(this._openChat.bind(this), this._closeChat.bind(this))

    // Initialise availability
    this.availability = new Availability(id, this._openChat.bind(this))

    // Initialise panel
    this.panel = new Panel()

    // Initialise skiplink
    this.skiplink = new Skiplink()

    // Initialise notification
    this.notification = new Notification()

    // Reinstate html visiblity (avoid refresh flicker)
    if (document.body.classList.contains('wc-hidden')) {
      document.body.classList.remove('wc-hidden')
      document.body.classList.add('wc-body')
    }

    // Initialise keyboard interface
    const state = this.state
    Keyboard.init(state)

    // Render availability content
    this.availability.update(state)
    
    // Render panel if #webchat exists in url
    if (state.isOpen) {
      const panel = this.panel
      panel.create(state, this._addDomEvents.bind(this))
      panel.update(state)
    }

    // Conditionally add skiplink
    this.skiplink.toggle(state.view === 'OPEN' || state.view === 'END')

    // Attach sticky footer scroll event
    document.addEventListener('scroll', e => {
      this.availability.scroll(state)
    })
    this.availability.scroll(state)

    // Attach custom 'ready' event listener
    this.livechatReady = new CustomEvent('livechatReady', {})
    document.addEventListener('livechatReady', this._handleReadyEvent.bind(this))
    
    // Conditiopnally recover thread
    if (state.hasThread) {
      this._recoverThread()
      return
    }

    // Ready to check availability
    document.dispatchEvent(this.livechatReady)
  }

  async _authorise () {
    console.log('_authorise')

    // New SDK instance
    const sdk = new ChatSdk({
      brandId: process.env.CXONE_BRANDID,
      channelId: process.env.CXONE_CHANNELID,
      customerId: localStorage.getItem('CUSTOMER_ID') || '',
      environment: EnvironmentName[process.env.CXONE_ENVIRONMENT_NAME]
    })

    // Authorise and set customerId
    const response = await sdk.authorize()
    const customerId = response?.consumerIdentity.idOnExternalPlatform
    localStorage.setItem('CUSTOMER_ID', customerId || '')
    this.customerId = customerId

    // How do we know they have been authorised?
    const state = this.state
    state.isAuthorised = true

    // Confirm availability from SDK
    const isOnline = response?.channel.availability.status === 'online'
    state.availability = isOnline ? 'AVAILABLE' : 'UNAVAILABLE'

    // Add sdk event listeners

    // v1.3.0
    // sdk.onChatEvent(ChatEvent.CONSUMER_AUTHORIZED, this._handleConsumerAuthorizedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.LIVECHAT_RECOVERED, this._handleLivechatRecoveredEvent.bind(this))
    sdk.onChatEvent(ChatEvent.MESSAGE_CREATED, this._handleMessageCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.AGENT_TYPING_STARTED, this._handleAgentTypingEvent.bind(this))
    sdk.onChatEvent(ChatEvent.AGENT_TYPING_ENDED, this._handleAgentTypingEvent.bind(this))
    sdk.onChatEvent(ChatEvent.MESSAGE_SEEN_BY_END_USER, this._handleMessageSeenByEndUserEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ASSIGNED_AGENT_CHANGED, this._handleAssignedAgentChangedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CONTACT_CREATED, this._handleContactCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CONTACT_STATUS_CHANGED, this._handleContactStatusChangedEvent.bind(this))

    // v1.2.0
    sdk.onChatEvent(ChatEvent.CASE_INBOX_ASSIGNEE_CHANGED, this._handleAssignedAgentChangedEvent.bind(this))
    // sdk.onChatEvent(ChatEvent.CASE_CREATED, this._handleContactCreatedEvent.bind(this))
    // sdk.onChatEvent(ChatEvent.CASE_STATUS_CHANGED, this._handleContactStatusChangedEvent.bind(this))

    this.sdk = sdk
  }

  async _recoverThread () {
    console.log('_recoverThread')

    // Recover thread
    try {
      await this._authorise()
      await this._getThread()
      await this.thread.recover()
    } catch (err) {
      // Address issue with no thread but we still have the thread id
      console.log(err)
      localStorage.removeItem('THREAD_ID')
      // Reset view
      this.state.view = 'PRECHAT'
      // Dispatch ready event
      document.dispatchEvent(this.livechatReady)
    }
  }

  async _getThread () {
    // Get thread
    let threadId = localStorage.getItem('THREAD_ID')
    if (!threadId) {
      // Generate id
      const random =  Math.floor(Math.random() * 1000).toString()
      const time = (new Date()).getTime()
      threadId = `${time}${random}`
      localStorage.setItem('THREAD_ID', threadId)
    }
    const thread = await this.sdk.getThread(threadId)
    this.thread = thread
    this.state.hasThread = true
  }

  async _updateAvailability () {
    const state = this.state
    state.availability = await Utils.getAvailability()
    const availability = this.availability
    availability.update(state)
    availability.scroll(state)
  }

  async _startChat () {
    console.log('_startChat')

    // Check availability
    await this._updateAvailability()
    const state = this.state
    if (state.availability !== 'AVAILABLE') {
      this._unavailable()
      return
    }

    // Authorise user
    if (!state.isAuthorised) {
      await this._authorise()
    }

    // ***Bug: Set userName populates last name from string after last space 
    this.sdk.getCustomer().setName(state.name)

    // Start chat
    try {
      await this._getThread()
      this.thread.startChat(state.question || 'Begin conversation')
    } catch (err) {
      console.log(err)
    }

    // Update panel attributes
    const panel = this.panel
    panel.setAttributes(state)
  }

  async _confirmEndChat () {
    console.log('_confirmEndChat')
  
    // Close thread
    localStorage.removeItem('THREAD_ID')
    const state = this.state
    state.hasThread = false

    // Clear name and initial question
    state.name = null
    state.question = null

    // Update availability
    await this._updateAvailability()

    // Show feedback view
    state.view = 'FEEDBACK'
    state.messages = []
    this.panel.update(state)
    const btn = document.querySelector('[data-wc-submit-feedback-btn]')
    btn.focus()

    // Clear timeout
    this._resetTimeout()

    // End chat if still open
    const status = state.status
    if (status && status !== 'closed') {
      this.thread.endChat()
    }
    
    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _addDomEvents () {
    // Button events
    const container = this.panel.container
    container.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        e.preventDefault()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-hide-btn')) {
        e.preventDefault()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        e.preventDefault()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-start-btn')) {
        e.preventDefault()
        this._start(e)
      }
      if (e.target.hasAttribute('data-wc-prechat-back-btn')) {
        e.preventDefault()
        this._prechat(e)
      }
      if (e.target.hasAttribute('data-wc-start-back-btn')) {
        e.preventDefault()
        this._start(e)
      }
      if (e.target.hasAttribute('data-wc-request-chat-btn')) {
        e.preventDefault()
        this._validatePrechat(this._startChat.bind(this))
      }
      if (e.target.hasAttribute('data-wc-end-btn')) {
        e.preventDefault()
        this._endChat()
      }
      if (e.target.hasAttribute('data-wc-resume-btn')) {
        e.preventDefault()
        this._resumeChat()
      }
      if (e.target.hasAttribute('data-wc-confirm-end-btn')) {
        e.preventDefault()
        this._confirmEndChat()
      }
      if (e.target.hasAttribute('data-wc-feedback-btn')) {
        e.preventDefault()
        this._feedback()
      }
      if (e.target.hasAttribute('data-wc-submit-feedback-btn')) {
        e.preventDefault()
        this._submitFeedback()
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
      if (e.target.hasAttribute('data-wc-cancel-settings-btn')) {
        e.preventDefault()
        this._resumeChat()
      }
      if (e.target.hasAttribute('data-wc-error-summary-link')) {
        e.preventDefault()
        const id = e.target.href.slice(e.target.href.indexOf('#') + 1)
        document.getElementById(id).focus()
      }
    })
    container.addEventListener('keydown', e => {
      // Send keystroke event
      if (e.target.hasAttribute('data-wc-textbox')) {
        this._handleSendKeystrokeEvent()
      }
      // Prevent scroll chaining
      if (e.target.hasAttribute('data-wc-body')) {
        const m = e.target
        const isBottom = m.scrollTop === (m.scrollHeight - m.offsetHeight)
        const isTop = m.scrollTop <= 0
        if ((e.key === 'ArrowUp' && isTop) || (e.key === 'ArrowDown' && isBottom)) {
          e.preventDefault()
        }
      }
    })
    // Reset timeout event
    container.addEventListener('keyup', e => {
      if (e.target.hasAttribute('data-wc-textbox') && this.timeout) {
        this._resetTimeout()
      }
    })
    // Form submit
    container.addEventListener('submit', e => {
      // Start chat form
      if (e.target.hasAttribute('data-wc-start-form')) {
        e.preventDefault()
        this._validatePrechat(this._startChat.bind(this))
      }
      // Send message form
      if (e.target.hasAttribute('data-wc-message-form')) {
        e.preventDefault()
        this._sendMessage()
      }
    }, true)
    // Close dialog
    container.addEventListener('keyup', e => {
      if (this.state.isOpen && (e.key === 'Escape' || e.key === 'Esc')) {
        this._closeChat(e)
      }
    })
  }

  _validatePrechat (successCb) {
    const name = document.getElementById('name')
    const question = document.getElementById('question')
    const state = this.state
    state.name = name.value
    state.question = question ? question.value : ''

    // Validation error
    const isErrorName = state.name.length <= 0
    const isErrorQuestion = state.question.length <= 0 || state.question.length > 500

    if (isErrorName || isErrorQuestion) {
      const error = {
        nameEmpty: isErrorName,
        questionEmpty: state.question.length <= 0,
        questionExceeded: state.question.length > 500
      }
      const panel = this.panel
      panel.update(state, error)

      // Move focus to error summary
      const summary = panel.container.querySelector('[data-wc-error-summary]')
      summary.focus()
      return
    }

    successCb()
  }

  _openChat (e, instigatorId) {
    console.log('_openChat', instigatorId)

    const state = this.state
    state.instigatorId = instigatorId
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

    // Create panel
    const panel = this.panel
    if (!panel.container) {
      // Create panel
      panel.create(state, this._addDomEvents.bind(this))
      panel.update(state)

      // Mark messages as seen
      const thread = this.thread
      if (thread && state.view === 'OPEN') {
        thread.lastMessageSeen()
      }
    }

    // Hide sticky availability
    this.availability.scroll(state)
  }

  _closeChat (e) {
    console.log('_closeChat')

    const state = this.state

    // History back
    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    if (isBtn && state.isBack) {
      state.back()
      return
    }

    state.isOpen = false

    // Conditionaly reset view
    if (state.view === 'TIMEOUT') {
      state.view = 'PRECHAT'
    }

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }

    const panel = this.panel
    const instigatorId = state.instigatorId

    // Toggle skiplink
    const hasSkip = state.view === 'OPEN' || state.view === 'END'
    this.skiplink.toggle(hasSkip)

    // Remove panel
    if (panel.container) {
      panel.setAttributes(state)
      panel.container = panel.container.remove()
      state.replaceState()
    }

    // Update availability content
    this.availability.update(state)
    this.availability.scroll(state)

    Keyboard.toggleInert()
    
    // Move focus back to instigator
    if (instigatorId) {
      const instigator = document.getElementById(instigatorId)
      if (instigator) {
        document.getElementById(instigatorId).focus()
      }
      delete state.instigatorId
    }
  }

  _timeoutChat() {
    console.log('_timeoutChat')

    // Close thread
    localStorage.removeItem('THREAD_ID')

    // Show timeout view
    const state = this.state
    state.view = 'TIMEOUT'
    state.messages = []
    this.panel.update(state)

    // Clear timeout
    this._resetTimeout()

    // End thread if still open
    const status = state.status
    if (status && status !== 'closed') {
      // *** Bug: Promise is void, why?
      this.thread.endChat()
    }

    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _prechat () {
    const state = this.state
    state.view = 'PRECHAT'
    console.log('_prechat')
    const panel = this.panel
    panel.update(state)
    panel.container.focus()
  }

  _start () {
    const state = this.state
    state.view = 'START'
    console.log('_start')
    const panel = this.panel
    panel.update(state)
    panel.container.focus()
  }

  _unavailable () {
    const state = this.state
    state.view = 'UNAVAILABLE'
    console.log('_unavailable')
    const panel = this.panel
    panel.update(state)
    panel.container.focus()

    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _endChat () {
    const state = this.state
    state.view = 'END'
    console.log('_endChat')
    this.panel.update(state)
    const btn = document.querySelector('[data-wc-confirm-end-btn]')
    btn.focus()
  }

  _resumeChat () {
    const state = this.state
    state.view = 'OPEN'
    console.log('_resumeChat')
    const panel = this.panel
    panel.update(state)
    panel.container.focus()
  }

  _feedback () {
    console.log('_feedback')
    const state = this.state
    state.view = 'FEEDBACK'
    this.panel.update(state)
    const btn = document.querySelector('[data-wc-submit-feedback-btn]')
    btn.focus()

    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _submitFeedback () {
    console.log('_submitFeedback')
    const state = this.state
    state.view = 'FINISH'
    this.panel.update(state)
    const btn = document.querySelector('[role="button"][data-wc-close-btn]')
    btn.focus()
    
    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _settings () {
    const state = this.state
    state.view = 'SETTINGS'
    console.log('_settings')
    const panel = this.panel
    panel.update(state)
    panel.container.focus()
    state.view = 'OPEN'
  }

  _saveSettings () {
    // Toggle audio
    const state = this.state
    const panel = this.panel
    const audio = panel.container.querySelector('#audio')
    state.hasAudio = audio.checked
    const hasAudio = state.hasAudio

    if (hasAudio) {
      localStorage.removeItem('AUDIO_OFF')
    } else {
      localStorage.setItem('AUDIO_OFF', true)
    }
    console.log('_hasAudio: ', hasAudio)

    // Return to open view
    state.view = 'OPEN'
    console.log('_resumeChat')
    panel.update(state)
    panel.container.focus()
  }

  _mergeMessages (batch) {
    // Create array of message objects
    const messages = []
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

    // Merge with existing messafes
    this.state.messages = messages.concat(this.state.messages)
  }

  _sendMessage (e) {
    console.log('_sendMessage')

    // Do we need to check here?
    const message = document.getElementById('message')    

    if (!(message && message.value.length)) {
      return
    }

    // *** Bug: Some times this results in inconsitent data error?
    try {
      this.thread.sendTextMessage(message.value.trim())
    } catch (err) {
      console.log(err)
    }
  }

  _resetTimeout () {
    // Return if not set
    if (Config.timeout <= 0) {
      return
    }

    // Clear existing timeout
    clearTimeout(this.timeout)
    clearInterval(this.countdown)

    // We don't have an open thread
    const status = this.state.status
    const view = this.state.view
    if (!status || status === 'closed' || view === 'TIMEOUT') {
      console.log('Timeout stopped...')
      return
    }
    
    // Remove timeout cancel button
    const container = this.panel.container
    if (container) {
      const timeout = container.querySelector('[data-wc-timeout]')
      if (timeout) {
        timeout.remove()
      }
    }

    // Restart timeout
    console.log('Timeout started...')
    this.timeout = setTimeout(this._handleTimeout.bind(this), Config.timeout * 1000)
  }

  _download () {
    console.log('download')

    // Need to test for accessibility of this approach
    const messages = this.state.messages
    const transcript = new Transcript(messages)
    const data = transcript.data
    const anchor = document.createElement('a')
    anchor.className = 'govuk-visually-hidden'
    anchor.setAttribute('href', data)
    anchor.setAttribute('download', 'transcript.txt')
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  _alertAT (text) {
    // Get referecne to live element
    const el = document.querySelector('[data-wc-panel-live], [data-wc-availability-live]')
    el.innerHTML = `<p>${text}</p>`
    setTimeout(() => { el.innerHTML = '' }, 1000)
  }

  //
  // Event handlers
  //

  // _handleConsumerAuthorizedEvent (e) {
  //   console.log('_handleConsumerAuthorizedEvent')
  // }

  _handleReadyEvent (e) {
    console.log('_handleReadyEvent')

    // Start/reset timeout
    this._resetTimeout()

    // Poll availability
    let isInit = true
    const interval = Config.poll > 0 ? Config.poll * 1000 : 0
    const state = this.state
    const panel = this.panel
    const availability = this.availability

    Utils.poll({
      fn: async () => {
        console.log('Polling availability')
        state.availability = await Utils.getAvailability()

        // Set view
        if (state.view !== 'OPEN') {
          state.view = state.availability === 'AVAILABLE' ? 'PRECHAT' : 'UNAVAILABLE'
        }

        // Update panel on page load only
        if (isInit) {
          panel.update(state)
        }

        // Update availability on each poll
        availability.update(state)
        availability.scroll(state)

        // Remove init flag
        isInit = false
      },
      interval: interval
    }) 
  }

  _handleContactStatusChangedEvent (e) {
    console.log('_handleContactStatusChangedEvent', e.detail.data.case.status)

    // Currently only responding to a closed case
    const state = this.state
    state.status = e.detail.data.case.status
    const panel = this.panel

    // Instigated by adviser
    if (state.status === 'closed' && state.view === 'OPEN') {
      panel.updateHeader(state)

      // Alert assistive technology
      const el = document.querySelector('[data-wc-status]')
      const text = el ? el.innerHTML : ''
      this._alertAT(text)

      // Start/reset timeout
      this._resetTimeout()
    }
  }

  _handleAssignedAgentChangedEvent (e) {
    console.log('_handleAssignedAgentChangedEvent')

    const assignee = e.detail.data.inboxAssignee
    const state = this.state
    state.assignee = assignee ? assignee.nickname || assignee.firstName : null

    // ***Limitation: Adviser availability doesn't fire an event in the SDK
    if (assignee && state.availability !== 'AVAILABLE') {
      state.availability = 'AVAILABLE'
    }

    // Update header
    if (state.view === 'OPEN') {
      const panel = this.panel
      panel.updateHeader(state)
    }

    // Alert assistive technology
    const el = document.querySelector('[data-wc-status]')
    const text = el ? el.innerHTML : ''
    this._alertAT(text)
  }

  async _handleLivechatRecoveredEvent (e) {
    console.log('_handleLivechatRecoveredEvent', e)

    // Set thread status
    const state = this.state
    const status = e.detail.data.contact.status
    state.status = status

    // Calculate elapsed time
    let messages = e.detail.data.messages
    const timeout = Config.timeout
    const countdown = Config.countdown
    const latestDatetime = new Date(messages[0].createdAt)
    const elapsed = Math.abs((new Date()) - latestDatetime) / 1000
    const isExpired = timeout > 0 && (timeout + countdown) - elapsed <= 0

    // End chat if elapsed time outside allowance
    if (isExpired) {
      localStorage.removeItem('THREAD_ID')
      state.view = 'TIMEOUT'
      if (state.status !== 'closed') {
        // *** Bug: Promise is void, why?
        this.thread.endChat()
      }

      // Ready
      document.dispatchEvent(this.livechatReady)
      return
    }

    // Set assignee and unseen message count
    const assignee = e.detail.data.inboxAssignee
    state.assignee = assignee ? assignee.nickname || assignee.firstName : null
    const unseen = e.detail.data.thread.unseenByEndUserMessagesCount || 0
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
    state.messages = [...new Map(state.messages.map(m => [m.id, m])).values()]

    // Sort on date
    state.messages = Utils.sortMessages(state.messages)

    // Add html to message objects
    state.messages = Utils.addMessagesHtml(state.messages)
    
    // Ready
    document.dispatchEvent(this.livechatReady)
  }

  _handleContactCreatedEvent (e) {
    console.log('_handleContactCreatedEvent')
  }

  _handleMessageCreatedEvent (e) {
    console.log('_handleMessageCreatedEvent', this.state)

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
    state.messages.push(message)

    // Add html to messages
    state.messages = Utils.addMessagesHtml(state.messages)

    // Update unseen count
    if (direction === 'outbound' && !state.isOpen) {
      state.unseen += 1
      this.availability.update(state)
      this.availability.scroll(state)

      // Alert assistive technology
      const text = `${state.unseen} new message${state.unseen > 1 ? 's' : ''}`
      this._alertAT(text)
    }

    // Clear input
    const textbox = document.querySelector('[data-wc-textbox]')
    if (textbox && direction === 'inbound') {
      textbox.value = ''
      textbox.style.height = 'auto'
      const event = new Event('change')
      textbox.dispatchEvent(event)
    }

    // Update messages
    const panel = this.panel
    if (state.view === 'START') {
      // Update panel if new question
      state.view = 'OPEN'
      panel.update(state)

      // Alert assistive technology
      // const el = document.querySelector('[data-wc-status]')
      // const text = el ? el.innerHTML : ''
      // this._alertAT(text)

      // Set focus to panel
      panel.container.focus()

    } else if (state.view === 'OPEN' && state.isOpen) {
      // Add message if existing thread
      panel.addMessage(message, state.messages.length)

      // Mark as seen
      if (this.thread) {
        this.thread.lastMessageSeen()
      }

      // Alert assistive technology
      const author = message.direction === 'outbound' ? message.assignee : 'You'
      const text = `${author} said: ${message.text}`
      this._alertAT(text)

      // Set focus to message field
      const el = document.getElementById('message')
      if (el && direction === 'inbound') {
        el.focus()
      }
    }

    // Play notification sound
    if (state.hasAudio && direction === 'outbound') {
      const notification = this.notification
      notification.playSound()
    }

    // Start/reset timeout
    this._resetTimeout()
  }

  _handleAgentTypingEvent (e) {
    console.log('_handleAgentTypingEvent')

    // Event may fire when list is not available
    const list = document.querySelector('[data-wc-list]')
    if (!list) {
      return
    }

    // Reset timeout
    this._resetTimeout()

    // Toggle agent typing
    const panel = this.panel
    const isTyping = e.type === 'AgentTypingStarted'
    const name = e.detail.data.user.firstName
    panel.toggleAgentTyping(name, isTyping)

    // ***Limitation: Adviser availability doesn't fire an event in the SDK
    // ***Bug: CaseInboxAssigneeChanged/AssignedAgentChanged not always firing
    const state = this.state
    if (!state.assignee || state.availability !== 'AVAILABLE') {
      state.availability = 'AVAILABLE'
      state.assignee = name
      panel.updateHeader(state)

      // Alert assistive technology
      const el = document.querySelector('[data-wc-status]')
      const text = el ? el.innerHTML : ''
      this._alertAT(text)
    }

    // Alert assistive technology
    if (isTyping) {
      this._alertAT(`${name} is typing`)
    }
  }

  _handleMessageSeenByEndUserEvent (e) {
    console.log('_handleMessageSeenByEndUserEvent')
    
    // Clear unseen count
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
      // *** If we have the list but don't already have the timeout markup
      const list = container.querySelector('[data-wc-list]')
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
