const axios = require('axios')
const RainfallTelemetry = require('./models/rainfall-telemetry')
const moment = require('moment-timezone')

module.exports = {
  getTelemetry: async (id, start, end, measure) => {
    switch (measure) {
      case 'downstream':
        measure = 'Downstream Stage'
        break
      case 'tidal':
        // measure = 'Tidal Level' // Some tidal appear to have stage measures
        measure = ''
        break
      case 'groundwater':
        measure = 'Groundwater'
        break
      default:
        measure = 'Stage'
    }
    const dataStart = moment().subtract(5, 'days') // Currently 5 days, could be 10 years ago
    const baseUri = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}/readings`
    // Get a range of data
    const rangeStart = moment(start).isBefore(dataStart) ? dataStart : moment(start)
    const rangeEnd = moment(end).isAfter(moment()) ? moment() : moment(end)
    const uri = baseUri + `?_sorted&startdate=${rangeStart.toISOString().split('T')[0]}&enddate=${rangeEnd.toISOString().split('T')[0]}&qualifier=${encodeURI(measure)}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200 && response.data) {
      const range = response.data.items
        .map(item => {
          return {
            dateTime: item.dateTime,
            value: item.value
          }
        // Public api date range doesnt include time so we need additional filtering
        })
        .filter(item => moment(item.dateTime).isSameOrAfter(rangeStart) && moment(item.dateTime).isSameOrBefore(rangeEnd))
      return range
    } else {
      return response
    }
  },

  getRainfall: async (id, start, end) => {
    const dataStart = moment().subtract(5, 'days') // Currently 5 days, could be 10 yeras ago
    const dataEnd = moment() // Typically this will be the latest time
    const baseUri = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}/readings`

    // Get latest 96 readings (24 hours)
    let uri = `${baseUri}?_sorted&_limit=96`
    console.log(uri)
    let response = await axios.get(uri).then((response) => { return response })
    let latest
    if (response.status === 200 && response.data) {
      latest = response.data.items
        .map(item => {
          return {
            dateTime: item.dateTime,
            value: item.value
          }
        })
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
            value: item.value
          }
        // Public api date range doesnt include time so we need additional filtering
        })
        .filter(item => moment(item.dateTime).isSameOrAfter(rangeStart) && moment(item.dateTime).isSameOrBefore(rangeEnd))
    } else {
      return response
    }
    return new RainfallTelemetry(latest, range, dataStart, dataEnd, rangeStart, rangeEnd)
  }
}
