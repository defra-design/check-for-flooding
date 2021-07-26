const axios = require('axios')
const utils = require('../utils')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getRivers: async (query) => {
    const slug = utils.getSlug(query)
    const url = `/rivers/${slug}`
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
