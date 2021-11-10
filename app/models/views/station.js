const bingApiKey = process.env.BING_API_KEY
const utils = require('../../utils')

class ViewModel {
  constructor (station, telemetry) {
    this.title = (() => {
      if (station.type === 'rainfall') {
        return `Rainfall at ${station.name}`
      } else if (station.type === 'river') {
        return `${station.river} level at ${station.name}`
      } else if (station.type === 'tide') {
        return station.river ? `${station.river} level at ${station.name}` : `Sea level at ${station.name}`
      } else {
        return `${station.type.charAt(0).toUpperCase() + station.type.slice(1)} level at ${station.name}`
      }
    })()
    this.time = station.date ? utils.formatTimeRecent(station.date) : ''
    this.timeElapsed = station.date ? utils.formatTimeElapsed(station.date) : ''
    this.station = station
    // Keep presentation logic in the ViewModel
    if (telemetry.quarterly) {
      telemetry.quarterly = telemetry.quarterly.map(item => {
        return {
          dateTime: utils.formatTimeHour(item.dateTime),
          value: item.value
        }
      })
      telemetry.hourly = telemetry.hourly.map(item => {
        return {
          dateTime: utils.formatTimeHour(item.dateTime),
          value: item.value
        }
      })
    }
    this.telemetry = telemetry
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
