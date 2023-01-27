'use strict'

import './build/templates'
import './components/nunjucks'
import WebChat from './components/webchat'

// Init GOVUK Frontend
document.onreadystatechange = () => {
  if (document.readyState === 'interactive') {
    window.GOVUKFrontend.initAll()
    // Webchat
    const webchat = new WebChat('webchat-button')
  }
}

// Math.log2 Polyfil
if (!Math.log2) {
  Math.log2 = (x) => {
    console.log('Using Math.log2')
    return Math.log(x) * Math.LOG2E
  }
}

// Element closest Polyfil
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector
}
if (!Element.prototype.closest) {
  Element.prototype.closest = (s) => {
    var el = this
    do {
      if (Element.prototype.matches.call(el, s)) return el
      el = el.parentElement || el.parentNode
    } while (el !== null && el.nodeType === 1)
    return null
  }
}

// Simplification algorythom
const douglasPeucker = (points, tolerance) => {
  const last = points.length - 1
  const p1 = points[0]
  const p2 = points[last]
  const x21 = p2.timestamp - p1.timestamp
  const y21 = p2.value - p1.value
  const [dMax, x] = points.slice(1, last)
    .map(p => Math.abs(y21 * p.timestamp - x21 * p.value + p2.timestamp * p1.value - p2.value * p1.timestamp))
    .reduce((p, c, i) => {
      const v = Math.max(p[0], c)
      return [v, v === p[0] ? p[1] : i + 1]
    }, [-1, 0])
  if (dMax > tolerance) {
    return [...douglasPeucker(points.slice(0, x + 1), tolerance), ...douglasPeucker(points.slice(x), tolerance).slice(1)]
  }
  return [points[0], points[last]]
}

// "flood" represents the global namespace for
// client-side javascript across all our pages
if (!window.flood) {
  window.flood = {}
}

// Flood utilities
window.flood.utils = {
  xhr: (url, callback, responseType) => {
    const xmlhttp = new window.XMLHttpRequest()
    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        // ie11 doesnt respect json responseType, parsing string instead
        const xmlhttpResponse = responseType === 'json' ? JSON.parse(xmlhttp.response) : xmlhttp.response
        try {
          callback(null, xmlhttpResponse)
        } catch (err) {
          callback(err)
        }
      }
    }
    xmlhttp.open('GET', url, true)
    // ie11 doesn't respect json responseType
    if (responseType !== 'json') xmlhttp.responseType = responseType
    xmlhttp.send()
  },
  forEach: (items, callback) => {
    for (let i = 0; i < items.length; i++) {
      callback.call(items, items[i], i)
    }
  },
  addOrUpdateParameter: (uri, key, value) => {
    // Temporariliy remove fragment
    const i = uri.indexOf('#')
    const hash = i === -1 ? '' : uri.substr(i)
    uri = i === -1 ? uri : uri.substr(0, i)
    const re = new RegExp('([?&])' + key + '=[^&#]*', 'i')
    // Delete parameter and value
    if (value === '') {
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
  },
  getParameterByName: (name) => {
    const v = window.location.search.match(new RegExp('(?:[?&]' + name + '=)([^&]+)'))
    return v ? v[1] : null
  },
  // Takes a valuesobject and concatentates items using commas and 'and'.
  getSummaryList: (values) => {
    const lines = []
    let summary = ''
    values.forEach((v, i) => {
      if (v.count) {
        lines.push(`${v.count} ${v.text}${v.count !== 1 ? 's' : ''}`)
      }
    })
    lines.forEach((l, i) => {
      summary += l + (i + 1 === lines.length - 1 ? ' and ' : i + 1 < lines.length ? ', ' : '')
    })
    return summary
  },
  // Takes a points collection and adds an isSignificant property to key points
  simplify: (points, tolerance) => {
    points = points.map(obj => ({ ...obj, timestamp: parseInt((new Date(obj.dateTime)).getTime()) }))
    const significant = douglasPeucker(points, tolerance)
    const result = points.map((obj, i) => ({
      dateTime: obj.dateTime,
      value: obj.value,
      type: obj.type,
      isSignificant: !!significant.find(x => x.timestamp === obj.timestamp)
    }))
    return result
  }
}
