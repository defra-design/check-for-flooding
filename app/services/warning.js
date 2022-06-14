const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Get all warnings
  // getWarnings: async (cookie) => {
  //   const url = '/warnings'
  //   try {
  //     const response = await axios.get(url, {
  //       headers: { Cookie: cookie },
  //       baseURL: serviceUrl
  //     })
  //     return response
  //   } catch (error) {
  //     console.log(error)
  //   }
  // },

  // Get warnings that intersect a bbox
  getWarningsWithin: async (cookie, bbox = null) => {
    const coords = bbox ? '/' + bbox.join('/') : ''
    const url = `/warnings${coords}`
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
