class StationTelemetry {
  constructor (telemetry) {
    const latestDateTime = telemetry.length && telemetry[0].dateTime
    this.latestDateTime = latestDateTime
    this.minutes = telemetry
  }
}
module.exports = StationTelemetry
