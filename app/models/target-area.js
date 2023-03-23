const severity = require('../models/severity')
const Level = require('./level')

class TargetArea {
  constructor (data) {
    const levels = data.trigger_levels.map(level => { return new Level(level) })
    const message = data.message?.trim()
    this.levels = levels
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.severity = severity.find(item => item.id === parseInt(data.severity, 10))
    this.message = message?.endsWith('.') ? message.slice(0, -1) : message
    // this.message = parseMessage(data.message, levels)
    // this.unmatchedLevels = levels.filter(level => !matchedLevels.includes(level))
    this.area = data.area
    this.geography = data.geography
    this.date = data.date
    this.parentId = data.parent_id
    this.parentSeverity = severity.find(item => item.id === parseInt(data.parent_severity, 10))
    this.centroid = data.centroid.split(',').map(x => parseFloat(x))
    this.bbox = data.bbox.split(',').map(x => parseFloat(x))
  }
}

// const matchedLevels = []

// const parseMessage = (message, levels) => {
//   // Match specific patterns but only once for a level
//   if (!message) return
//   levels.forEach(level => {
//     const patterns = [
//       { find: `${level.name} river gauge`, replace: `<a href="/station/${level.id}">${level.name} river gauge</a>` },
//       { find: `${level.name} peaked`, replace: `<a href="/station/${level.id}">${level.name}</a> peaked` }
//     ]
//     for (let i = 0; i < patterns.length; i++) {
//       if (message.includes(patterns[i].find)) {
//         message = message.replace(patterns[i].find, patterns[i].replace)
//         matchedLevels.push(level)
//         break
//       }
//     }
//   })
//   return message
// }

module.exports = TargetArea
