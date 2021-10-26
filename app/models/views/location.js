const moment = require('moment-timezone')
const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (place, banner, outlook, referrer) {
    this.place = place
    this.banner = banner
    this.outlook = outlook
    this.hasBack = !!referrer
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.hasWarnings = banner.hasSevere || banner.hasWarnings || banner.hasAlerts
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
