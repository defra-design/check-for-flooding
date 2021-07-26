const axios = require('axios')
const utils = require('../utils')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getRivers: async (query) => {
    const slug = utils.getSlug(query)
    const url = `/rivers/${slug}`
    try {
      const response = await axios({
        method: 'get',
        url: url,
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.error(error)
    }
  }
}
