const moment = require('moment-timezone')

class ViewModel {
  constructor (warnings, outlook) {
    this.warnings = warnings
    this.warningsDate = `${moment().tz('Europe/London').format('h:mma')} on ${moment().tz('Europe/London').format('D MMMM YYYY')}`
    this.outlook = outlook
    this.hasWarnings = warnings.hasActive
  }
}
module.exports = ViewModel
