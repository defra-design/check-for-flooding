const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

axios.defaults.withCredentials = true

module.exports = {
  // Get all warnings
  getWarnings: async () => {
    const url = '/warnings'
    try {
      const response = await axios.get(url, {
        // auth: {
        //   username: process.env.USERNAME,
        //   password: process.env.PASSWORD
        // },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  },
  // Get warnings that intersect a bbox
  getWarningsWithin: async (bbox) => {
    const coords = bbox.join('/')
    const url = `/warnings/${coords}`
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
