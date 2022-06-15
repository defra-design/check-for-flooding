const bingApiKey = process.env.BING_API_KEY
const utils = require('../../utils')

class ViewModel {
  constructor (station, telemetry, thresholds, place) {
    this.title = (() => {
      if (station.group_type === 'rainfall') {
        return `Rainfall at ${station.name}`
      } else if (station.group_type === 'river') {
        return `${station.riverName} level at ${station.name}${station.type === 'tide' ? ' (tidal)' : ''}`
      } else if (station.group_type === 'sea') {
        return `Sea level at ${station.name}`
      } else {
        return `${station.type.charAt(0).toUpperCase() + station.type.slice(1)} level at ${station.name} borehole`
      }
    })()
    this.station = station
    this.telemetry = telemetry
    this.thresholds = thresholds
    this.time = utils.formatTimeDate(station.latestDatetime)
    this.timeShort = `${utils.formatTime(station.latestDatetime)} ${utils.formatDate(station.latestDatetime)}`
    this.bingApiKey = bingApiKey
    this.nearby = place.postcode
  }
}
module.exports = ViewModel
