const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Get all warnings
  getTargetArea: async (cookie, id) => {
    const url = `/target-area/${id}`
    try {
      const response = await axios.get(url, {
        headers: { Cookie: cookie },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      // console.log(error)
      return {
        status: error.response.status
      }
    }
  }
}
