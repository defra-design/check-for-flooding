const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Used in search
  getOutlook: async () => {
    const url = '/outlook'
    try {
      const response = await axios.get(url, {
        auth: {
          username: process.env.USERNAME,
          password: process.env.PASSWORD
        },
        withCredentials: true,
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  }
}
