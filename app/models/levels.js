const utils = require('../utils')
const Level = require('./level')

class Levels {
  constructor (filters, place, river, levels) {
    this.filters = [...new Set(levels.map(item => item.type))].map(item => ({
      type: item,
      count: levels.filter(level => level.type === item).length,
      isSelected: filters ? filters.includes(item) : false
    }))
    this.numFilters = this.filters.filter(x => x.isSelected).length
    this.numItems = this.filters.filter(x => x.isSelected).length ? levels.filter(
      level => this.filters.filter(x => x.isSelected).map(x => x.type).includes(level.type)
    ).length : levels.length
    this.hasHigh = false
    this.numRiver = this.filterLevels(levels, 'river').length
    this.river = this.groupLevels(this.filterLevels(levels, 'river'))
    this.sea = this.filterLevels(levels, 'sea').map(x => new Level(x))
    this.groundwater = this.filterLevels(levels, 'groundwater').map(x => new Level(x))
    this.rainfall = this.filterLevels(levels, 'rainfall').map(x => new Level(x))
    this.bbox = place.bboxBuffered || river.bbox || []
  }

  filterLevels (levels, groupName) {
    // Filter by group
    if (['sea', 'groundwater', 'rainfall'].includes(groupName)) {
      levels = levels.filter(x => x.group_name.toLowerCase() === groupName)
    } else {
      levels = levels.filter(x => !['sea', 'groundwater', 'rainfall'].includes(x.group_name.toLowerCase()))
    }
    // Filter by selected
    const selectedFilters = this.filters.filter(x => x.isSelected)
    if (selectedFilters.length) {
      levels = levels.filter(level => selectedFilters.map(x => x.type).includes(level.type))
    }
    return levels
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
