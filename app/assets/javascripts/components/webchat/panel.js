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
      messages: state.messages,
      timeout: this._timeout,
      error: error
    }

    // Update panel
    this.header.innerHTML = env.render('webchat-header.html', { model })
    this.body.innerHTML = env.render('webchat-body.html', { model })
    this.footer.innerHTML = env.render('webchat-footer.html', { model })

    // Update body
    const isViewOpen = state.view === 'OPEN'
    if (isViewOpen) {
      this.body.tabIndex = 0
      this.body.setAttribute('aria-label', 'Conversation')
      this.scrollToLatest()
    } else {
      this.body.removeAttribute('tabindex')
      this.body.removeAttribute('aria-label')
    }

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

  alertAT (text) {
    // Get referecne to live element
    const el = this.header.querySelector('[data-wc-live]')
    el.innerHTML = `<p>${text}</p>`
    setTimeout(() => { el.innerHTML = '' }, 1000)
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
}

export default Panel
