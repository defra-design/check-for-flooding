const utils = require('../utils')

class Threshold {
  constructor (thresholds, latest) {
    latest = Math.round(latest * 100) / 100
    return this.createBands(thresholds, latest)
  }

  createBands (thresholds, latest) {
    // Add latest to array
    thresholds.push({
      name: 'latest',
      description: 'Latest level',
      value: latest
    })
    // Sort in descending order on value
    thresholds.sort((a, b) => { return a.value - b.value }).reverse()
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
            name: x.name,
            type: '',
            description: x.description || this.createDescription(x)
          }
        })
      }
      bands.push(band)
    })
    return bands
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
