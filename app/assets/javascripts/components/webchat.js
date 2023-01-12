'use strict'
import { ChatSdk, EnvironmentName, Thread, ChatEvent, ChatEventData } from '@nice-devone/nice-cxone-chat-web-sdk'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor () {
    this.init()
    document.addEventListener('click', this.#clickEvent, { capture: true })
  }

  async init () {
    // Authorise
    const sdk = new ChatSdk({
      brandId: process.env.WEBCHAT_BRANDID, // Your tenant ID, found in the script on the "Initialization & Test" page for the chat channel.
      channelId: process.env.WEBCHAT_CHANNELID, // Your channel ID, found in the script on the "Initialization & Test" page for the chat channel.
      customerId: localStorage.getItem('CUSTOMER_ID') || '', // This must be generated on every page visit and should be unique to each contact.
      environment: EnvironmentName.EU1 // Your environment's region: AU1, CA1, EU1, JP1, NA1, UK1, or custom.
    })
    const authResponse = await sdk.authorize()
    const customerId = authResponse?.consumerIdentity.idOnExternalPlatform
    localStorage.setItem('CUSTOMER_ID', customerId || '')
    this.sdk = sdk
    this.customerId = customerId
    // Add button
    const isOnline = authResponse?.channel.availability.status === 'online'
    const container = document.getElementById('webchat')
    if (isOnline) {
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
    // Get thread id
    // const newThreadId = `thread${Math.floor(Math.random() * 10000)}`
    // const threadId = localStorage.getItem('THREAD_ID' || newThreadId)
    // this.threadId = threadId
  }

  async getThread () {
    const thread = await sdk.getThread('thread-id')
  }

  createDOM () {
    const container = document.createElement('div')
    container.className = 'defra-webchat'
    const inner = document.createElement('div')
    inner.className = 'defra-webchat__inner'
    container.appendChild(inner)
    const header = document.createElement('div')
    header.className = 'defra-webchat__header'
    header.innerHTML = env.render('webchat-header.html')
    const content = document.createElement('div')
    content.className = 'defra-webchat__content'
    const footer = document.createElement('div')
    footer.className = 'defra-webchat__footer'
    footer.innerHTML = env.render('webchat-footer.html')
    this.header = header
    this.content = content
    this.footer = footer
    inner.appendChild(header)
    inner.appendChild(content)
    inner.appendChild(footer)
    container.appendChild(inner)
    document.body.appendChild(container)
    this.container = container
  }

  async startChat () {
    // const newThreadId = `thread${Math.floor(Math.random() * 10000)}`
    // const threadId = localStorage.getItem('THREAD_ID' || newThreadId)
    // const thread = await this.sdk.getThread(threadId)
    const thread = await this.sdk.getThread('thread-id')
    await thread.startChat()
    thread.sendTextMessage('Dans test message 4')
    console.log(thread)
    this.createDOM()

    thread.onThreadEvent(ChatEvent.MESSAGE_CREATED, (e) => {
      // Do something with the event
      const threadId = e.detail.data.message.threadId
      console.log(e.detail.data.message.threadId)
    })
  }

  endChat () {
    this.container.remove()
  }

  //
  // Events
  //

  // Click events
  #clickEvent = (e) => {
    const isStartChat = e.target.hasAttribute('data-webchat-start')
    const isEndChat = e.target.hasAttribute('data-webchat-end')
    if (isStartChat) {
      this.startChat()
    }
    if (isEndChat) {
      this.endChat()
    }
  }
}

export default WebChat
