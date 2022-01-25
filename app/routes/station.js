const express = require('express')
const router = express.Router()
const stationServices = require('../services/station')
const telemetryServices = require('../services/telemetry')
const locationServices = require('../services/location')
const Station = require('../models/station')
const StationTelemetry = require('../models/station-telemetry')
const Place = require('../models/place')
const ViewModel = require('../models/views/station')
const moment = require('moment-timezone')

router.get('/station', (req, res) => {
  res.redirect('/river-sea-groundwater-rainfall-levels')
})

router.get('/station/:id', async (req, res) => {
  const id = req.params.id.toLowerCase()
  const stationResponse = await stationServices.getStation(id)
  let telemetry, station, place
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    // Station details
    station = new Station(stationResponse.data)
    if (station.type === 'rainfall') {
      // Rainfall telemetry
      const telemetryId = /[^/]*$/.exec(station.telemetryId)[0]
      const start = moment().subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
      const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
      telemetry = await telemetryServices.getRainfallTelemetry(telemetryId, start, end)
      telemetry = telemetry.data
    } else {
      // River, tide and groundwater telemetry
      telemetry = new StationTelemetry(await telemetryServices.getStationTelemetry(station.telemetryId))
    }
  } else {
    // Return 500 error
  }
  const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  if (locationResponse.status === 200) {
    if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
      return res.status(404).render('404')
    }
    // Station details
    place = new Place(locationResponse.data.resourceSets[0].resources[0])
  } else {
    // Return 500 error
  }
  const model = new ViewModel(station, telemetry, place)
  return res.render(station.type === 'rainfall' ? 'rainfall' : 'station', { model })
})

module.exports = router
