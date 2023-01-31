const moment = require('moment-timezone')
const utils = require('../utils')

class Station {
  constructor (data) {
    this.id = data.station_id
    this.rloiId = data.rloi_id
    this.status = data.status
    this.name = data.name
    this.type = data.type
    this.group_type = data.group_type
    if (data.type === 'rainfall') {
      this.rainfall1hr = data.rainfall_1hr
      this.rainfall6hr = data.rainfall_6hr
      this.rainfall24hr = data.rainfall_24hr
    } else {
      this.measureType = data.measure_type
      this.riverId = data.river_id
      this.riverName = data.river_name
      this.riverOrder = data.river_order
      this.levelMax = data.level_max
      this.levelMaxDatetime = data.level_max_datetime
      this.levelHigh = data.level_high
      this.levelLow = data.level_low
      this.latestTrend = data.latest_trend
      this.latestHeight = data.latest_height ? Math.round(data.latest_height * 100) / 100 : null
      this.latestState = data.latest_state
      this.latestStatus = data.latest_height ? data.latest_status : 'missing'
      this.upStationId = data.station_up
      this.downStationId = data.station_down
      this.isMultiStage = data.is_multi_stage
      this.isDownstage = data.is_downstage
      this.isUpstage = data.is_upstage
    }
    this.latestDatetime = data.latest_datetime
    this.centroid = data.centroid.split(',').map(x => Math.round(parseFloat(x) * 100000) / 100000)
    this.centroidBuffer = utils.bufferPoint(data.centroid.split(',').map(x => Math.round(parseFloat(x) * 100000) / 100000), 8000)
    this.isWales = data.is_wales
    this.isForecast = data.is_forecast
    this.measureId = data.measure_id
    this.isRecent = data.latest_datetime ? moment().diff(moment(data.latest_datetime), 'minutes') < 60 : false
  }
}

module.exports = Station
