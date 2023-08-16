'use strict'

import { Button, CharacterCount } from 'govuk-frontend'
import Utils from './utils'
import Config from './config'
import Keyboard from './keyboard'

const env = window.nunjucks.configure('views')

class Panel {
  constructor () {
    this._container = null
    this._timeout = Utils.getDuration(Config.timeout)
  }

  create (state, addEvents) {
    console.log('panel.create()')

    const model = {
      isOpen: state.isOpen,
      view: state.view
    }
    document.body.insertAdjacentHTML('beforeend', env.render('webchat-panel.html', { model }))

    const container = document.querySelector('[data-wc]')
    const inner = container.querySelector('[data-wc-inner]')
    const header = inner.querySelector('[data-wc-header]')
    const status = inner.querySelector('[data-wc-status]')
    const statusMessage = inner.querySelector('[data-wc-status-message]')
    const body = inner.querySelector('[data-wc-body]')
    const content = inner.querySelector('[data-wc-content]')
    const list = inner.querySelector('[data-wc-list]')
    const footer = inner.querySelector('[data-wc-footer]')

    // Move focus to wc__inner and set inert
    inner.focus()
    Keyboard.toggleInert(container)

    this.container = container
    this.inner = inner
    this.header = header
    this.status = status
    this.statusMessage = statusMessage
    this.body = body
    this.content = content
    this.list = list
    this.footer = footer

    Utils.listenForDevice('mobile', this.setAttributes.bind(this, state))

    // Message events
    container.addEventListener('keyup', e => {
      if (e.target.hasAttribute('data-wc-textbox')) {
        const textbox = e.target
        const label = textbox.previousElementSibling
        // Conditionally show label
        Utils.toggleLabel(label, e.key, textbox)
        // Conditionally submit form
        Utils.submit(e, textbox)
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
      }
    })
    container.addEventListener('change', e => {
      if (e.target.hasAttribute('data-wc-textbox')) {
        console.log('change', e.target)
        const textbox = e.target
        const label = textbox.previousElementSibling
        Utils.toggleLabel(label, null, textbox)
      }
    }, true)
    container.addEventListener('paste', e => {
      console.log('paste: ', e)
      if (e.target.closest('div#message')) {
        e.preventDefault()
        const text = (e.clipboardData || window.clipboardData).getData('text')
        const textbox = document.getElementById('message')
        const label = textbox.previousElementSibling
        Utils.insertTextAtCaret(text)
        // textbox.innerText = text
        Utils.toggleLabel(label, 'v', textbox)
      }
    }, true)

    // Add panel events
    addEvents()
  }

  update (state, messages, error) {
    console.log('panel.update()')
   
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    // Model
    const model = {
      availability: state.availability,
      view: state.view,
      status: state.status,
      isOpen: state.isOpen,
      isBack: state.isBack,
      isMobile: state.isMobile,
      hasAudio: state.hasAudio,
      assignee: state.assignee,
      messages: messages,
      timeout: this._timeout,
      error: error
    }

    // Update panel
    this.header.innerHTML = env.render('webchat-header.html', { model })
    this.content.innerHTML = env.render('webchat-content.html', { model })
    this.footer.innerHTML = env.render('webchat-footer.html', { model })

    // Update body
    const isViewOpen = state.view === 'OPEN'
    this.content.toggleAttribute('hidden', isViewOpen)
    this.list.toggleAttribute('hidden', !isViewOpen)
    this.status.toggleAttribute('hidden', !isViewOpen)
    if (isViewOpen) {
      this.body.tabIndex = 0
      this.body.setAttribute('aria-label', 'Conversation')
    } else {
      this.body.removeAttribute('tabindex')
      this.body.removeAttribute('aria-label')
    }

    // Add messages
    if (isViewOpen && messages) {
      let items = ''
      for (let i = 0; i < messages.length; i++) {
        items += env.render('webchat-message.html', { model: messages[i] })
      }
      this.list.innerHTML = items
      this.scrollToLatest()
    }
    
    // Update status
    this.setStatus(state)

    // Initialise GOV.UK components
    const buttons = container.querySelectorAll('[data-module="govuk-button"]')
    for (let i = 0; i <= buttons.length; i++) {
      new Button(buttons[i]).init()
    }
    const characterCounts = container.querySelectorAll('[data-module="govuk-character-count"]')
    for (let i = 0; i <= characterCounts.length; i++) {
      new CharacterCount(characterCounts[i]).init()
    }

    // Initialise autoresize
    const textbox = container.querySelector('[data-wc-textbox]')
    if (textbox) {
      Utils.autosize(textbox)
    }
  }

  setAttributes (state) {
    const container = this.container
    if (!container) {
      return
    }

    const isFullscreen = state.isMobile && state.isOpen
    const root = document.getElementsByTagName('html')[0]
    root.classList.toggle('wc-html', isFullscreen)
    document.body.classList.toggle('wc-body', isFullscreen)
    container.setAttribute('aria-modal', true)

    const backBtn = container.querySelector('[data-wc-back-btn]')
    const hideBtn = container.querySelector('[data-wc-hide-btn]')
    const closeBtn = container.querySelector('[data-wc-close-btn]')

    if (backBtn) {
      backBtn.hidden = !isFullscreen
    }
    if (hideBtn) {
      hideBtn.hidden = isFullscreen
    }
    if (closeBtn) {
      closeBtn.hidden = isFullscreen
    }

    // Add header attributes
    this.header.classList.toggle('wc__header--open', state.view === 'OPEN')

    // Toggle textbox behaviour
    const textbox = container.querySelector('[data-wc-textbox]')
    if (textbox) {
      textbox.toggleAttribute('data-wc-enter-submit', !state.isMobile)
    }
  }

  setStatus (state) {
    console.log('panel.setStatus()')

    // Update continue and request chat buttons
    const continueBtn = document.querySelector('[data-wc-continue-chat], [data-wc-request-chat]')
    if (continueBtn) {
      continueBtn.innerHTML = env.render('webchat-continue.html', {
        model: {
          view: state.view,
          availability: state.availability
        }
      })
    }

    // Update status message
    const statusMessage = this.statusMessage
    let html = 'Connecting you to an adviser'
    if (state.availability === 'AVAILABLE') {
      if (state.status === 'closed') {
        html = 'Session ended'
      } else if (state.assignee) {
        html = `Speaking with ${state.assignee}`
      } else {
        html = 'Connecting you to an adviser'
      }
    } else if (state.availability === 'OFFLINE') {
      html = 'No advisers currently available'
    }
    statusMessage.innerHTML = html
  }

  scrollToLatest () {
    // Scroll to latest
    this.body.scrollTop = this.body.scrollHeight
  }
}

export default Panel
