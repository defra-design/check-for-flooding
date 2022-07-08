const axios = require('axios')
const utils = require('../utils')
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
  getLevelsByRiver: async (cookie, slug) => {
    const url = `/stations-by-river/${utils.getSlug(slug)}`
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
  getLevelsByCatchment: async (cookie, query) => {
    const url = `/stations-by-catchment/${encodeURI(query)}`
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
