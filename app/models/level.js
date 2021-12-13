const utils = require('../utils')

class Level {
  constructor (data, count, start) {
    this.id = data.id
    this.name = data.name
    this.state = data.state
    this.value = data.value
    this.valueDownstream = data.value_downstream
    this.value1hr = data.value_1hr
    this.value6hr = data.value_6hr
    this.value24hr = data.value_24hr
    this.valueDate = data.value_date
    this.elapsedTime = data.value_date ? utils.formatTimeElapsed(data.value_date) : ''
    this.type = data.type
    this.riverName = data.river_name
    this.riverDisplay = data.river_display
    this.riverSlug = data.river_slug || ''
    this.riverWiskiName = data.river_wiski_name
    this.groupCount = count
    this.groupStart = start
    this.isDownstream = Boolean(data.is_downstream)
    this.hasDetail = Boolean(data.has_detail)
  }
}
module.exports = Level
