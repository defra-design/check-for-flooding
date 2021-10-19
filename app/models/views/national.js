const moment = require('moment-timezone')
const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (warnings, outlook) {
    this.warnings = warnings
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.outlook = outlook
    this.hasWarnings = !!warnings.hasActive
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
