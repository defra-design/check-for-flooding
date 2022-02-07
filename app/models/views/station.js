const bingApiKey = process.env.BING_API_KEY
const utils = require('../../utils')

class ViewModel {
  constructor (station, telemetry, place) {
    this.title = (() => {
      if (station.type === 'rainfall') {
        return `Rainfall at ${station.name} gauge`
      } else if (station.type === 'river') {
        return `${station.river} level at ${station.name} gauge`
      } else if (station.type === 'tide') {
        return station.river ? `${station.river} level at ${station.name} gauge` : `Sea level at ${station.name} gauge`
      } else {
        return `${station.type.charAt(0).toUpperCase() + station.type.slice(1)} level at ${station.name} borehole`
      }
    })()
    this.station = station
    // Keep presentation logic in the ViewModel
    if (station.type === 'rainfall') {
      this.latest1hr = telemetry.latest1hr
      this.latest6hr = telemetry.latest6hr
      this.latest24hr = telemetry.latest24hr
    }
    this.telemetry = telemetry
    this.time = utils.formatTimeDate(telemetry.latestDateTime)
    this.bingApiKey = bingApiKey
    this.nearby = place.name
  }
}
module.exports = ViewModel
