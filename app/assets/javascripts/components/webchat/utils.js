'use strict'

import Config from './config'

class Utils {
  static addOrUpdateParameter (uri, key, value) {
    // Temporariliy remove fragment
    const i = uri.indexOf('#')
    const hash = i === -1 ? '' : uri.substr(i)
    uri = i === -1 ? uri : uri.substr(0, i)
    const re = new RegExp('([?&])' + key + '=[^&#]*', 'i')
    // Delete parameter and value
    if (!value || value === '') {
      uri = uri.replace(re, '')
    } else if (re.test(uri)) {
      // Replace parameter value
      uri = uri.replace(re, '$1' + key + '=' + value)
      // Add parameter and value
    } else {
      const separator = /\?/.test(uri) ? '&' : '?'
      uri = uri + separator + key + '=' + value
    }
    return uri + hash
  }

  static getParameterByName (name) {
    const v = window.location.search.match(new RegExp('(?:[?&]' + name + '=)([^&]+)'))
    return v ? v[1] : null
  }

  static listenForDevice (device, callback) {
    const mQ = window.matchMedia(`(max-width: ${Config.getBreakpoint(device)})`)
    if (window.matchMedia.addEventListener) {
      mQ.addEventListener('change', e => { callback(e.matches) })
    } else {
      mQ.addListener(e => { callback(e.matches) })
    }
    callback(mQ.matches)
  }

  static formatDate (value) {
    const now = new Date().getTime()
    const startOfDay = now - (now % 86400000)
    const isToday = value.getTime() >= startOfDay
    let hours = value.getHours()
    let minutes = value.getMinutes()
    minutes = `${minutes < 10 ? '0' : ''}${minutes}`
    const ampm = hours >= 12 ? 'pm' : 'am'
    hours %= 12
    hours = hours || 12
    const time = `${hours}:${minutes}${ampm}`
    const date = value.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
    return isToday ? time : `${time}, ${date}`
  }

  static parseMessage (input) {
    let text = input

    // Convert line breaks
    text = text.trim().replace(/(\r\n|\r|\n){2,}/g, '$1\n').replace(/\r\n|\r|\n/g, '<br>')

    // Convert links
    const linksFound = text.match(/(?:www|https?)[^\s]+/g)
    const aLink = []
    if (linksFound != null) {
      for (let i = 0; i < linksFound.length; i++) {
        const href = linksFound[i]
        const anchor = linksFound[i].replace(/#webchat|https?:\/\//gi, '')
        aLink.push(`<a href="${href}">${anchor}</a>`)
        text = text.split(linksFound[i]).join(aLink[i])
      }
    }

    return text
  }

  static sortMessages (messages) {
    return messages.sort((a, b) => {
      return a.createdAt - b.createdAt
    })
  }

  static addGroupMeta (messages) {
    const m = messages
    for (let i = 0; i < m.length; i++) {
      const isGroup = (i === m.length - 1) || (i < (m.length - 1) && m[i].direction !== m[i + 1].direction)
      m[i].isGroup = isGroup
    }
    return m
  }

  static setCountdown (element, callback) {
    let second = Config.countdown
    const interval = setInterval(() => {
      second --
      if (element) {
        element.innerHTML = `${second} seconds`
      }
      if (second <= 0) {
          clearInterval(interval)
          callback()
      }
    }, 1000)
    return interval
  }

  static generateThreadId () {
    // let id
    // if (crypto.randomUUID) {
    //   id = crypto.randomUUID()
    // } else {
    //   id = Math.floor(Math.random() * 100000000).toString()
    // }
    const random =  Math.floor(Math.random() * 1000).toString()
    const time = (new Date()).getTime()
    return `${time}${random}`
  }

  static toggleLabel (label, key, textbox) {
    const chars = /^[a-zA-Z0-9- !'^+%&/()=?_\-~`;#$½{[\]}\\|<>@,]+$/i // /^[a-z\d -]+$/i
    const hasValue = textbox.textContent.length > 0
    const isValidChar = key.length === 1 && chars.test(key)
    const isHidden = hasValue || (!hasValue && isValidChar)
    label.classList.toggle('wc-message__label--hidden', isHidden)
  }

  static submit (e, textbox) {
    const form = textbox.closest('form')
    const isMultiline = textbox.getAttribute('aria-multiline') === 'true'
    if (e.key !== 'Enter' || isMultiline || e.altKey || e.shiftKey) {
      return
    }
    form.dispatchEvent(new Event('submit'))
  }

  static suppressEnter (e, textbox) {
    const isMultiline = textbox.getAttribute('aria-multiline') === 'true'
    const hasValue = textbox.textContent.length > 0
    if (e.key === 'Enter' && (!isMultiline && !e.altKey && !e.shiftKey || !hasValue)) {
      e.preventDefault()
    }
  }

  static autosize (textbox, maxHeight) {
    const el = textbox
    el.style.cssText = 'height:auto'
    if (el.scrollHeight >= maxHeight) {
      el.style.cssText = `overflow: auto; height: ${maxHeight}px`
      el.removeEventListener('keyup', this)
    } else {
      el.style.cssText = `height:${el.scrollHeight}px`
      // setTimeout(() => {
      //   el.style.cssText = 'height:auto'
      //   el.style.cssText = 'height:' + el.scrollHeight + 'px'
      // }, 0)
    }
  }
  // static iosSoftKeyboardOffset (state, container) {
  //   const acceptsKeyboardInput = (el) => { 
  //     return (
  //       el.tagName === 'INPUT' ||
  //       el.tagName === 'TEXTAREA' ||
  //       el.isContentEditable
  //     )
  //   }
  //   container.addEventListener('focus', e => {
  //     const isMobile = state.isMobile
  //     if (!isMobile || !acceptsKeyboardInput(e.target)) {
  //       return
  //     }
  //     document.body.setAttribute('data-keyboard-open', '')
  //     console.log('Keyboard showing: ', document.body.clientHeight, window.innerHeight, window.outerHeight)
  //   }, true)
  //   container.addEventListener('blur', e => {
  //     if (!document.body.hasAttribute('data-keyboard-open')) {
  //       return
  //     }
  //     document.body.removeAttribute('data-keyboard-open')
  //   }, true)
  // }
}

export default Utils
