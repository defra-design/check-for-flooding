const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getStation: async (cookie, id, isDownstream) => {
    const url = `/station/${id}${isDownstream ? '/downstream' : ''}`
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
  getStationRain: async (cookie, id) => {
    const url = `/raingauge/${id}`
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
