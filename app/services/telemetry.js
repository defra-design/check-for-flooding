const axios = require('axios')

module.exports = {
  getStationTelemetry: async (uri) => {
    const date = new Date()
    date.setDate(date.getDate() - 5)
    uri += `/readings?_sorted&since=${date.toISOString()}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200 && response.data) {
      return response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      })
    }
    return response
  },
  getRainfallTelemetry: async (uri) => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    // uri += '/readings?_sorted&_limit=96'
    uri += `/readings?_sorted&since=${date.toISOString()}`
    console.log(uri)
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200 && response.data) {
      return response.data.items.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      })
    }
    return response
  }
}
