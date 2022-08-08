const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getLevelsWithin: async (cookie, bbox) => {
    const coords = bbox.join('/')
    const url = `/stations-within/${coords}`
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
  getLevelsByRiver: async (cookie, name) => {
    const url = `/stations-by-river/${encodeURI(name)}`
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
  getLevelsByCatchment: async (cookie, name) => {
    const url = `/stations-by-catchment/${encodeURI(name)}`
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
