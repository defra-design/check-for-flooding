const utils = require('../utils')

class Threshold {
  constructor (thresholds, latest = null) {
    thresholds = thresholds.filter(x => !!(x.value))
    if (latest) latest = Math.round(latest * 100) / 100
    return this.createBands(thresholds, latest)
  }

  createBands (thresholds, latest) {
    // Add latest at beginning of array
    if (latest) {
      thresholds.unshift({
        name: 'latest',
        description: 'Latest level',
        value: latest
      })
    }
    // Group on value
    const groups = utils.groupBy(thresholds, 'value')
    // Create bands
    const bands = []
    Object.entries(groups).forEach(([key, value]) => {
      const band = {
        level: Number(key).toFixed(2),
        isLatest: Number(key) === latest,
        isExceeded: Number(key) <= latest,
        values: value.map(item => {
          return {
            id: item.id,
            name: this.createName(item),
            type: '',
            description: this.createDescription(item)
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
    let name
    switch (item.type) {
      case 'max':
        name = 'Highest level on record'
        break
      case 'high':
        name = 'Top of the normal range'
        break
      case 'warning':
        name = 'Property flooding possible'
        break
      case 'alert':
        name = 'Flooding of low laying land'
    }
    return name
  }

  createDescription (item) {
    let description
    switch (item.type) {
      case 'max':
        description = `Water reaches the highest level recorded at this measuring station (${utils.formatDatePast(item.date)})`
        break
      case 'high':
        description = 'Top of the normal range, above this flooding may occur'
        break
      case 'warning':
        description = `Property flooding possible: ${item.description}`
        break
      case 'alert':
        description = `Low laying land flooding: ${item.description}`
        break
      default:
        description = item.description
    }
    return description
  }
}
module.exports = Threshold
