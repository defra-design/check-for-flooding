const utils = require('../utils')

class TriggerLevel {
  constructor (data) {
    this.id = data.id
    this.rloiId = data.rloiId.replace('-downstage', '')
    this.name = data.name
    this.group_type = data.group_type
    this.status = data.status
    this.riverName = data.river_name
    this.riverDisplay = data.river_display
    this.latestHeight = data.latest_height ? Math.round(data.latest_height * 100) / 100 : null
    this.latestDatetime = data.latest_datetime ? utils.formatTimeDate(data.latest_datetime) : ''
    this.elapsedTime = data.latest_datetime ? utils.formatElapsedTime(data.latest_datetime) : ''
    this.latestStatus = data.latest_status
    this.type = data.type
    this.threshold = data.threshold
    this.stage = data.stage
    this.isWales = Boolean(data.is_wales)
    this.hasDetail = Boolean(data.has_detail)
  }
}
module.exports = TriggerLevel
