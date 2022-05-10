const Level = require('./level')

class Levels {
  constructor (type, levels) {
    const filters = ['river', 'sea', 'rainfall', 'groundwater'].map(item => ({
      type: item,
      count: levels.filter(level => level.group_type === item).length
    }))
    const activeFilter = filters.find(x => x.type === type) || filters.find(x => x.count > 0) || filters[0]
    type = activeFilter.type
    levels = levels.filter(level => level.group_type === type)
    this.filters = filters
    this.type = type
    this.numItems = levels.length
    this.hasHigh = false
    this.items = levels.map(level => {
      const count = levels.filter(x => x.river_display === level.river_display).length
      const start = levels.findIndex(x => x.river_display === level.river_display) + 1
      return new Level(level, count, start)
    })
    const lons = levels.map(level => Number(level.lon))
    const lats = levels.map(level => Number(level.lat))
    this.bbox = lons.length && lats.length ? [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)] : []
  }
}
module.exports = Levels
