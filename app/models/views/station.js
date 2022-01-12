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
      telemetry.values = telemetry.values.map(item => {
        return {
          ...item,
          dateTimeHour: utils.formatTimeHour(item.dateTime)
        }
      })
      time = utils.formatTimeDate(telemetry.latestDateTime)
      timeElapsed = utils.formatTimeElapsed(telemetry.latestDateTime)
      this.latest1hr = telemetry.latest1hr
      this.latest6hr = telemetry.latest6hr
      this.latest24hr = telemetry.latest24hr
      this.telemetry = telemetry.values
    } else {
      this.telemetry = telemetry.fiveDays
    }
    this.time = time
    this.timeElapsed = timeElapsed
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
