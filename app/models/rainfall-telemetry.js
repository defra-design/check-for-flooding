const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (telemetry) {
    // Batch data into hourly totals
    const hours = []
    let batchTotal = 0
    telemetry.forEach(item => {
      const minutes = moment(item.dateTime).minutes()
      batchTotal += item.value
      if (minutes === 15) {
        hours.push({
          dateTime: moment(item.dateTime).add(45, 'minutes').toDate(),
          value: Math.round(batchTotal * 100) / 100
        })
        batchTotal = 0
      }
    })
    this.dateTime = telemetry[0].dateTime
    this.latest1hr = hours[0].value
    this.latest6hr = Math.round(hours.slice(0, 6).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest24hr = Math.round(hours.slice(0, 24).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.quarterly = telemetry
    this.hourly = hours
  }
}
module.exports = RainfallTelemetry
