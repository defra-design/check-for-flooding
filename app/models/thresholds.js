const utils = require('../utils')

class Threshold {
  constructor (thresholds, latest = null, thresholdId) {
    thresholds = thresholds.filter(x => !!(x.value))
    const firstWarning = this.getFirstWarning(thresholds)
    firstWarning ? thresholds.push(firstWarning) : null
    if (latest) latest = Math.round(latest * 100) / 100
    return this.createBands(thresholds, latest, thresholdId)
  }

  getFirstWarning(thresholds) {
    const values = thresholds.filter(t => t.type === 'warning').map(t => Number(t.value))
    const value = values.length ? Math.min(...values) : null
    return value ? {
      id: 'warning-default',
      name: 'Property flooding possible above this level',
      description: 'Property flooding possible above this level',
      type: 'warning-default',
      value: value,
      date: null
    } : null
  }

  createBands (thresholds, latest, thresholdId) {
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
      const type = value.filter(item => item.type === 'warning' && `threshold-${item.id}` !== thresholdId).length === value.length ? 'warning' : ''
      const band = {
        level: Number(key).toFixed(2),
        type: type,
        isLatest: Number(key) === latest,
        isExceeded: Number(key) <= latest,
        values: value.map(item => {
          return {
            id: item.id,
            name: this.createName(item),
            type: item.type === 'warning' ? `threshold-${item.id}` !== thresholdId ? 'warning' : '' : item.type,
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
      default:
        name = item.name
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
        description = `Property flooding possible: <a href="/target-area/${item.targetarea_id}">${item.description}</a>`
        break
      case 'alert':
        description = `Low laying land flooding: <a href="/target-area/${item.targetarea_id}">${item.description}</a>`
        break
      default:
        description = item.description
    }
    return description
  }
}
module.exports = Threshold
