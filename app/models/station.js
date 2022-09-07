const utils = require('../utils')

class Station {
  constructor (data) {
    this.id = data.station_id
    this.rloiId = data.rloi_id
    this.status = data.status
    this.name = data.name
    this.type = data.type
    if (data.type === 'rainfall') {
      this.rainfall1hr = data.rainfall_1hr
      this.rainfall6hr = data.rainfall_6hr
      this.rainfall24hr = data.rainfall_24hr
    } else {
      this.measureType = data.measure_type
      this.riverName = data.river_name
      this.riverDisplay = data.river_display
      this.riverSlug = utils.getSlug(data.river_display)
      this.riverOrder = data.river_order
      this.levelMax = data.level_max
      this.levelMaxDatetime = data.level_max_datetime
      this.levelHigh = data.level_high
      this.levelLow = data.level_low
      this.latestHeight = data.latest_height
      this.latestState = data.latest_state
      this.latestStatus = data.latest_status
      this.upStationId = data.station_up
      this.downStationId = data.station_down
      this.isMultiStage = data.is_multi_stage
      this.isDownstage = data.is_downstage
    }
    this.latestDatetime = data.latest_datetime
    this.latestStatus = data.latest_status
    this.centroid = data.centroid.split(',').map(x => Math.round(parseFloat(x) * 100000) / 100000)
    this.isWales = data.is_wales
    this.measureId = data.measure_id
  }
}

module.exports = Station
