const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (valuesLatest, valuesRange, rangeEndDate, period) {
    // Set range end rounded down to latest completed 15 minute period
    const rangeEndDateRounded = moment(rangeEndDate).minute(Math.floor(moment(rangeEndDate).minute() / 15) * 15).second(0).milliseconds(0).toISOString()

    // Check if raw telemetry is minutes or hours
    const isMinutes = moment(valuesRange[0].dateTime).diff(moment(valuesRange[1].dateTime), 'minutes') <= 15

    // Set available periods
    const availablePeriods = ['hours']
    if (isMinutes) {
      availablePeriods.push('minutes')
    }

    // Extend telemetry upto latest interval, could be 15 or 60 minute intervals
    while (moment(valuesRange[0].dateTime).isBefore(rangeEndDateRounded)) {
      const nextDateTime = moment(valuesRange[0].dateTime).add(isMinutes ? 15 : 60, 'minutes').toDate()
      valuesRange.unshift({
        dateTime: nextDateTime,
        value: 0,
        isValid: false
      })
    }

    // If hourly requested and raw telemetry is minutes then batch data into hourly totals
    const batchedHours = []
    if (period === 'hours') {
      let batchTotal = 0
      valuesRange.forEach(item => {
        const minutes = moment(item.dateTime).minutes()
        batchTotal += item.value
        if (minutes === 15) {
          batchedHours.push({
            dateTime: moment(item.dateTime).add(45, 'minutes').toDate(),
            value: Math.round(batchTotal * 100) / 100,
            isValid: item.isValid
            // ...(!(new Date(latestDateTime).getTime() >= moment(item.dateTime).add(45, 'minutes').toDate().getTime()) && { isInComplete: true }),
            // ...(moment(item.dateTime).hour() === moment(latestDateTime).hour() && { isLatest: true })
          })
          batchTotal = 0
        }
      })
    }

    // Set readings
    let values
    if (period === 'hours') {
      values = isMinutes ? batchedHours : valuesRange
    } else {
      values = isMinutes ? valuesRange : []
    }

    // Set properties
    this.latestDateTime = valuesLatest[0].dateTime
    this.latest1hr = Math.round(valuesLatest.slice(0, isMinutes ? 4 : 1).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest6hr = Math.round(valuesLatest.slice(0, isMinutes ? 24 : 6).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.latest24hr = Math.round(valuesLatest.slice(0, isMinutes ? 96 : 24).reduce((acc, obj) => { return acc + obj.value }, 0) * 10) / 10
    this.period = period
    this.availablePeriods = availablePeriods
    this.values = values
  }
}
module.exports = RainfallTelemetry
