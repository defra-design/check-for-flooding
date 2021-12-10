const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (telemetry, period) {
    const latestDateTime = telemetry[0].dateTime
    // Check if raw telemetry is minutes or hours
    const isRawMinutes = moment(telemetry[0].dateTime).diff(moment(telemetry[1].dateTime), 'minutes') <= 15

    // Set available periods
    const availablePeriods = ['hours']
    if (isRawMinutes) {
      availablePeriods.push('minutes')
    }

    // Flag latest item
    telemetry[0].isLatest = true

    // Extend telemetry upto latest interval, could be 15 or 60 mins
    const minutes = isRawMinutes ? 15 : 60
    let nextDateTime = moment(telemetry[0].dateTime).add(minutes, 'minutes').toDate()
    do {
      telemetry.unshift({
        dateTime: nextDateTime,
        value: 0
      })
      nextDateTime = moment(telemetry[0].dateTime).add(minutes, 'minutes').toDate()
    } while (moment(nextDateTime).isBefore(moment()))

    // If hourly requested and raw telemetry is minutes then batch data into hourly totals
    const batchedHours = []
    if (period === 'hours') {
      let batchTotal = 0
      telemetry.forEach(item => {
        const minutes = moment(item.dateTime).minutes()
        batchTotal += item.value
        if (minutes === 15) {
          batchedHours.push({
            dateTime: moment(item.dateTime).add(45, 'minutes').toDate(),
            value: Math.round(batchTotal * 100) / 100,
            ...(!(new Date(latestDateTime).getTime() >= moment(item.dateTime).add(45, 'minutes').toDate().getTime()) && { isInComplete: true }),
            ...(moment(item.dateTime).hour() === moment(latestDateTime).hour() && { isLatest: true })
          })
          batchTotal = 0
        }
      })
    }

    // Set readings
    let values
    if (period === 'hours') {
      values = isRawMinutes ? batchedHours : telemetry
    } else {
      values = isRawMinutes ? telemetry : []
    }

    // Set properties
    this.latestDateTime = latestDateTime
    this.latest1hr = Math.round(telemetry.slice(0, isRawMinutes ? 4 : 1).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest6hr = Math.round(telemetry.slice(0, isRawMinutes ? 24 : 6).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest24hr = Math.round(telemetry.slice(0, isRawMinutes ? 96 : 24).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.period = period
    this.availablePeriods = availablePeriods
    this.values = values
  }
}
module.exports = RainfallTelemetry
