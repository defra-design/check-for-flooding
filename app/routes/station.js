const express = require('express')
const router = express.Router()
const stationServices = require('../services/station')
const telemetryServices = require('../services/telemetry')
const Station = require('../models/station')
const StationTelemetry = require('../models/station-telemetry')
const RainfallTelemetry = require('../models/rainfall-telemetry')
const ViewModel = require('../models/views/station')

router.get('/station', (req, res) => {
  res.redirect('/river-sea-groundwater-rainfall-levels')
})

router.get('/station/:id', async (req, res) => {
  const id = req.params.id.toLowerCase()
  const stationResponse = await stationServices.getStation(id)
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    // Station details
    const station = new Station(stationResponse.data)
    let telemetry
    if (station.type === 'rainfall') {
      // Rainfall telemetry
      telemetry = new RainfallTelemetry(await telemetryServices.getRainfallTelemetry(station.telemetryId))
    } else {
      // River, tide and groundwater telemetry
      telemetry = new StationTelemetry(await telemetryServices.getStationTelemetry(station.telemetryId))
    }
    const model = new ViewModel(station, telemetry)
    return res.render(station.type === 'rainfall' ? 'rainfall' : 'station', { model })
  } else {
    // Return 500 error
  }
})

module.exports = router
