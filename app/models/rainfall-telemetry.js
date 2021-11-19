const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (telemetry) {
    const latestDateTime = telemetry[0].dateTime
    this.latestDateTime = latestDateTime
    this.latest1hr = Math.round(telemetry.slice(0, 4).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest6hr = Math.round(telemetry.slice(0, 24).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest24hr = Math.round(telemetry.slice(0, 96).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    // Flag latest item
    telemetry[0].isLatest = true
    // Extend telemetry upto latest 15 minute interval
    let nextDateTime = moment(telemetry[0].dateTime).add(15, 'minutes').toDate()
    do {
      telemetry.unshift({
        dateTime: nextDateTime,
        value: 0
      })
      nextDateTime = moment(telemetry[0].dateTime).add(15, 'minutes').toDate()
    } while (moment(nextDateTime).isBefore(moment()))
    // Batch data into hourly totals
    const hours = []
    let batchTotal = 0
    telemetry.forEach(item => {
      const minutes = moment(item.dateTime).minutes()
      batchTotal += item.value
      if (minutes === 15) {
        hours.push({
          dateTime: moment(item.dateTime).add(45, 'minutes').toDate(),
          value: Math.round(batchTotal * 100) / 100,
          ...(!(new Date(latestDateTime).getTime() >= moment(item.dateTime).add(45, 'minutes').toDate().getTime()) && { isInComplete: true }),
          ...(moment(item.dateTime).hour() === moment(latestDateTime).hour() && { isLatest: true })
        })
        batchTotal = 0
      }
    })
    this.quarterly = telemetry
    this.hourly = hours
  }
}
module.exports = RainfallTelemetry
