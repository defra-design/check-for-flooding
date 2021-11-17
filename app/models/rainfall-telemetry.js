const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (telemetry) {
    // Batch data into hourly totals
    const hours = []
    let batchTime
    let batchTotal = 0
    let isBatch = false
    telemetry.forEach((item, index) => {
      const minutes = moment(item.dateTime).minutes()
      // Get batch time
      if (!isBatch && minutes === 0) {
        batchTime = item.dateTime
        isBatch = true
      }
      // Add up batch
      if (isBatch) {
        batchTotal += item.value
        if (minutes === 15) {
          // Finish batch
          hours.push({
            dateTime: batchTime,
            value: Math.round(batchTotal * 100) / 100
          })
          isBatch = false
          batchTotal = 0
        }
      }
    })
    this.quarterly = telemetry
    this.hourly = hours
  }
}
module.exports = RainfallTelemetry
