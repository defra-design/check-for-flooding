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
  getAvailability: async () => {
    const clientId = process.env.CXONE_CLIENT_ID
    const clientSecret = process.env.CXONE_CLIENT_SECRET
    const accessKey = process.env.CXONE_ACCESS_KEY
    const accessSecret = process.env.CXONE_ACCESS_SECRET
    const authorisation = 'Basic ' + Buffer.from(`${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`).toString('base64')

    // *** Use discovery to find issuer
    const issuer = 'https://cxone.niceincontact.com'

    let uri = `${issuer}/auth/token`

    let config = {
      signal: AbortSignal.timeout(3000),
      headers: {
        'Host': 'eu1.niceincontact.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authorisation
      }
    }

    const body = querystring.stringify({
      'grant_type': 'password',
      username: accessKey,
      password: accessSecret
    })

    try {
      // Cache authentication and re-authenticate when needed (lasts 1 hour?)
      const auth = await axios.post(uri, body, config)
      // const auth = await axios.post({
      //   url: uri,
      //   method: 'post',
      //   data: {
      //     'grant_type': 'password',
      //     username: accessKey,
      //     password: accessSecret
      //   },
      //   headers: {
      //     'Host': 'eu1.niceincontact.com',
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //     'Authorization': authorisation
      //   },
      //   timeout: (3000),
      //   signal: AbortSignal.timeout(3000)
      // })
      let token = auth.data.id_token
      const tenantId = extractTenantId(token)

      // API discovery
      uri = `${issuer}/.well-known/cxone-configuration?tenantId=${tenantId}`
      config = {
        signal: AbortSignal.timeout(3000)
      }
      const api = await axios.get(uri, config)
      const host = `api-${api.data.area}.niceincontact.com` // 'api-e32.niceincontact.com'
      const service = '/incontactapi/services/v26.0/skills/20823624/activity' // '/incontactapi/services/v26.0/skills/18524648/activity'

      // Skills/activity
      uri = `https://${host}${service}`
      token = auth.data.access_token
      const tokenType = auth.data.token_type
      config = {
        signal: AbortSignal.timeout(3000),
        'headers': {
          'Host': host,
          'Authorization': `${tokenType} ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      const skill = await axios.get(uri, config)
      const advisersAvailable = skill.data.skillActivity[0].agentsAvailable >= 1

      console.log(skill.data)

      return {
        isAvailable: advisersAvailable
      }
    } catch (err) {
      return err
    }
  }
}