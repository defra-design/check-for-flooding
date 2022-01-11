const axios = require('axios')
const RainfallTelemetry = require('./models/rainfall-telemetry')

module.exports = {
  getRainfall: async (id, start, end, period) => {
    const baseUri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${id}/readings`
    // Get latest values
    const latestDate = new Date()
    latestDate.setDate(latestDate.getDate() - 1)
    let uri = baseUri + `?_sorted&since=${latestDate.toISOString()}`
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
    // Get readings within date range
    const startDate = new Date(start)
    const endDate = new Date(end)
    uri = baseUri + `?_sorted&startdate=${startDate.toISOString().split('T')[0]}&enddate=${endDate.toISOString().split('T')[0]}`
    response = await axios.get(uri).then((response) => { return response })
    let readings
    if (response.status === 200 && response.data) {
      readings = response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value,
          isValid: true
        }
      }).filter(item => Date.parse(item.dateTime) > startDate && Date.parse(item.dateTime) <= endDate)
    } else {
      return response
    }
    return new RainfallTelemetry(latest, readings, endDate, period)
  }
}
