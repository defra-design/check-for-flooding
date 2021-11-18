const axios = require('axios')

module.exports = {
  getStationTelemetry: async (uri) => {
    uri += '/readings?_sorted&_limit=96'
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
    uri += '/readings?_sorted&_limit=96'
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
