const axios = require('axios')
const RainfallTelemetry = require('./models/rainfall-telemetry')
const moment = require('moment-timezone')

module.exports = {
  getRainfall: async (id, start, end, period) => {
    const baseUri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${id}/readings`
    // Get latest values from last 24 hours or 96 readings
    let uri = baseUri + '?_sorted&_limit=96'
    let response = await axios.get(uri).then((response) => { return response })
    let latest
    if (response.status === 200 && response.data) {
      latest = response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      })
    } else {
      return response
    }
    // Ensure start and end dates are valid
    const dataStart = moment().subtract(5, 'days')
    const dataEnd = moment()
    let startDate = moment(start)
    let endDate = moment(end)
    const duration = moment.duration(endDate.diff(startDate)).asMinutes()
    if (startDate > dataEnd || endDate > dataEnd) {
      // If either start or end is in the future set to latest range
      startDate = moment().subtract(duration, 'minutes')
      endDate = dataEnd
    } else if (startDate < dataStart || endDate < dataStart) {
      // If either start or end are too old set to oldest range
      startDate = dataStart
      endDate = moment().subtract(5, 'days').add(duration, 'minutes')
    }
    // Ensure start and end dates are within data
    startDate = startDate < dataStart ? dataStart : startDate
    endDate = endDate > dataEnd ? dataEnd : endDate

    // Get readings
    uri = baseUri + `?_sorted&startdate=${startDate.toISOString().split('T')[0]}&enddate=${endDate.toISOString().split('T')[0]}`
    response = await axios.get(uri).then((response) => { return response })
    let readings
    if (response.status === 200 && response.data) {
      readings = response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      }).filter(item => moment(item.dateTime) > startDate && moment(item.dateTime) <= endDate)
    } else {
      return response
    }
    return new RainfallTelemetry(latest, readings, endDate.toDate(), period)
  }
}
