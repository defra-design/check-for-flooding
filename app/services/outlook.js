const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Used in search
  getOutlook: async (orgReq) => {
    const url = '/outlook'
    try {
      const response = await axios.get(url, {
        headers: { Cookie: orgReq.headers.cookie },
        baseURL: serviceUrl
      })
      return response
    } catch (error) {
      console.log(error)
    }
  }
}
