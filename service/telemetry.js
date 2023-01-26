const db = require('./db')
const axios = require('axios')
const Telemetry = require('./models/telemetry')
const RainfallTelemetry = require('./models/rainfall-telemetry')
const moment = require('moment-timezone')

module.exports = {
  getTelemetry: async (id, start, end, latest) => {
    latest = latest || moment()
    let type = id.includes('tidal') ? 'tide' : (id.includes('groundwater') ? 'groundwater' : 'river')
    // Some stations are tidal but have level-stage measures
    // Get station type from context
    const stationResponse = await db.query(`
      SELECT type FROM measure_with_latest WHERE measure_id = $1
    `, [id])
    if (stationResponse.length) {
      type = stationResponse[0].type
    }
    const dataStart = moment().subtract(5, 'days') // Currently 5 days, could be 10 years ago
    const dataEnd = moment() // Typically this will be the latest time
    const baseUri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${id}/readings`
    // Get a range of data
    const rangeStart = moment(start).isBefore(dataStart) ? dataStart : moment(start)
    const rangeEnd = moment(end).isAfter(moment()) ? moment() : moment(end)
    const uri = baseUri + `?_sorted&startdate=${rangeStart.toISOString().split('T')[0]}&enddate=${rangeEnd.toISOString().split('T')[0]}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200 && response.data) {
      const observed = response.data.items
        .map(item => {
          return {
            dateTime: item.dateTime,
            value: item.value
          }
        })
        // Public api date range doesn't include time so we need additional filtering
        // Some values are not numbers so we remove these
        // To keep API in sync with cron task remove any newer than latest
        .filter(item =>
          typeof item.value === 'number' &&
          moment(item.dateTime).isSameOrAfter(rangeStart) &&
          moment(item.dateTime).isSameOrBefore(rangeEnd) &&
          moment(item.dateTime).isSameOrBefore(latest)
        )
      return new Telemetry(observed, dataStart, dataEnd, rangeStart, rangeEnd, type)
    }
    return response
  },

  getRainfall: async (id, start, end, latest) => {
    latest = latest || moment()
    const dataStart = moment().subtract(5, 'days') // Currently 5 days, could be 10 yeras ago
    const dataEnd = moment() // Typically this will be the latest time
    const baseUri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${id}/readings`
    // Get latest 96 readings (24 hours)
    let uri = `${baseUri}?_sorted&_limit=96`
    let response = await axios.get(uri).then((response) => { return response })
    let recent
    if (response.status === 200 && response.data) {
      recent = response.data.items
        .map(item => {
          return {
            dateTime: item.dateTime,
            // Some values are not numbers so we set them to zero
            value: typeof item.value === 'number' ? item.value : 0
          }
        })
        // To keep API in sync with cron task remove any newer than latest
        .filter(item => moment(item.dateTime).isSameOrBefore(latest))
    } else {
      return response
    }

    // Get a range of data
    const rangeStart = moment(start).isBefore(dataStart) ? dataStart : moment(start)
    const rangeEnd = moment(end).isAfter(moment()) ? moment() : moment(end)
    uri = baseUri + `?_sorted&startdate=${rangeStart.toISOString().split('T')[0]}&enddate=${rangeEnd.toISOString().split('T')[0]}`
    response = await axios.get(uri).then((response) => { return response })
    let range
    if (response.status === 200 && response.data) {
      range = response.data.items
        .map(item => {
          return {
            dateTime: item.dateTime,
            value: typeof item.value === 'number' ? item.value : 0
          }
        // remove any outside range or newer than 'latest'
        })
        .filter(item =>
          moment(item.dateTime).isSameOrAfter(rangeStart) &&
          moment(item.dateTime).isSameOrBefore(rangeEnd) &&
          moment(item.dateTime).isSameOrBefore(latest)
        )
    } else {
      return response
    }
    return new RainfallTelemetry(recent, range, dataStart, dataEnd, rangeStart, rangeEnd)
  },

  generateForecast: async (startDateTime, startValue, highValue) => {
    const dateTime = moment(startDateTime)
    const value = Number(startValue)
    const endValue = Number(highValue * 1.1)
    const valueIncrements = [0, 0.005, 0.1, 0.03, 0.07, 0.3, 0.6, 1] // 0 - 1
    const timeIncrements = Math.floor(36 / (valueIncrements.length - 1))
    const range = endValue - value
    const scale = valueIncrements.map(x => value + (x * range))
    const values = Array.from(Array(valueIncrements.length)).map((_, i) => {
      return {
        dateTime: moment(dateTime).add(i * timeIncrements, 'hours').format('YYYY-MM-DDTHH:mm:ssZ'),
        value: scale[i]
      }
    })
    const highest = values.reduce((acc, i) => (i.value > acc.value ? i : acc))
    return {
      values: values,
      highestValue: highest.value,
      highestValueDateTime: highest.dateTime
    }
  }
}
