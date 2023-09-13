const moment = require('moment-timezone')
const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (warnings, outlook, query, places, isPost = false) {
    this.warnings = warnings
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.outlook = outlook
    this.hasWarnings = warnings && warnings.hasActive
    this.mapButtonText = warnings && warnings.hasActive ? 'View map of flood warnings and alerts' : 'View map'
    this.mapLayers = `mv,ts,tw,ta${warnings && warnings.highestSeverity === 4 ? ',tr' : ''}`
    this.bingApiKey = bingApiKey
    // Search
    this.queryTerm = query ? query.term : null
    this.places = places
    // Results
    this.isSinglePlace = isPost && places.length === 1
    this.isMultipleMatch = isPost && places.length > 1
    this.isNoResults = isPost && !places.length
    // Errors
    this.isErrorEmpty = isPost && !query.term
    this.isErrorLocation = isPost && query.term && !places.length
    this.isErrorPostcode = isPost && places.length > 1 && (places.filter(place => place.type === 'postcode').length === places.length)
    this.isError = isPost ? (this.isErrorEmpty || this.isErrorLocation || this.isErrorPostcode) : false
  }
}
module.exports = ViewModel
