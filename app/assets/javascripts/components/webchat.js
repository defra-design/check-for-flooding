'use strict'

const env = window.nunjucks.configure('views')

class WebChat {
  constructor (id) {
    this.addButton(id)
    this.createDOM()
  }

  addButton (id) {
    const container = document.getElementById(id)
    console.log(container)
    container.innerHTML = `
      <p class="govuk-body" style="display:none">Web chat currently offline</p>
      <button class="defra-webchat-start">
        <svg width="20" height="20" viewBox="0 0 20 20" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><ellipse cx="10.004" cy="10" rx="10" ry="8"/><path d="M4.18 13.168l4.328 3.505L2 19.965l2.18-6.797z"/><g fill="#fff"><circle cx="5.5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="14.5" cy="10" r="1.5"/></g></svg>
        Chat now
      </button>
    `
  }

  createDOM () {
    const container = document.createElement('div')
    container.className = 'defra-webchat'
    const inner = document.createElement('div')
    inner.className = 'defra-webchat__inner'
    container.appendChild(inner)
    const header = document.createElement('div')
    header.className = 'defra-webchat__header'
    const content = document.createElement('div')
    content.className = 'defra-webchat__content'
    const footer = document.createElement('div')
    footer.className = 'defra-webchat__footer'
    this.header = header
    this.content = content
    this.footer = footer
    inner.appendChild(header)
    inner.appendChild(content)
    inner.appendChild(footer)
    container.appendChild(inner)
    document.body.appendChild(container)
  }

  startChat () {
    this.header.innerHTML = env.render('webchat-header.html')
    this.footer.innerHTML = env.render('webchat-footer.html')
  }
}

export default WebChat
