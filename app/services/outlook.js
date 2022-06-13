const axios = require('axios')
const serviceUrl = process.env.SERVICE_URL

const axiosInstance = axios.create({ baseURL: serviceUrl })

const createSession = async () => {
  console.log('create session')
  const authParams = {
    username: 'username',
    password: 'password'
  }
  const resp = await axios.get(serviceUrl, authParams)
  const cookie = resp.headers['set-cookie'][0] // getting cookie from request
  axiosInstance.defaults.headers.Cookie = cookie // attaching cookie to axiosInstance for future requests
  // return cookie // return Promise<cookie> because func is async
}

module.exports = {
  // Used in search
  getOutlook: async () => {
    const url = '/outlook'
    try {
      createSession().then(() => {
        return axiosInstance.get(url) // with new cookie
      })
      // const response = await axios.get(url, {
      //   auth: {
      //     username: process.env.USERNAME,
      //     password: process.env.PASSWORD
      //   },
      //   baseURL: serviceUrl
      // })
      // console.log(response.headers)
      // return response
    } catch (error) {
      console.log(error)
    }
  }
}
