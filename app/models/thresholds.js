const utils = require('../utils')

class Threshold {
  constructor (thresholds, latest = null, thresholdId) {
    thresholds = thresholds.filter(t => !!(t.value))
    // Merge high with any alerts at the same level
    const high = thresholds.find(t => t.type === 'high')
    if (high) high.hasSameAlert = !!thresholds.find(t => high && t.type === 'alert' && t.value === high.value)
    thresholds = thresholds.filter(t => t.type !== 'alert')
    // Get first warning threshold
    const firstWarning = this.getFirstWarning(thresholds, thresholdId)
    firstWarning ? thresholds.push(firstWarning) : null
    // Remove non-active or non thresholdId
    thresholds = thresholds.filter(t => !(t.id !== thresholdId && t.type === 'warning' && t.severity < 2))
    if (latest) latest = Math.round(latest * 100) / 100
    return this.createBands(thresholds, latest, thresholdId)
  }

  getFirstWarning(thresholds, thresholdId) {
    let warnings = thresholds.filter(t => t.type === 'warning')
    const numWarnings = warnings.length
    if (!numWarnings) return
    const value = Math.min(...warnings.map(w => parseFloat(w.value)))
    const numActive = warnings.filter(w => w.severity >= 2).length
    const hasDefault = numActive < numWarnings || (numWarnings === 1 && (numActive === 1 || warnings[0].id === thresholdId))
    if (!hasDefault) return
    return {
      id: 'warning-default',
      name: 'Property flooding possible above this level',
      description: 'Property flooding possible above this level',
      type: 'warning-default',
      value: value,
      date: null
    }
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
      const type = value.filter(item => item.type === 'warning' && item.id !== thresholdId).length === value.length ? 'warning' : ''
      const band = {
        level: Number(key).toFixed(2),
        type: type,
        isLatest: Number(key) === latest,
        isExceeded: Number(key) <= latest,
        values: value.map(item => {
          return {
            id: item.id,
            name: this.createName(item),
            type: item.type === 'warning' ? item.id !== thresholdId ? 'warning' : '' : item.type,
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
        description = item.hasSameAlert
          ? 'Top of the normal range. Low lying land flooding is possible above this level. One or more flood alerts may be issued'
          : 'Top of the normal range, above this flooding may occur'
        break
      case 'warning':
        description = `Property flooding possible: <a href="/target-area/${item.targetarea_id}">${item.description}</a>`
        break
      case 'alert':
        description = `Low-lying land flooding: <a href="/target-area/${item.targetarea_id}">${item.description}</a>`
        break
      default:
        description = item.description
    }
    return description
  }
}
module.exports = Threshold
