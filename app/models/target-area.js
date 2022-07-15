const severity = require('../models/severity')
const Level = require('./level')

class TargetArea {
  constructor (data) {
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.severity = severity.find(item => item.id === parseInt(data.severity, 10))
    this.message = data.message
    this.area = data.area
    this.date = data.date
    this.parentId = data.parent_id
    this.parentSeverity = severity.find(item => item.id === parseInt(data.parent_severity, 10))
    this.triggerLevels = data.trigger_levels.map(level => { return new Level(level) })
    this.centroid = data.centroid.split(',').map(x => parseFloat(x))
    this.bbox = data.bbox.split(',').map(x => parseFloat(x))
  }
}

module.exports = TargetArea
