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

  static convertLinks (input) {
    // const isValidHttpUrl = s => {
    //   let u
    //   try {u = new URL(s)}
    //   catch (_) {return false}
    //   return u.protocol.startsWith("http")
    // }
    // const m = t.match(/(?<=\s|^)[a-zA-Z0-9-:/]+\.[a-zA-Z0-9-].+?(?=[.,;:?!-]?(?:\s|$))/g)
    // if (!m) return t
    // const a = []
    // m.forEach(x => {
    //   const [t1, ...t2] = t.split(x)
    //   a.push(t1)
    //   t = t2.join(x)
    //   const y = (!(x.match(/:\/\//)) ? 'https://' : '') + x
    //   if (isNaN(x) && isValidHttpUrl(y)) 
    //     a.push('<a href="' + y + '" target="_blank">' + y.split('/')[2] + '</a>')
    //   else
    //     a.push(x)
    // })
    // a.push(t)
    // return a.join('')
    let text = input
    const linksFound = text.match(/(?:www|https?)[^\s]+/g)
    const aLink = []
    if (linksFound != null) {
      for (let i = 0; i < linksFound.length; i++) {
        let replace = linksFound[i]
        if (!(linksFound[i].match(/(http(s?)):\/\//))) {
          replace = `http://${linksFound[i]}`
        }
        aLink.push(`<a href="${replace}">${replace}</a>`)
        text = text.split(linksFound[i]).join(aLink[i])
      }
      return text
    }
    else {
      return input
    }
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

  static generateUUID () {
    let uuid
    if (crypto.randomUUID) {
      uuid = crypto.randomUUID()
    } else {
      uuid = Math.floor(Math.random() * 100000000).toString()
    }
    return uuid
  }

  static autosize (textarea, maxHeight) {
    const el = textarea
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
}

export default Utils
