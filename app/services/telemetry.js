const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getStationTelemetry: async (cookie, id, start, end, latest = null) => {
    let url = `/telemetry/${id}/${start}/${end}`
    url = latest ? `${url}/${latest}` : url
    try {
      const response = await axios.get(url, {
        headers: { Cookie: cookie },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  },

  getStationForecastTelemetry: async (cookie, startDateTime, startValue, highValue) => {
    const url = `/telemetry-forecast/${startDateTime}/${startValue}/${highValue}`
    try {
      const response = await axios.get(url, {
        headers: { Cookie: cookie },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  },

  getRainfallTelemetry: async (cookie, id, start, end, latest = null) => {
    let url = `/telemetry-rainfall/${id}/${start}/${end}`
    url = latest ? `${url}/${latest}` : url
    try {
      const response = await axios.get(url, {
        headers: { Cookie: cookie },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  }
}
