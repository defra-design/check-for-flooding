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

  _updateMessagesLabel (total) {
    const body = this.body
    const label = `Conversation with ${total} message${total > 1 ? 's' : ''}`
    body.setAttribute('aria-label', label)
  }

  _scrollToLatest (isScroll) {
    if (!isScroll) {
      return
    }
    
    // Scroll to latest
    this.body.scrollTop = this.body.scrollHeight
  }

  create (state, addEvents) {
    const model = {
      ...state
    }

    document.body.insertAdjacentHTML('beforeend', env.render('webchat-panel.html', { model }))

    const container = document.querySelector('[data-wc]')
    const header = container.querySelector('[data-wc-header]')
    const body = container.querySelector('[data-wc-body]')
    const footer = container.querySelector('[data-wc-footer]')
    this.container = container
    this.header = header
    this.body = body
    this.footer = footer

    // Move focus to container and set inert
    container.focus()
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
        const textbox = e.target
        const label = textbox.previousElementSibling
        Utils.toggleLabel(label, null, textbox)
      }
    }, true)

    // Add panel events
    addEvents()
  }

  update (state, error) {   
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    // Update labelledyby
    this.container.setAttribute('aria-labelledyby', error ? 'wc-title wc-subtitle wc-error' : 'wc-title wc-subtitle')

    this.updateHeader(state)
    this.updateBody(state, error)
    this.updateFooter(state)
  }

  updateHeader (state) {  
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
      const total = state.messages.length
      this._updateMessagesLabel(total)
      this._scrollToLatest(state.isScroll)
    } else {
      body.removeAttribute('tabindex')
      body.removeAttribute('aria-label')
    }

    this._initComponents(body)
  }

  updateFooter (state) {  
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

  addMessage (state, message) {
    const list = this.container.querySelector('[data-wc-list]')
    if (!list) {
      return
    }

    list.insertAdjacentHTML('beforeend', message.html)

    // Update message label
    const total = state.messages.length
    this._updateMessagesLabel(total)

    // Scroll messages
    this._scrollToLatest(state.isScroll)
  }

  toggleAgentTyping (state, isTyping) {
    const list = this.body.querySelector('[data-wc-list]')
    if (!list) {
      return
    }
    
    // Add or remove elements from list
    const el = list.querySelector('[data-wc-agent-typing]')
    if (isTyping) {
      list.insertAdjacentHTML('beforeend', env.render('webchat-agent-typing.html', {
        model: {
          name: state.assignee
        }
      }))

      // Scroll to show new elements
      this._scrollToLatest(state.isScroll)

    } else if (el) {
      el.remove()
    }
  }

  toggleTimeout (state, hasTimeout) {
    const container = this.container
    const timeout = container.querySelector('[data-wc-timeout]')

    if (hasTimeout) {
      const list = container.querySelector('[data-wc-list]')

      // *** If we have the list but don't already have the timeout markup
      if (list && !timeout) {
        list.insertAdjacentHTML('afterend', `
          <div class="wc-timeout" data-wc-timeout>
            <div class="wc-timeout__inner">
              <div class="wc-timeout__message">Webchat will end in <span data-wc-countdown>${seconds} seconds</span></div>
            </div>
            <a href="#" class="wc-cancel-timeout-btn" data-wc-cancel-timeout>Continue webchat</a>
          </div>
        `)
        this._scrollToLatest(state.isScroll)

        // Clear timeout
        const clearBtn = container.querySelector('[data-wc-cancel-timeout]')
        clearBtn.addEventListener('click', e => {
          e.preventDefault()
          this._resetTimeout()
        })
      }
    } else if (timeout) {
      timeout.remove()
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
      closeBtn.hidden = state.isMobile && state.isBack
    }

    // Toggle textbox behaviour
    const textbox = container.querySelector('[data-wc-textbox]')
    if (textbox) {
      textbox.toggleAttribute('data-wc-enter-submit', !state.isMobile)
    }
  }
}

export default Panel
