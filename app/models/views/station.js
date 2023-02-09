const bingApiKey = process.env.BING_API_KEY
const utils = require('../../utils')

class ViewModel {
  constructor (station, banner, telemetry, thresholds, place) {
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
    this.banner = banner?.severity ? banner : null
    this.telemetry = telemetry
    this.thresholds = thresholds
    this.time = utils.formatTimeDate(station.latestDatetime)
    this.forecastHighestTime = utils.formatTimeDate(station.forecastHighestDateTime)
    this.timeShort = `${utils.formatTime(station.latestDatetime)} ${utils.formatDate(station.latestDatetime)}`
    this.bingApiKey = bingApiKey
    this.nearby = place?.postcode || null

    // Toggletips
    if (['river', 'groundwater'].includes(station.group_type)) {
      this.infoHeight = (() => {
        if (station.isAOD) {
          return 'This station measures height from sea level.'
        } else if (station.latestHeight <= 0) {
          return 'This station measures height from a fixed point on or close to the riverbed. A reading of 0 metres can be normal for some stations because of natural changes to the riverbed.'
        } else {
          return 'This station measures height from a fixed point on or close to the riverbed.'
        }
      })()
      this.infoState = (() => {
        const state = station.latestState === 'high' ? 'above' : station.latestState === 'low' ? 'below' : 'within'
        return `There are 3 states: low, normal and high. The latest level is ${state} the normal range. We calculate the normal range using an average of past measurements and other local factors.`
      })()
    }
    this.infoTrend = 'The last 2 readings indicate the trend.'
  }
}
module.exports = ViewModel
