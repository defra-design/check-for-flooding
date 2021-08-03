const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getLevelsWithin: async (bbox) => {
    const coords = bbox.join('/')
    const url = `/stations-within/${coords}`
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
