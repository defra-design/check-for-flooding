const utils = require('../utils')

class Level {
  constructor (data) {
    this.id = data.id
    this.mapId = data.type === 'rainfall' ? data.id : data.station_id
    this.name = data.name
    this.status = data.status
    this.type = data.type
    this.river_name = data.river_name
    this.river_display = data.river_display
    this.river_slug = data.river_slug
    this.river_order = data.river_order
    this.rainfall_1hr = data.rainfall__1hr
    this.rainfall_6hr = data.rainfall__6hr
    this.rainfall_24hr = data.rainfall__24hr
    this.latest_height = data.latest_height
    this.latest_datetime = data.latest_datetime ? utils.formatTimeDate(data.latest_datetime) : ''
    this.isDownstage = Boolean(data.is_downstage)
    this.hasDetail = Boolean(data.has_detail)
  }
}
module.exports = Level
