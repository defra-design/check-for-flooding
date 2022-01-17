const moment = require('moment-timezone')

class RainfallTelemetry {
  constructor (valuesLatest, valuesRange, pageEndDate, period) {
    // Set how many days we want to restrict
    const dataRangeLimit = 5

    // Get latest reading and latest hour
    const latestDateTime = valuesLatest[0].dateTime
    const latestHourDateTime = moment(latestDateTime).add(45, 'minutes').minutes(0).seconds(0).milliseconds(0).toDate()

    // Get page range end rounded down to latest completed 15 minute period
    const pageEndDateRounded = moment(pageEndDate).minute(Math.floor(moment(pageEndDate).minute() / 15) * 15).second(0).milliseconds(0).toISOString()

    // Get duration of values
    const valueDuration = moment(valuesRange[0].dateTime).diff(moment(valuesRange[1].dateTime), 'minutes')
    const isMinutes = valueDuration === 15

    // Get available time periods, some data is hourly only
    const availablePeriods = ['hours']
    if (isMinutes) {
      availablePeriods.push('minutes')
    }

    // Add additional properties to values
    valuesRange.forEach(value => {
      value.isValid = true
      value.isLatest = value.dateTime === latestDateTime
    })

    // Extend telemetry upto latest interval, could be 15 or 60 minute intervals
    while (moment(valuesRange[0].dateTime).isBefore(pageEndDateRounded)) {
      const nextDateTime = moment(valuesRange[0].dateTime).add(valueDuration, 'minutes').toDate()
      valuesRange.unshift({
        dateTime: nextDateTime,
        value: 0,
        isValid: false,
        isLatest: false
      })
    }

    // If hourly requested and raw telemetry is in minutes then batch data into hourly totals
    const batchedHours = []
    if (period === 'hours') {
      let batchTotal = 0
      valuesRange.forEach(item => {
        const minutes = moment(item.dateTime).minutes()
        batchTotal += item.value
        if (minutes === 15) {
          const batchDateTime = moment(item.dateTime).add(45, 'minutes').toDate()
          batchedHours.push({
            dateTime: batchDateTime,
            value: Math.round(batchTotal * 100) / 100,
            isValid: item.isValid,
            isLatest: batchDateTime.getTime() === latestHourDateTime.getTime()
          })
          batchTotal = 0
        }
      })
    }

    // Set next/previous page dates
    const nowDateRounded = moment().minute(Math.floor(moment().minute() / 15) * 15).second(0).milliseconds(0)
    const dataStartDateRounded = moment(nowDateRounded.toDate()).subtract(dataRangeLimit, 'days')
    const startDate = valuesRange[valuesRange.length - 1].dateTime
    const endDate = valuesRange[0].dateTime
    const duration = moment.duration(moment(endDate).diff(startDate)).asMinutes()
    const pageNextStartDate = moment(endDate).add(valueDuration, 'minutes')
    const pageNextEndDate = moment(endDate).add(duration + valueDuration, 'minutes')
    const pagePreviousEndDate = moment(startDate).subtract(valueDuration, 'minutes')
    const pagePreviousStartDate = moment(startDate).subtract(duration + valueDuration, 'minutes')

    // Set values to hourly or minute readings
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
    // Format dates and set to null if page is invalid
    this.pageNextStartDateTime = pageNextStartDate <= nowDateRounded ? pageNextStartDate.toDate().toISOString().replace(/.\d+Z$/g, 'Z') : null
    this.pageNextEndDateTime = pageNextStartDate <= nowDateRounded ? pageNextEndDate.toDate().toISOString().replace(/.\d+Z$/g, 'Z') : null
    this.pagePreviousStartDateTime = pagePreviousEndDate > dataStartDateRounded ? pagePreviousStartDate.toDate().toISOString().replace(/.\d+Z$/g, 'Z') : null
    this.pagePreviousEndDateTime = pagePreviousEndDate > dataStartDateRounded ? pagePreviousEndDate.toDate().toISOString().replace(/.\d+Z$/g, 'Z') : null
  }
}
module.exports = RainfallTelemetry
