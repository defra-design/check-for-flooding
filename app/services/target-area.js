const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Get all warnings
  getTargetArea: async (id) => {
    const url = `/target-area/${id}`
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
