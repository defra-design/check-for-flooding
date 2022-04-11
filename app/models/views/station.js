const bingApiKey = process.env.BING_API_KEY
const utils = require('../../utils')

class ViewModel {
  constructor (station, telemetry, thresholds, place) {
    this.title = (() => {
      if (station.type === 'rainfall') {
        return `Rainfall at ${station.name} gauge`
      } else if (station.type === 'river') {
        return `${station.riverName} level at ${station.name} gauge`
      } else if (station.type === 'tide') {
        return station.river_name ? `${station.riverName} level at ${station.name} gauge` : `Sea level at ${station.name} gauge`
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
