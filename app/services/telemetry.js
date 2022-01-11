const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getStationTelemetry: async (uri) => {
    const date = new Date()
    date.setDate(date.getDate() - 5)
    uri += `/readings?_sorted&since=${date.toISOString()}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200 && response.data) {
      return response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      })
    }
    return response
  },
  getRainfallTelemetry: async (id, startDate, endDate, period) => {
    const url = `/telemetry/rainfall/${id}/${startDate}/${endDate}/${period}`
    try {
      const response = await axios.get(url, {
        auth: {
          username: process.env.USERNAME,
          password: process.env.PASSWORD
        },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  }
}
