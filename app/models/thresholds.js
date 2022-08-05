const utils = require('../utils')

class Threshold {
  constructor (thresholds, latest) {
    thresholds = thresholds.filter(x => !!(x.value))
    latest = Math.round(latest * 100) / 100
    return this.createBands(thresholds, latest)
  }

  createBands (thresholds, latest) {
    // Add latest at beginning of array
    thresholds.unshift({
      name: 'latest',
      description: 'Latest level',
      value: latest
    })
    // Group on value
    const groups = utils.groupBy(thresholds, 'value')
    // Create bands
    const bands = []
    Object.entries(groups).forEach(([key, value]) => {
      const band = {
        level: Number(key).toFixed(2),
        isLatest: Number(key) === latest,
        isExceeded: Number(key) <= latest,
        values: value.map(x => {
          return {
            id: x.id,
            name: this.createName(x),
            type: '',
            description: x.description || this.createDescription(x)
          }
        })
      }
      bands.push(band)
    })
    // Sort in descending order on level
    bands.sort((a, b) => { return Number(a.level) - Number(b.level) }).reverse()
    return bands
  }

  createName (item) {
    let name = item.name
    if (name === 'max') {
      name = 'Highest level on record'
    } else if (name === 'high') {
      name = 'Top of the normal range'
    }
    return name
  }

  createDescription (item) {
    let description
    if (item.name === 'max') {
      description = `Water reaches the highest level recorded at this measuring station (${utils.formatDatePast(item.date)})`
    } else if (item.name === 'high') {
      description = 'Top of the normal range, above this flooding may occur'
    }
    return description
  }
}
module.exports = Threshold
