class Station {
  constructor (data, variant = '') {
    this.id = data.id
    this.name = data.name
    this.isMulti = data.is_multi === 'TRUE'
    this.type = data.type
    this.river = data.river || (data.type === 'river' ? (data.river_name_wiski) : '')
    this.state = data.state
    this.status = data.status
    if (data.range_top && data.range_bottom) {
      this.rangeTop = data.range_top
      this.rangeBottom = data.range_bottom
    }
    if (variant !== 'rainfall') {
      this.height = variant === 'downstream' ? data.height_downstream : data.height
    } else {
      this.rainfall_1hr = data.rainfall_1hr
      this.rainfall_1hr = data.rainfall_6hrl
      this.rainfall_1hr = data.rainfall_24hr
    }
    this.date = data.date
    if (data.upstream_id) {
      this.upstreamId = data.upstream_id
    }
    if (data.downstream_id) {
      this.downstreamId = data.downstream_id
    }
    this.isWales = data.is_wales === 'TRUE'
    this.centroid = data.centroid.split(',').map(x => Math.round(parseFloat(x) * 100000) / 100000)
  }
}

module.exports = Station
