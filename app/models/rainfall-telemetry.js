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
          dateTime: moment(item.dateTime).subtract(15, 'minutes').toDate(),
          value: Math.round(batchTotal * 100) / 100
        })
        batchTotal = 0
      }
    })
    this.dateTime = telemetry[0].dateTime
    this.latest1hr = hours[0].value
    this.latest6hr = hours.slice(0, 6).reduce((acc, obj) => { return acc + obj.value }, 0)
    this.latest24hr = hours.slice(0, 24).reduce((acc, obj) => { return acc + obj.value }, 0)
    this.quarterly = telemetry
    this.hourly = hours
    console.log(this.latest1hr, this.latest6hr, this.latest24hr)
  }
}
module.exports = RainfallTelemetry
