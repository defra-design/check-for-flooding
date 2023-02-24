const moment = require('moment-timezone')
const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (warnings, outlook) {
    this.warnings = warnings
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.outlook = outlook
    this.hasWarnings = !!warnings.hasActive
    this.mapButtonText = warnings.hasActive ? 'View map of flood warnings and alerts' : 'View map'
    this.mapLayers = `mv,ts,tw,ta${warnings.highestSeverity === 4 ? ',tr' : ''}`
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
