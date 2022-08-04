const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Used in search
  getRivers: async (cookie, query) => {
    const url = `/rivers/${encodeURI(query)}`
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

  getCatchments: async (cookie, query) => {
    const url = `/catchments/${encodeURI(query)}`
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
