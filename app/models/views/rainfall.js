const bingApiKey = process.env.BING_API_KEY
const utils = require('../../utils')

class ViewModel {
  constructor (station) {
    this.title = `Rainfall at ${station.name}`
    this.time = station.date ? utils.formatTime(station.date) : ''
    this.timeElapsed = station.date ? utils.formatElaspedTime(station.date) : ''
    this.station = station
    this.readings = []
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
