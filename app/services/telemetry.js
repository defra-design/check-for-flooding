const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getStationTelemetry: async (id, start, end, stage) => {
    const url = `/telemetry/${id}/${start}/${end}`
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
  },

  getRainfallTelemetry: async (id, start, end) => {
    const url = `/telemetry-rainfall/${id}/${start}/${end}`
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
