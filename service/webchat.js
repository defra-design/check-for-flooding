const axios = require('axios')
const querystring = require('querystring')

const extractTenantId = (token) => {
  var base64Url = token.split('.')[1]
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  var jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString('ascii').split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))

  return JSON.parse(jsonPayload)['tenantId'];
}

module.exports = {
  getStatus: async () => {
    const clientId = process.env.CXONE_CLIENT_ID
    const clientSecret = process.env.CXONE_CLIENT_SECRET
    const accessKey = process.env.CXONE_ACCESS_KEY
    const accessSecret = process.env.CXONE_ACCESS_SECRET
    const authorisation = 'Basic ' + Buffer.from(`${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`).toString('base64')

    // *** Use discovery to find issuer
    const issuer = 'https://cxone.niceincontact.com'

    let uri = `${issuer}/auth/token`

    let config = {
      'headers': {
        'Host': 'eu1.niceincontact.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authorisation
      }
    }

    const body = querystring.stringify({
      'grant_type': 'password',
      'username': accessKey,
      'password': accessSecret
    })

    try {
      // Cache authentication and re-authenticate when needed
      const auth = await axios.post(uri, body, config)
      let token = auth.data.id_token
      const tenantId = extractTenantId(token)

      // API discovery
      uri = `${issuer}/.well-known/cxone-configuration?tenantId=${tenantId}`
      const api = await axios.get(uri)
      const host = api.data.api_endpoint // `${api.data.area}.${api.data.uhDomain}`

      console.log(api.data)
      
      // Skills/activity
      uri = `${host}/skills/activity`

      console.log(uri)

      token = auth.data.access_token
      const tokenType = auth.data.token_type
      config = {
        'headers': {
          // 'Host': `${api.data.area}.${api.data.uhDomain}`,
          'Authorization': `${tokenType} ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      // const status = await axios.get(uri)
      // console.log(status)

      return 'Status'
    } catch (err) {
      console.log(err)
      return 'Error'
    }
  }
}