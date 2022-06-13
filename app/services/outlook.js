const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

module.exports = {
  // Used in search
  getOutlook: async (req, res) => {
    const url = '/outlook'
    try {
      const response = await axios.get(url, {
        // auth: {
        //   username: process.env.USERNAME,
        //   password: process.env.PASSWORD
        // },
        // headers: { Cookie: "cookie1=value; cookie2=value; cookie3=value;" },
        baseURL: serviceUrl
      })
      console.log(req.cookies)
      console.log(req.headers.cookie)
      // console.log(JSON.stringify(req.headers).cookie)
      return response
    } catch (error) {
      console.log(error)
    }
  }
}
