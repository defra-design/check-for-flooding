const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  getThresholds: async (id, isDownstream) => {
    const url = `/thresholds/${id}/${isDownstream ? 'downstage' : 'stage'}`
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
