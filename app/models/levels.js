const utils = require('../utils')
const Level = require('./level')

class Levels {
  constructor (query, place, river, levels) {
    this.filters = [...new Set(levels.map(item => item.type))].map(item => ({
      type: item,
      count: levels.filter(level => level.type === item).length,
      isSelected: query.filters ? query.filters.includes(item) : false
    }))
    this.numFilters = this.filters.filter(x => x.isSelected).length
    this.numItems = this.filters.filter(x => x.isSelected).length ? levels.filter(
      level => this.filters.filter(x => x.isSelected).map(x => x.type).includes(level.type)
    ).length : levels.length
    this.hasHigh = false
    this.items = this.createLevels(levels, this.filters.filter(x => x.isSelected))
    this.bbox = place.bboxBuffered || river.bbox || []
  }

  createLevels (levels, selectedFilters) {
    if (selectedFilters.length) {
      levels = levels.filter(level => selectedFilters.map(x => x.type).includes(level.type))
    }
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
