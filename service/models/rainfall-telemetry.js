const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (recent, range, dataStart, dataEnd, rangeStart, rangeEnd) {
    // Get duration of values
    const valueDuration = moment(recent[0].dateTime).diff(moment(recent[1].dateTime), 'minutes')
    const isMinutes = valueDuration === 15

    // Get latest reading and latest hour
    const latestDateTime = recent[0].dateTime
    const latestHourDateTime = moment(latestDateTime).add(45, 'minutes').minutes(0).seconds(0).milliseconds(0).toDate()

    // Extend telemetry upto latest interval, could be 15 or 60 minute intervals
    const hours = []
    if (range.length) {
      while (moment(range[0].dateTime).isSameOrBefore(rangeEnd)) {
        const nextDateTime = moment(range[0].dateTime).add(valueDuration, 'minutes').toDate()
        range.unshift({
          dateTime: nextDateTime,
          value: 0
        })
      }

      // If hourly requested and raw telemetry is in minutes then batch data into hourly totals
      if (isMinutes) {
        let batchTotal = 0
        range.forEach(item => {
          const minutes = moment(item.dateTime).minutes()
          batchTotal += item.value
          if (minutes === 15) {
            const batchDateTime = moment(item.dateTime).add(45, 'minutes').toDate()
            hours.push({
              dateTime: batchDateTime,
              value: Math.round(batchTotal * 100) / 100
            })
            batchTotal = 0
          }
        })
      }
    }

    // Set properties
    this.latestDateTime = recent[0].dateTime
    this.rangeStartDateTime = rangeStart.toISOString().replace(/.\d+Z$/g, 'Z')
    this.rangeEndDateTime = rangeEnd.toISOString().replace(/.\d+Z$/g, 'Z')
    this.dataStartDateTime = dataStart.toISOString().replace(/.\d+Z$/g, 'Z')
    this.dataEndDateTime = dataEnd.toISOString().replace(/.\d+Z$/g, 'Z')
    this.latest1hr = Math.round(recent.slice(0, isMinutes ? 4 : 1).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest6hr = Math.round(recent.slice(0, isMinutes ? 24 : 6).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest24hr = Math.round(recent.slice(0, isMinutes ? 96 : 24).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    if (isMinutes) {
      this.minutes = {
        latestDateTime: latestDateTime,
        values: range
      }
    }
    this.hours = {
      latestDateTime: latestHourDateTime,
      values: isMinutes ? hours : range
    }
  }
}
module.exports = RainfallTelemetry
