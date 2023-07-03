'use strict'

import { Button, CharacterCount } from 'govuk-frontend'
import Utils from './utils'
import Config from './config'

const env = window.nunjucks.configure('views')

class Panel {
  constructor () {
    this._container = null
    this._timeout = Utils.getDuration(Config.timeout)
  }

  create (state, addEvents) {
    console.log('panel.create()')

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
    const content = container.querySelector('[data-wc-inner]')

    const model = { ...state }
    content.innerHTML = env.render('webchat-panel.html', { model })
    this.container = container

    Utils.listenForDevice('mobile', this.setAttributes.bind(this, state))

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
        textbox.innerText = text
        Utils.toggleLabel(label, 'v', textbox)
      }
    }, true)

    // Add panel events
    addEvents()
  }

  update (state, messages, error) {
    console.log('panel.update()')
   
    // Update content
    const container = document.getElementById('wc-panel')
    if (!container) {
      return
    }

    // Model
    const model = {
      model: {
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
    }

    // Update panel
    const content = container.querySelector('[data-wc-inner]')
    content.innerHTML = env.render('webchat-panel.html', model)

    // Update status
    this.setStatus(state)

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
    this.scrollToLatest()
  }

  setAttributes (state) {
    const container = this.container
    if (!container) {
      return
    }

    const isFullscreen = state.isMobile && state.isOpen
    const root = document.getElementsByTagName('html')[0]
    root.classList.toggle('wc-html', isFullscreen)
    const body = document.body
    body.classList.toggle('wc-body', isFullscreen)
    container.setAttribute('aria-modal', true)

    const textbox = container.querySelector('[data-wc-textbox]')
    if (textbox) {
      textbox.setAttribute('aria-multiline', state.isMobile)
    }
  }

  setStatus (state) {
    console.log('panel.setStatus()')

    // Update continue
    const continueChat = document.querySelector('[data-wc-continue-chat]')
    if (continueChat) {
      continueChat.innerHTML = env.render('webchat-continue.html', {
        model: { availability: state.availability }
      })
    }
    // Update request
    const requestChat = document.querySelector('[data-wc-request-chat]')
    if (requestChat) {
      requestChat.innerHTML = env.render('webchat-request.html', {
        model: { availability: state.availability }
      })
    }
    // Update status
    const status = document.querySelector('[data-wc-status]')
    if (status) {
      status.innerHTML = env.render('webchat-status.html', {
        model: {
          availability: state.availability,
          assignee: state.assignee,
          status: state.status
        }
      })
    }
  }

  scrollToLatest () {
    // Scroll to latest
    const body = this.container.querySelector('[data-wc-body]')
    if (body) {
      body.scrollTop = body.scrollHeight
    }
  }
}

export default Panel
