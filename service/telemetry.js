const axios = require('axios')
const RainfallTelemetry = require('./models/rainfall-telemetry')

module.exports = {
  getRainfall: async (id, period) => {
    let uri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${id}`
    const date = new Date()
    date.setDate(date.getDate() - 1)
    uri += `/readings?_sorted&since=${date.toISOString()}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200 && response.data) {
      const data = response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      })
      const telemetry = new RainfallTelemetry(data, period)
      return telemetry
    }
    return response
  }
}
