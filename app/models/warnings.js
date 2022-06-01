const utils = require('../utils')
const moment = require('moment-timezone')
const severity = require('../models/severity')

class Warnings {
  constructor (data) {
    // const groups = utils.groupBy(data, 'severity')
    this.groups = []
    for (const [key] of Object.entries(groups)) {
      const groupSeverityId = parseInt(key, 10)
      const groupSeverity = severity.find(item => item.id === groupSeverityId)
      // const items = groups[key].map(({ severity, ...item }) => item)
      const items = groups[key].map((item) => {
        delete item.severity
        const date = `${moment(item.updated).format('h:mma')} on ${moment(item.updated).format('D MMMM YYYY')}`
        return {
          id: item.id,
          name: item.name,
          date: date
        }
      })
      const title = `${items.length} ${(items.length > 1 ? groupSeverity.pluralisedTitle : groupSeverity.title).toLowerCase()}`
      this.groups.push({
        title: title,
        severity: groupSeverity,
        items: items
      })
      if (groupSeverityId < 4) {
        this.hasActive = true
      } else {
        this.hasRemoved = true
      }
    }
    this.highestSeverity = Math.min.apply(Math, this.groups.map((o) => { return o.severity.id }))
  }
}

module.exports = Warnings
