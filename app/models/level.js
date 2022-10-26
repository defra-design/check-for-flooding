const utils = require('../utils')

class Level {
  constructor (data) {
    this.id = data.id
    this.mapId = data.type === 'rainfall' ? data.id : data.station_id
    this.name = data.name
    this.status = data.status
    this.group_type = data.group_type
    this.type = data.type
    this.riverName = data.river_name
    this.riverDisplay = data.river_display
    this.riverOrder = data.river_order
    this.rainfall1hr = data.rainfall_1hr
    this.rainfall6hr = data.rainfall_6hr
    this.rainfall24hr = data.rainfall_24hr
    this.latestTrend = data.latest_trend
    this.latestHeight = data.latest_height ? Math.round(data.latest_height * 100) / 100 : null
    this.latestState = data.latest_state
    this.latestDatetime = data.latest_datetime ? utils.formatTimeDate(data.latest_datetime) : ''
    this.latestStatus = data.latest_status
    this.lon = data.lon
    this.lat = data.lat
    this.isMultiStage = Boolean(data.is_multi_stage)
    this.isDownstage = Boolean(data.is_downstage)
    this.isWales = Boolean(data.is_wales)
    this.hasDetail = Boolean(data.has_detail)
  }
}
module.exports = Level
