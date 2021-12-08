class Station {
  constructor (data) {
    const type = data.type
    this.id = data.id
    this.name = data.name
    this.isMulti = data.is_multi === 'TRUE'
    this.type = type
    this.river = data.river || (type === 'river' ? (data.river_name_wiski) : '')
    this.state = data.state
    this.status = data.status
    this.valueStatus = data.value_status
    if (data.range_top && data.range_bottom) {
      this.rangeTop = data.range_top
      this.rangeBottom = data.range_bottom
    }
    if (type === 'rainfall') {
      this.rainfall1hr = data.rainfall_1hr
      this.rainfall6hr = data.rainfall_6hr
      this.rainfall24hr = data.rainfall_24hr
      this.telemetryId = data.measure_rainfall_id
    } else {
      this.height = data.height_downstream || data.height
      if (data.upstream_id) {
        this.upstreamId = data.upstream_id
      }
      if (data.downstream_id) {
        this.downstreamId = data.downstream_id
      }
      this.telemetryId = data.measure_id
      this.telemetryDownstreamId = data.measure_downstream_id
    }
    this.date = data.date
    this.isWales = data.is_wales === 'TRUE'
    this.centroid = data.centroid.split(',').map(x => Math.round(parseFloat(x) * 100000) / 100000)
  }
}

module.exports = Station
