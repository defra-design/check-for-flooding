const axios = require('axios')
const utils = require('../utils')
const serviceUrl = process.env.SERVICE_URL

axios.defaults.baseURL = serviceUrl

module.exports = {
  getRivers: async (query) => {
    const slug = utils.getSlug(query)
    const uri = `${serviceUrl}/rivers/${slug}`
    console.log(uri)
    let response
    try {
      response = await axios.get(uri).then((response) => { return response })
      return response
    } catch (err) {
      console.log(err)
    }
  }
}
