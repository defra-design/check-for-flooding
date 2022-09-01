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
    this.banner = banner.severity ? banner : null
    this.telemetry = telemetry
    this.thresholds = thresholds
    this.time = utils.formatTimeDate(station.latestDatetime)
    this.timeShort = `${utils.formatTime(station.latestDatetime)} ${utils.formatDate(station.latestDatetime)}`
    this.bingApiKey = bingApiKey
    this.nearby = place.postcode

    // Toggletips
    if (station.type === 'river') {
      this.infoHeight = (() => {
        if (station.latestStatus && station.latestHeight <= 0 && station.type === 'river') {
          return 'It is normal for some stations to be 0m or below as height is measured from a fixed point.'
        } else {
          return 'We usually measure the height of rivers relative to a fixed point on or close to the riverbed.'
        }
      })()
      this.infoTrend = (() => {
        if (station.latestTrend === 'rising') {
          return 'The latest level is higher than the previous. Readings are taken every 15 minutes.'
        } else if (station.latestTrend === 'falling') {
          return 'The latest level is lower than the previous. Readings are taken every 15 minutes.'
        } else {
          return 'The latest two readings are the same. Readings are taken every 15 minutes.'
        }
      })()
      this.infoState = (() => {
        if (station.latestState === 'high') {
          return 'The latest level is above the normal range.'
        } else if (station.latestState === 'low') {
          return 'The latest level is below the normal range.'
        } else {
          return 'The latest level is within the normal range.'
        }
      })()
    }
  }
}
module.exports = ViewModel
