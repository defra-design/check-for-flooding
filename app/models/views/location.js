const moment = require('moment-timezone')
const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (place, banner, outlook, referrer) {
    const hasWarnings = banner.hasSevere || banner.hasWarnings || banner.hasAlerts
    this.place = place
    this.banner = banner
    this.outlook = outlook
    this.hasBack = !!referrer
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.hasWarnings = hasWarnings
    this.mapButtonText = hasWarnings ? 'View map of flood warnings and alerts' : 'View map'
    this.mapLayers = `mv,ts,tw,ta${banner.hasRemoved ? ',tr' : ''}`
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
