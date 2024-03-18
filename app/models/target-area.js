const severity = require('../models/severity')
const TriggerLevel = require('./trigger-level')

function parseMessage (message) {
  return message.replace(/(\r?\n)+/g, '\n').split('\n').map(p => `<p>${p}</p>`).join(' ')
}

class TargetArea {
  constructor (data) {
    const triggerLevels = data.trigger_levels ? data.trigger_levels.map(triggerLevel => { return new TriggerLevel(triggerLevel) }) : []
    this.triggerLevels = triggerLevels
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.severity = severity.find(item => item.id === parseInt(data.severity, 10))
    this.message = parseMessage(data.message?.trim())
    this.area = data.area
    this.geography = data.geography
    this.date = data.date
    this.parentId = data.parent_id
    this.parentSeverity = severity.find(item => item.id === parseInt(data.parent_severity, 10))
    this.centroid = data.centroid.split(',').map(x => parseFloat(x))
    this.bbox = data.bbox.split(',').map(x => parseFloat(x))
    this.source = data.source
  }
}

module.exports = TargetArea
