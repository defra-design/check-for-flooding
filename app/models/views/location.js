const moment = require('moment-timezone')

class ViewModel {
  constructor (place, banner, outlook) {
    this.place = place
    this.banner = banner
    this.outlook = outlook
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.hasWarnings = banner.hasSevere || banner.hasWarnings || banner.hasAlerts
  }
}
module.exports = ViewModel
