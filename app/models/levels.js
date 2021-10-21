const utils = require('../utils')
const Level = require('./level')

class Levels {
  constructor (filter, place, river, levels) {
    const filters = [...new Set(levels.map(item => item.group_type))].map(item => ({
      type: item,
      count: levels.filter(level => level.group_type === item).length
    }))
    filter = filter || filters[0].type
    this.filters = filters
    this.filter = filter
    levels = levels.filter(x => x.group_type === filter)
    this.numItems = levels.length
    this.hasHigh = false
    this.items = levels.map(x => new Level(x))
    this.bbox = place.bboxBuffered || river.bbox || []
  }

  groupLevels (levels) {
    const groups = utils.groupBy(levels, 'group_name')
    Object.entries(groups).forEach(([key, value]) => {
      value.forEach((item, index) => {
        groups[key][index] = new Level(item)
        if (item.state === 'high') {
          this.hasHigh = true
        }
      })
    })
    return groups
  }
}
module.exports = Levels
