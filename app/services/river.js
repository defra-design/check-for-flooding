const axios = require('axios')
const utils = require('../utils')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Used in search
  getRivers: async (query) => {
    const url = `/rivers/${encodeURI(query)}`
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

  // Used on list page
  getRiver: async (slug) => {
    const url = `/river/${utils.getSlug(slug)}`
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

  getCatchments: async (query) => {
    const url = `/catchments/${encodeURI(query)}`
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
