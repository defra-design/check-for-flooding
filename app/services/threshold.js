const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getThresholds: async (cookie, id, isDownstream) => {
    const url = `/thresholds/${id}${isDownstream ? '/downstream' : ''}`
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