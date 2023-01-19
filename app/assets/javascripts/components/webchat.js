'use strict'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { ChatSdk, EnvironmentName, Thread, ChatEvent, ChatEventData } from '@nice-devone/nice-cxone-chat-web-sdk'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor () {
    this.webchatSiblings = document.querySelectorAll('body > *:not(.defra-webchat):not(script):not([aria-hidden="true"])')
    this.initialise()
    window.addEventListener('popstate', this.#popstateEvent)
    // Conditionaly start chat
    if (window.location.hash === '#webchat') {
      this.startChat()
    }
  }

  async initialise () {
    // Authorise
    const sdk = new ChatSdk({
      brandId: process.env.WEBCHAT_BRANDID, // Your tenant ID, found in the script on the "Initialization & Test" page for the chat channel.
      channelId: process.env.WEBCHAT_CHANNELID, // Your channel ID, found in the script on the "Initialization & Test" page for the chat channel.
      customerId: localStorage.getItem('CUSTOMER_ID') || '', // This must be generated on every page visit and should be unique to each contact.
      environment: EnvironmentName.EU1 // Your environment's region: AU1, CA1, EU1, JP1, NA1, UK1, or custom.
    })
    this.sdk = sdk
    const authResponse = await sdk.authorize()
    const customerId = authResponse?.consumerIdentity.idOnExternalPlatform
    localStorage.setItem('CUSTOMER_ID', customerId || '')
    this.customerId = customerId
    // Add button
    this.isOnline = authResponse?.channel.availability.status === 'online'
    this.addButton()
    // Add events
    document.addEventListener('click', this.#clickEvent, { capture: true })
  }

  hideSiblings () {
    // Hide all modal siblings from screen readers
    this.webchatSiblings.forEach(webchatSibling => {
      webchatSibling.setAttribute('aria-hidden', 'true')
      webchatSibling.classList.add('defra-webchat-visibility-hidden')
    })
  }

  showSiblings () {
    // Re-instate aria-hidden elements
    this.webchatSiblings.forEach(webchatSibling => {
      webchatSibling.removeAttribute('aria-hidden')
      webchatSibling.classList.remove('defra-webchat-visibility-hidden')
    })
  }

  addButton () {
    const container = document.getElementById('webchat-button')
    if (this.isOnline) {
      container.innerHTML = `
        <button class="defra-webchat-start" data-webchat-start>
          <svg width="20" height="20" viewBox="0 0 20 20" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><ellipse cx="10.004" cy="10" rx="10" ry="8"/><path d="M4.18 13.168l4.328 3.505L2 19.965l2.18-6.797z"/><g fill="#fff"><circle cx="5.5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="14.5" cy="10" r="1.5"/></g></svg>
          Chat now
        </button>
      `
    } else {
      container.innerHTML = `
        <p class="govuk-body">Web chat currently offline</p>
      `
    }
  }

  createModal () {
    // Dialog
    const container = document.createElement('div')
    container.id = 'webchat'
    container.className = 'defra-webchat'
    container.setAttribute('role', 'dialog')
    container.setAttribute('aria-label', 'Webchat')
    container.setAttribute('aria-modal', true)
    container.setAttribute('open', true)
    const inner = document.createElement('div')
    inner.className = 'defra-webchat__inner'
    inner.tabIndex = -1
    container.appendChild(inner)
    // Sections
    const header = document.createElement('div')
    header.className = 'defra-webchat__header'
    header.innerHTML = env.render('webchat-header.html')
    const content = document.createElement('div')
    content.className = 'defra-webchat__content'
    const footer = document.createElement('div')
    footer.className = 'defra-webchat__footer'
    footer.innerHTML = env.render('webchat-footer.html')
    inner.appendChild(header)
    inner.appendChild(content)
    inner.appendChild(footer)
    container.appendChild(inner)
    document.body.appendChild(container)
    this.container = container
    this.inner = inner
    this.content = content
    this.header = header
    this.content = content
    this.footer = footer
  }

  openModal () {
    // Show modal
    this.createModal() // Could this be a template aswell?
    // Lock body scroll
    document.body.classList.add('defra-webchat-body')
    document.documentElement.classList.add('defra-webchat-html')
    this.hideSiblings()
    this.inner.focus()
    // disableBodyScroll(content)
  }

  async startChat () {
    this.openModal()
    // Add events
    window.addEventListener('keydown', this.#keydownEvent)
    window.addEventListener('keyup', this.#keyupEvent)
    console.log('Start chat: ', this.isOnline)
    // We don't yet know if 'online' authorisation still in prgoress
    // Get thread
    const thread = await this.sdk.getThread('thread')
    // Start chat if not previously started
    const threadId = localStorage.getItem('THREAD_ID') // Look for property in thread object instead
    if (!threadId) {
      await thread.startChat()
    }
    thread.onThreadEvent(ChatEvent.MESSAGE_CREATED, this.#messageCreatedEvent)
    // Add previous messages
    const recoveredData = await thread.recover()
    if (recoveredData) {
      this.content.innerHTML = env.render('webchat-content.html', {
        model: { messages: recoveredData.messages.reverse() }
      })
      // Scroll to bottom
      this.content.scrollTop = this.content.scrollHeight
    }
    this.thread = thread
  }

  endChat () {
    // History back
    console.log(window.history.state)
    if (window.history.state.isBack) {
      window.history.back()
      return
    }
    // Replace state
    const url = window.location.href.substring(0, window.location.href.indexOf('#'))
    window.history.replaceState({ path: null, isBack: false }, '', url)
    this.container.remove()
    // Unlock body scroll
    document.body.classList.remove('defra-webchat-body')
    document.documentElement.classList.remove('defra-webchat-html')
    // clearAllBodyScrollLocks()
    this.showSiblings()
    // Return focus
    const startChatButton = document.querySelector('#webchat-button button')
    if (startChatButton) startChatButton.focus()
    // Remove events
    document.removeEventListener('keydown', this.#keydownEvent)
    document.removeEventListener('keyup', this.#keyupEvent)
  }

  sendMessage (value) {
    this.thread.sendTextMessage(value)
  }

  addMessage (message) {
    const item = document.createElement('li')
    item.innerText = message.text
    item.className = `defra-webchat-list__item defra-webchat-list__item--${message.direction}`
    const list = this.content.querySelector('[data-message-list]')
    list.appendChild(item)
    // Scroll content to bottom
    this.content.scrollTop = this.content.scrollHeight
  }

  setInitialFocus () {
    if (!document.activeElement.closest(`#${this.container.id}`)) {
      this.inner.focus()
    }
  }

  constrainFocus (e) {
    const selectors = [
      'a[href]:not([disabled]):not([hidden])',
      'button:not([disabled]):not([hidden])',
      'textarea:not([disabled]):not([hidden])',
      'input[type="text"]:not([disabled]):not([hidden])',
      'input[type="radio"]:not([disabled]):not([hidden])',
      'input[type="checkbox"]:not([disabled]):not([hidden])',
      'select:not([disabled]):not([hidden])',
      '*[tabindex="0"]:not([disabled]):not([hidden])'
    ]
    const specificity = selectors.map(i => `#${this.container.id} ${i}`).join(',')
    const focusableEls = document.querySelectorAll(specificity)
    const firstFocusableEl = focusableEls[0]
    const lastFocusableEl = focusableEls[focusableEls.length - 1]
    // Tab and shift tab
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl || document.activeElement.getAttribute('tabindex') === '-1') {
        lastFocusableEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus()
        e.preventDefault()
      }
    }
  }

  //
  // Events
  //

  #clickEvent = (e) => {
    if (!['a', 'button'].includes(e.target.tagName.toLowerCase())) return
    console.log('Click on ', e.target)
    const isStartChatButton = e.target.hasAttribute('data-webchat-start')
    const isEndChatButton = e.target.hasAttribute('data-webchat-end')
    if (isStartChatButton) {
      this.startChat()
      // Push history state
      window.history.pushState({ path: '#webchat', isBack: true }, '', '#webchat')
    }
    if (isEndChatButton) {
      this.endChat()
    }
  }

  #keydownEvent = (e) => {
    document.activeElement.setAttribute('keyboard-focus', '')
    const isOpen = window.location.hash === '#webchat'
    if (!isOpen) return
    const isSendMessage = e.target.hasAttribute('data-webchat-message')
    if (e.key === 'Enter' && isSendMessage) {
      e.preventDefault()
    } else if (e.key === 'Tab') {
      this.setInitialFocus()
      this.constrainFocus(e)
    }
  }

  #keyupEvent = (e) => {
    document.activeElement.removeAttribute('keyboard-focus')
    const isOpen = window.location.hash === '#webchat'
    if (!isOpen) return
    const isSendMessageTextarea = e.target.hasAttribute('data-webchat-message')
    if (e.key === 'Enter' && isSendMessageTextarea) {
      this.sendMessage(e.target.value)
      e.target.value = ''
    }
    if (e.key === 'Escape') {
      this.endChat()
    }
  }

  // This fires when both user and agent send a message
  #messageCreatedEvent = (e) => {
    // Storing threadId so we know chat has started, may be a better way to determin this
    const threadId = e.detail.data.thread.idOnExternalPlatform
    localStorage.setItem('THREAD_ID', threadId)
    // Add message to modal
    const message = {
      text: e.detail.data.message.messageContent.text,
      direction: e.detail.data.message.direction.toLowerCase()
    }
    this.addMessage(message)
  }

  // Recreate webchat on browser history change
  #popstateEvent = (e) => {
    e.preventDefault()
    console.log(e.state)
    if (!e.state) return
    const path = window.history?.state?.path
    if (path === '#webchat') {
      this.startChat()
    } else {
      this.endChat()
    }
  }
}

export default WebChat
