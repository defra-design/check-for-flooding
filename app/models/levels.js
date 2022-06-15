const Level = require('./level')

class Levels {
  constructor (type, levels) {
    const filters = ['river', 'sea', 'rainfall', 'groundwater'].map(item => ({
      type: item,
      count: levels.filter(level => level.group_type === item).length
    }))
    const activeFilter = filters.find(x => x.type === type) || filters.find(x => x.count > 0) || filters[0]
    type = activeFilter.type
    this.filters = filters
    this.type = type
    this.items = levels.map(level => { return new Level(level) })
    this.numFilteredItems = !!levels.filter(x => x.group_type === type).length
    this.hasHigh = false // Used on location pages
    const lons = levels.map(level => Number(level.lon))
    const lats = levels.map(level => Number(level.lat))
    this.bbox = lons.length && lats.length ? [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)] : []
  }
}
module.exports = Levels
