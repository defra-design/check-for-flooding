const utils = require('../utils')

class Threshold {
  constructor (thresholds, latest = null, thresholdId) {
    thresholds = thresholds.filter(t => !!(t.value)).map(t => { return {
      ...t,
      value: parseFloat(t.value)
    }})
    // Merge high with any alerts at the same level
    const firstAlert = this.getFirstAlert(thresholds)
    const high = thresholds.find(t => t.type === 'high')
    const hasSameAlert = high.value === firstAlert?.value
    if (high) {
      high.hasSameAlert = hasSameAlert
      high.hasDiffAlert = firstAlert && !hasSameAlert
    }
    thresholds = thresholds.filter(t => t.type !== 'alert')
    firstAlert && !hasSameAlert ? thresholds.push(firstAlert) : null
    // Get first warning threshold
    const firstWarning = this.getFirstWarning(thresholds)
    firstWarning ? thresholds.push(firstWarning) : null
    // Remove non-active or non thresholdId
    thresholds = thresholds.filter(t => !(t.type === 'warning' && t.severity < 2))
    if (latest) latest = Math.round(latest * 100) / 100
    return this.createBands(thresholds, latest, thresholdId)
  }

  getFirstAlert(thresholds) {
    let alerts = thresholds.filter(t => t.type === 'alert')
    const numAlerts = alerts.length
    if (!numAlerts) return
    const value = Math.min(...alerts.map(w => w.value))

    return {
      id: 'alert-default',
      name: 'Low lying land flooding possible',
      description: 'Low lying land flooding possible above this level. One or more flood alerts may be issued',
      type: 'alert-default',
      value: value,
      date: null
    }
  }

  getFirstWarning(thresholds) {
    let warnings = thresholds.filter(t => t.type === 'warning')
    const numWarnings = warnings.length
    if (!numWarnings) return
    const value = Math.min(...warnings.map(w => parseFloat(w.value)))

    return {
      id: 'warning-default',
      name: 'Property flooding possible',
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
          ? 'Top of the normal range. Low lying land flooding possible above this level. One or more flood alerts may be issued'
          : item.hasDiffAlert
          ? 'Top of the normal range'
          : 'Top of the normal range, above this level flooding is possible'
        break
      case 'warning':
        description = `Flood warning issued: <a href="/target-area/${item.targetarea_id}">${item.description}</a>`
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
