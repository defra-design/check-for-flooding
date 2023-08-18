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

  _initComponents (el) {
    // Initialise GOV.UK components
    const buttons = el.querySelectorAll('[data-module="govuk-button"]')
    for (let i = 0; i <= buttons.length; i++) {
      new Button(buttons[i]).init()
    }
    const characterCounts = el.querySelectorAll('[data-module="govuk-character-count"]')
    for (let i = 0; i <= characterCounts.length; i++) {
      new CharacterCount(characterCounts[i]).init()
    }
    // Initialise autoresize
    const textbox = el.querySelector('[data-wc-textbox]')
    if (textbox) {
      Utils.autosize(textbox)
    }
  }

  create (state, addEvents) {
    console.log('panel.create()')

    const model = {
      ...state
    }

    console.log(model)
    document.body.insertAdjacentHTML('beforeend', env.render('webchat-panel.html', { model }))

    const container = document.querySelector('[data-wc]')
    const inner = container.querySelector('[data-wc-inner]')
    const header = inner.querySelector('[data-wc-header]')
    const body = inner.querySelector('[data-wc-body]')
    const footer = inner.querySelector('[data-wc-footer]')
    this.container = container
    this.inner = inner
    this.header = header
    this.body = body
    this.footer = footer

    // Move focus to wc__inner and set inert
    inner.focus()
    Keyboard.toggleInert(container)

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

    // Add panel events
    addEvents()
  }

  update (state, error) {
    console.log('panel.updateAll()')
   
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    this.updateHeader(state)
    this.updateBody(state, error)
    this.updateFooter(state)
  }

  updateHeader (state) {
    console.log('panel.updateHeader()')
   
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    // Model
    const model = {
      ...state
    }

    const header = this.header
    header.innerHTML = env.render('webchat-header.html', { model })

    this._initComponents(header)
  }

  updateBody (state, error) {
    console.log('panel.updateBody()')
   
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    // Model
    const model = {
      ...state,
      error: error,
      timeout: this._timeout
    }

    const body = this.body
    body.innerHTML = env.render('webchat-body.html', { model })

    // Toggle body keyboard accessibility
    const isViewOpen = state.view === 'OPEN'
    if (isViewOpen) {
      body.tabIndex = 0
      const label = `Conversation with ${state.messages.length} message${state.messages.length > 1 ? 's' : ''}`
      body.setAttribute('aria-label', label)
      this.scrollToLatest()
    } else {
      body.removeAttribute('tabindex')
      body.removeAttribute('aria-label')
    }

    this._initComponents(body)
  }

  updateFooter (state) {
    console.log('panel.updateFooter()')
   
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    // Model
    const model = {
      ...state
    }

    const footer = this.footer
    footer.innerHTML = env.render('webchat-footer.html', { model })

    this._initComponents(footer)
  }

  addMessage (message) {
    const list = this.container.querySelector('[data-wc-list]')
    if (!list) {
      return
    }

    list.insertAdjacentHTML('beforeend', message.html)

    // Update live element
    const author = message.direction === 'outbound' ? message.assignee : 'You'
    const text = `${author} said: ${message.text}`
    this.alertAT(text)

    // Scroll messages
    this.scrollToLatest()
  }

  toggleAgentTyping (name, isTyping) {
    const list = this.body.querySelector('[data-wc-list]')
    if (!list) {
      return
    }
    
    // Add or remove elements from list
    const el = list.querySelector('[data-wc-agent-typing]')
    if (isTyping) {
      list.insertAdjacentHTML('beforeend', env.render('webchat-agent-typing.html', {
        model: {
          name: name
        }
      }))

      // Update live element
      this.alertAT(`${name} is typing`)

      // Scroll to show new elements
      this.scrollToLatest()

    } else if (el) {
      el.remove()
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

    // Toggle textbox behaviour
    const textbox = container.querySelector('[data-wc-textbox]')
    if (textbox) {
      textbox.toggleAttribute('data-wc-enter-submit', !state.isMobile)
    }
  }

  scrollToLatest () {
    // Scroll to latest
    this.body.scrollTop = this.body.scrollHeight
  }

  alertAT (text) {
    // Get referecne to live element
    const el = this.header.querySelector('[data-wc-live]')
    el.innerHTML = `<p>${text}</p>`
    setTimeout(() => { el.innerHTML = '' }, 1000)
  }
}

export default Panel
