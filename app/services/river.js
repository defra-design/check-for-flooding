const axios = require('axios')
const utils = require('../utils')
const serviceUrl = process.env.SERVICE_URL

axios.defaults.headers.post['Access-Control-Allow-Methods'] = 'GET'

module.exports = {
  getRivers: async (query) => {
    const slug = utils.getSlug(query)
    const uri = `${serviceUrl}/rivers/${slug}`
    console.log(uri)
    const response = await axios.get(uri).then((response) => { return response })
    return response
  }
}
