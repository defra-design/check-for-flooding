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
    this.station = station
    // Keep presentation logic in the ViewModel
    let time = station.date ? utils.formatTimeRecent(station.date) : ''
    let timeElapsed = station.date ? utils.formatTimeElapsed(station.date) : ''
    if (station.type === 'rainfall') {
      telemetry.quarterly = telemetry.quarterly.map(item => {
        return {
          dateTime: item.dateTime,
          value: item.value
        }
      })
      telemetry.hourly = telemetry.hourly.map(item => {
        return {
          dateTime: item.dateTime,
          dateTimeHour: utils.formatTimeHour(item.dateTime),
          value: item.value
        }
      })
      time = utils.formatTimeRecent(telemetry.dateTime)
      timeElapsed = utils.formatTimeElapsed(telemetry.dateTime)
      this.rainfall1hr = telemetry.latest1hr
      this.rainfall6hr = telemetry.latest6hr
      this.rainfall24hr = telemetry.latest24hr
    }
    this.time = time
    this.timeElapsed = timeElapsed
    this.telemetry = telemetry
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
