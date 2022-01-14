const axios = require('axios')
const RainfallTelemetry = require('./models/rainfall-telemetry')
const moment = require('moment-timezone')

module.exports = {
  getRainfall: async (id, pageStart, pageEnd, period) => {
    // Set how many days we want to restrict
    const dataLimit = 5

    const baseUri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${id}/readings`

    // Get latest 96 readings (24 hours)
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
    const dataStartDate = moment().subtract(dataLimit, 'days')
    const dataEndDate = moment()
    let pageStartDate = moment(pageStart)
    let pageEndDate = moment(pageEnd)
    const duration = moment.duration(pageEndDate.diff(pageStartDate)).asMinutes()
    if (pageStartDate > dataEndDate || pageEndDate > dataEndDate) {
      // If either start or end is in the future set to latest range
      pageStartDate = moment().subtract(duration, 'minutes')
      pageEndDate = dataEndDate
    } else if (pageStartDate < dataStartDate || pageEndDate < dataStartDate) {
      // If either start or end are too old set to oldest range
      pageStartDate = dataStartDate
      pageEndDate = moment(dataStartDate.toDate()).add(duration, 'minutes')
    }
    // Ensure start and end dates are within data
    pageStartDate = pageStartDate < dataStartDate ? dataStartDate : pageStartDate
    pageEndDate = pageEndDate > dataEndDate ? dataEndDate : pageEndDate
    // Round start and end dates to completed 15 minute interval
    const pageStartDateRounded = moment(pageStartDate).minute(Math.floor(moment(pageStartDate).minute() / 15) * 15).second(0).milliseconds(0)
    const pageEndDateRounded = moment(pageEndDate).minute(Math.floor(moment(pageEndDate).minute() / 15) * 15).second(0).milliseconds(0)
    console.log(pageStartDateRounded, pageEndDateRounded)

    // Get readings
    uri = baseUri + `?_sorted&startdate=${pageStartDate.toISOString().split('T')[0]}&enddate=${pageEndDate.toISOString().split('T')[0]}`
    response = await axios.get(uri).then((response) => { return response })
    let readings
    if (response.status === 200 && response.data) {
      readings = response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      // Public api date range doesnt include time so we need additional filtering
      }).filter(item => moment(item.dateTime) > pageStartDateRounded && moment(item.dateTime) <= pageEndDateRounded)
    } else {
      return response
    }
    return new RainfallTelemetry(latest, readings, pageEndDate.toDate(), period)
  }
}
