class Telemetry {
  constructor (observed, dataStart, dataEnd, rangeStart, rangeEnd, type) {
    this.type = type
    this.latestDateTime = observed.length ? observed[0].dateTime : null
    // this.rangeStartDateTime = rangeStart.toISOString().replace(/.\d+Z$/g, 'Z')
    // this.rangeEndDateTime = rangeEnd.toISOString().replace(/.\d+Z$/g, 'Z')
    this.dataStartDateTime = dataStart.toISOString().replace(/.\d+Z$/g, 'Z')
    this.dataEndDateTime = dataEnd.toISOString().replace(/.\d+Z$/g, 'Z')
    this.observed = observed
    this.forecast = []
  }
}
module.exports = Telemetry
