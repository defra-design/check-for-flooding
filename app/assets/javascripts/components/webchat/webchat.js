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

    // Reinstate html visiblity (avoid refresh flicker)
    const body = document.body
    if (body.classList.contains('wc-hidden')) {
      body.classList.remove('wc-hidden')
      body.classList.add('wc-body')
    }

    // Render availability content
    const state = this.state
    this.availability.update(state)
    
    // Render panel if #webchat exists
    if (state.isOpen) {
      const panel = this.panel
      panel.create(state, this._addButtonEvents.bind(this))
      panel.update(state)
    }

    // Attach sticky footer scroll event
    document.addEventListener('scroll', this._handleScrollEvent.bind(this))
    this._handleScrollEvent()

    // Attach custom 'ready' event listener
    this.livechatReady = new CustomEvent('livechatReady', {})
    document.addEventListener('livechatReady', this._handleReadyEvent.bind(this))
    
    if (state.hasThread) {
      // Recover thread
      this._recoverThread()
    } else {
      // Dispatch ready event
      document.dispatchEvent(this.livechatReady)
    }
  }

  async _authorise () {
    // New SDK instance
    const sdk = new ChatSdk({
      brandId: process.env.CXONE_BRANDID,
      channelId: process.env.CXONE_CHANNELID,
      customerId: localStorage.getItem('CUSTOMER_ID') || '',
      environment: EnvironmentName.EU1
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
    state.availability = isOnline ? 'AVAILABLE' : 'OFFLINE'

    // Add sdk event listeners
    sdk.onChatEvent(ChatEvent.CONSUMER_AUTHORIZED, this._handleConsumerAuthorizedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.LIVECHAT_RECOVERED, this._handleLivechatRecoveredEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CASE_CREATED, this._handleCaseCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.CASE_STATUS_CHANGED, this._handleCaseStatusChangedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.ASSIGNED_AGENT_CHANGED, this._handleAssignedAgentChangedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.MESSAGE_CREATED, this._handleMessageCreatedEvent.bind(this))
    sdk.onChatEvent(ChatEvent.AGENT_TYPING_STARTED, this._handleAgentTypingEvent.bind(this))
    sdk.onChatEvent(ChatEvent.AGENT_TYPING_ENDED, this._handleAgentTypingEvent.bind(this))
    sdk.onChatEvent(ChatEvent.MESSAGE_SEEN_BY_END_USER, this._handleMessageSeenByEndUserEvent.bind(this))

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
      threadId = Utils.generateThreadId()
      localStorage.setItem('THREAD_ID', threadId)
    }
    const thread = await this.sdk.getThread(threadId)
    this.thread = thread
    this.state.hasThread = true
  }

  async _startChat (name, question) {
    // Authorise user
    if (!this.state.isAuthorised) {
      await this._authorise()
    }

    // *** Todo: Check availability again before sending message
    console.log('_startChat: ', this.state.availability)

    // *** Set userName. SDK issue where populates last name from string after last space 
    this.sdk.getCustomer().setName(name)

    // Start chat
    await this._getThread()
    try {
      this.thread.startChat(question)
    } catch (err) {
      console.log(err)
    }

    // Update panel attributes
    this.panel.setAttributes(this.state)
  }

  _addButtonEvents () {
    // Button events
    const container = this.panel.container
    container.addEventListener('click', e => {
      if (e.target.hasAttribute('data-wc-back-btn')) {
        e.preventDefault()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-close-btn')) {
        e.preventDefault()
        this._closeChat(e)
      }
      if (e.target.hasAttribute('data-wc-continue-btn')) {
        e.preventDefault()
        this._continue(e)
      }
      if (e.target.hasAttribute('data-wc-prechat-back-btn')) {
        e.preventDefault()
        this._prechat(e)
      }
      if (e.target.hasAttribute('data-wc-submit-btn')) {
        e.preventDefault()
        this._validatePrechat(this._startChat.bind(this))
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
      if (e.target.hasAttribute('data-wc-audio-btn')) {
        e.preventDefault()
        this._toggleAudio(e.target)
      }
      if (e.target.hasAttribute('data-wc-error-summary-link')) {
        e.preventDefault()
        const id = e.target.href.slice(e.target.href.indexOf('#') + 1)
        document.getElementById(id).focus()
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
    
    const list = document.querySelector('[data-wc-message-list]')
    if (!list) {
      return
    }

    // Remove group meta
    const messages = this.messages
    const len = messages.length
    const message = messages[len - 1]
    const isAddition = len > 1 && messages[len - 2].direction === message.direction

    if (isAddition) {
      list.querySelector('li:last-child [data-wc-item-meta]').remove()
    }

    // Add new item
    list.insertAdjacentHTML('beforeend', message.html)

    // Scroll messages
    this.panel.scrollToLatest()

    // Mark as seen
    if (this.thread) {
      this.thread.lastMessageSeen()
    }
  }

  _validatePrechat (successCb) {
    const name = document.getElementById('name').value
    const question = document.getElementById('question').value

    // Validation error
    if (!(name.length && question.length >= 2 && question.length <= 500)) {
      const error = {
        name: name,
        question: question,
        nameEmpty: name.length < 2,
        questionEmpty: question.length === 0,
        questionExceeded: question.length > 500
      }
      this.panel.update(this.state, null, error)

      // Move focus to error summary
      const summary = this.panel.container.querySelector('[data-wc-error-summary]')
      summary.focus()
      return
    }

    successCb(name, question)
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
      panel.create(state, this._addButtonEvents.bind(this))
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

    // Conditionaly reset view
    if (state.view === 'TIMEOUT') {
      state.view = 'PRECHAT'
    }

    // Reset timeout
    if (this.timeout) {
      this._resetTimeout()
    }

    const isBtn = e instanceof PointerEvent || e instanceof MouseEvent || e instanceof KeyboardEvent
    const panel = this.panel

    if (isBtn && state.isBack) {
      // History back
      state.back()
    } else if (panel.container) {
      // Remove panel
      panel.setAttributes(state)
      panel.container = panel.container.remove()
      state.replaceState()
      this._handleScrollEvent(e)
    }

    // Update availability link content
    this.availability.update(state)
  }

  _timeoutChat() {
    console.log('_timeoutChat')

    // Close thread
    localStorage.removeItem('THREAD_ID')
    this.messages = []

    // Show timeout view
    const state = this.state
    state.view = 'TIMEOUT'
    this.panel.update(state)

    // Clear timeout
    this._resetTimeout()

    // End thread if still open
    const status = state.status
    if (status && status !== 'closed') {
      // *** SDK bug? Doesn't return a promise and doesn't fire event on remote
      this.thread.endChat()
    }

    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _confirmEndChat () {
    console.log('_confirmEndChat')
  
    // Close thread
    localStorage.removeItem('THREAD_ID')
    this.messages = []

    // Show feedback view
    const state = this.state
    state.view = 'FEEDBACK'
    this.panel.update(state)

    // Clear timeout
    this._resetTimeout()

    // End thread if still open
    const status = state.status
    if (status && status !== 'closed') {
      // *** SDK bug? Doesn't return a promise and doesn't fire event on remote
      this.thread.endChat()
    }
    
    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
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

  _feedback () {
    const state = this.state
    state.view = 'FEEDBACK'
    this.panel.update(state)
    
    // Dont persist view, set to prechat
    state.view = 'PRECHAT'
  }

  _submitFeedback () {
    const state = this.state
    state.view = 'FINISH'
    this.panel.update(state)
    
    // Dont persist view, set to prechat
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
    // Create message model
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
    this.messages = messages.concat(this.messages)
  }

  _sendMessage (e) {
    console.log('_sendMessage')

    // Do we need to check here?
    const message = document.getElementById('message')    
    if (!(message && message.textContent.length)) {
      return
    }

    // *** Some times this results in inconsitent data error?
    try {
      this.thread.sendTextMessage(message.innerText.trim())
    } catch (err) {
      console.log(err)
    }
  }

  _resetTimeout () {
    // Return if not set
    if (!Config.timeout > 0) {
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
    console.log('state.view: ', this.state.view)

    // Start/reset timeout
    this._resetTimeout()

    // Reusable logic
    const update = (isPageLoad) => {
      const state = this.state
      this.availability.update(state)
      const panel = this.panel
      if (isPageLoad) {
        panel.update(state, this.messages)
      } else {
        panel.setStatus(state)
      }
    }

    // Poll availability
    let isPageLoad = true
    const interval = Config.poll > 0 ? Config.poll * 1000 : 0
    Utils.poll({
      fn: () => {
        fetch(Config.availabilityEndPoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        .then(res => {
          if (res.ok) {
            res.json().then(json => {
              console.log('Polling availability')
              this.state.availability = json.isAvailable ? 'AVAILABLE' : 'OFFLINE'
              update(isPageLoad)
              this._handleScrollEvent()
              isPageLoad = false
            })
          } else {
            return res.text().then(text => {
              throw new Error(text)
            })
          }
        })
        .catch(err => {
          console.log('Polling error ', err)
          this.state.availability = 'OFFLINE'
          update(isPageLoad)
          isPageLoad = false
        })
      },
      interval: interval
    }) 
  }

  _handleCaseStatusChangedEvent (e) {
    console.log('_handleCaseStatusChangedEvent')

    //  *** Not triggering on Heroku?

    // Currently only responding to a closed case
    const state = this.state
    state.status = e.detail.data.case.status

    // Instigated by adviser
    if (state.status === 'closed' && state.view === 'OPEN') {
      this.panel.setStatus(state)

      // Start/reset timeout
      this._resetTimeout()
    }
  }

  _handleAssignedAgentChangedEvent (e) {
    console.log('_handleAssignedAgentChangedEvent')

    const assignee = e.detail.data.inboxAssignee
    const state = this.state
    state.assignee = assignee ? assignee.firstName : null
    this.panel.setStatus(state)
  }

  async _handleLivechatRecoveredEvent (e) {
    console.log('_handleLivechatRecoveredEvent')

    // Set thread status
    const state = this.state
    const status = e.detail.data.consumerContact.status
    state.status = status

    // Calculate elapsed time
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
        // *** SDK bug? Doesn't return a promise? Doesn't fire event on Heroku?
        this.thread.endChat()
      }

      // Ready
      document.dispatchEvent(this.livechatReady)
      return
    }

    // Set assignee and unseen message count
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

    // Add html to message objects
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
      this._handleScrollEvent()
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

    // Event may fire when list is not available
    const list = document.querySelector('[data-wc-message-list]')
    if (!list) {
      return
    }

    // Reset timeout
    this._resetTimeout()

    // Add or remove elements from list
    const el = list.querySelector('[data-wc-agent-typing]')
    const isTyping = e.type === 'AgentTypingStarted'
    const agentName = e.detail.data.user.firstName
    if (isTyping) {
      list.insertAdjacentHTML('beforeend', `
        <li class="wc-list__item wc-list__item--outbound" data-wc-agent-typing>
          <div class="wc-list__item-inner"><svg width="28" height="16" x="0px" y="0px" viewBox="0 0 28 16"><circle stroke="none" cx="3" cy="8" r="3" fill="currentColor"></circle><circle stroke="none" cx="14" cy="8" r="3" fill="currentColor"></circle><circle stroke="none" cx="25" cy="8" r="3" fill="currentColor"></circle></svg></div>
          <span class="wc-list__item-meta">${agentName} is typing</span>
        </li>
      `)
      const panel = this.panel

      // Scroll to show new elements
      panel.scrollToLatest()
    } else if (el) {
      el.remove()
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
    // Return if we dont have the availability link
    const container = this.availability.container
    const link = container.querySelector('[data-wc-link]')
    if (!link) {
      return
    }

    // Calculate offset
    const rect = container.getBoundingClientRect()
    const isBelowFold = rect.top + 35 > (window.innerHeight || document.documentElement.clientHeight)

    // Toggle static/sticky display
    const state = this.state
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
