const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (telemetry) {
    let batchTotal = 0
    let batchStartIndex = -1
    const hourly = []
    telemetry.reverse().forEach((item, index) => {
      // Determin start index
      if (batchStartIndex < 0 && moment(item.dateTime).minutes() === 15) {
        batchStartIndex = index
      }
      // Add up batch
      if (batchStartIndex >= 0) {
        batchTotal += item.value
      }
      // End batch
      if (moment(item.dateTime).minutes() === 0 || index === telemetry.length - 1) {
        hourly.push({
          dateTime: moment(item.dateTime),
          value: Math.round(batchTotal * 100) / 100
        })
        batchStartIndex = index
        batchTotal = 0
      }
    })
    this.quarterly = telemetry.reverse()
    this.hourly = hourly.reverse()
  }
}
module.exports = RainfallTelemetry
