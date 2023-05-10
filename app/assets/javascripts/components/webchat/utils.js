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
    const time = value.toLocaleString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true, hourCycle: 'h12' }).replace(' ', '')
    const date = value.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
    console.log(isToday ? time : `${time}, ${date}`)
    return isToday ? time : `${time}, ${date}`
  }
}

export default Utils
