const utils = require('../utils')
const Level = require('../models/level')

class Levels {
  constructor (query, place, river, levels) {
    this.queryTerm = query.term
    this.queryType = query.type
    this.filterTypes = (query.filterTypes || 'river,tide,groundwater,rainfall').split(',')
    this.numLevels = levels.length
    this.place = place
    this.river = river
    this.types = [...new Set(levels.map(item => item.type))]
    this.levels = this.createLevels(levels, this.filterTypes)
  }

  createLevels (levels, filterTypes) {
    levels = levels.filter(level => filterTypes.includes(level.type))
    const groups = utils.groupBy(levels, 'group_name')
    Object.entries(groups).forEach(([key, value]) => {
      value.forEach((item, index) => {
        groups[key][index] = new Level(item)
      })
    })
    return groups
  }
}
module.exports = Levels
