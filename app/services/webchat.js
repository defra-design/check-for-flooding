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

const isWithinHours = (days) => {
    const now = new Date()
    const name = now.toLocaleDateString('en-GB', { weekday: 'long' })
    const day = days.find(d => d.day.toLowerCase() === name.toLowerCase())
    const date = now.toLocaleDateString('en-GB').split('/')
    const open = `${date[2]}-${date[1]}-${date[0]}T${day.openTime}`
    const close = `${date[2]}-${date[1]}-${date[0]}T${day.closeTime}`
    return now.getTime() >= Date.parse(open) && now.getTime() <= Date.parse(close)
}

module.exports = {
  getAvailability: async () => {
    const clientId = process.env.CXONE_CLIENT_ID
    const clientSecret = process.env.CXONE_CLIENT_SECRET
    const accessKey = process.env.CXONE_ACCESS_KEY
    const accessSecret = process.env.CXONE_ACCESS_SECRET
    const skillEndpoint = process.env.CXONE_SKILL_ENDPOINT
    const hoursEndpoint = process.env.CXONE_HOURS_ENDPOINT
    const maxQueueCount = process.env.CXONE_MAX_QUEUE_COUNT
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
      let token = auth.data.id_token
      const tenantId = extractTenantId(token)

      // API discovery
      uri = `${issuer}/.well-known/cxone-configuration?tenantId=${tenantId}`
      config = {
        signal: AbortSignal.timeout(3000)
      }
      const api = await axios.get(uri, config)
      const host = `api-${api.data.area}.niceincontact.com` // 'api-e32.niceincontact.com'

      // Auth token
      token = auth.data.access_token
      const tokenType = auth.data.token_type

      // Skills/activity
      config = {
        signal: AbortSignal.timeout(3000),
        'headers': {
          'Host': host,
          'Authorization': `${tokenType} ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      uri = `https://${host}${skillEndpoint}`
      const skill = await axios.get(uri, config)
      const activity = skill.data.skillActivity[0]
      const hasCapacity = activity.queueCount < maxQueueCount
      const hasAgentsAvailable = activity.agentsAvailable >= 1

      // Hours of operation
      config = {
        signal: AbortSignal.timeout(3000),
        'headers': {
          'Host': 'api-l36.niceincontact.com',
          'Authorization': `${tokenType} ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      uri = `https://${host}${hoursEndpoint}`
      const hours = await axios.get(uri, config)
      const days = hours.data.resultSet.hoursOfOperationProfiles[0].days
      const isOpen = isWithinHours(days)

      // Availability
      const isAvailable = isOpen && hasAgentsAvailable && hasCapacity
      const isExistingOnly = isOpen && hasAgentsAvailable && !hasCapacity
      const availability = isAvailable ? 'AVAILABLE' : isExistingOnly ? 'EXISTING' : 'UNAVAILABLE'
      
      return {
        date: new Date(), 
        availability: availability
      }
    } catch (err) {
      return err
    }
  }
}