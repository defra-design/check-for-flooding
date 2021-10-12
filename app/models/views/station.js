// const moment = require('moment-timezone')

class ViewModel {
  constructor (station) {
    this.title = (() => {
      if (station.type === 'river') {
        return `${station.river} level at ${station.name}`
      } else if (station.type === 'tide') {
        return station.river ? `${station.river} level at ${station.name}` : `Sea level at ${station.name}`
      } else if (station.type === 'rainfall') {
        return `Rainfall at ${station.name}`
      } else {
        return `${station.type.charAt(0).toUpperCase() + station.type.slice(1)} level at ${station.name}`
      }
    })()
    this.station = station
  }
}
module.exports = ViewModel
