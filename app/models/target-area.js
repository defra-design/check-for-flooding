const severity = require('../models/severity')

class TargetArea {
  constructor (data) {
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.severity = severity.find(item => item.id === parseInt(data.severity, 10))
    this.message = data.message
    this.area = data.area
    this.date = data.date
    this.centroid = data.centroid.split(',').map(x => parseFloat(x))
    this.bbox = data.bbox.split(',').map(x => parseFloat(x))
  }
}

module.exports = TargetArea
