const utils = require('../utils')

class Level {
  constructor (data) {
    this.id = data.id
    this.mapId = data.type === 'rainfall' ? data.id : data.station_id
    this.name = data.name
    this.status = data.status
    this.type = data.type
    this.riverName = data.river_name
    this.riverDisplay = data.river_display
    this.riverSlug = data.river_slug
    this.riverOrder = data.river_order
    this.rainfall1hr = data.rainfall_1hr
    this.rainfall6hr = data.rainfall_6hr
    this.rainfall24hr = data.rainfall_24hr
    this.latestState = data.latest_state
    this.latestHeight = data.latest_height ? Math.round(data.latest_height * 100) / 100 : null
    this.latestDatetime = data.latest_datetime ? utils.formatTimeDate(data.latest_datetime) : ''
    this.isDownstage = Boolean(data.is_downstage)
    this.hasDetail = Boolean(data.has_detail)
  }
}
module.exports = Level
