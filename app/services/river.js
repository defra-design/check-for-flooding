const axios = require('axios')
const utils = require('../utils')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getRivers: async (query) => {
    const slug = utils.getSlug(query)
    const uri = `/rivers/${slug}`
    try {
      const response = await axios.get(uri, {
        method: 'get',
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.error(error)
    }
  }
}
