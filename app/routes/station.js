const express = require('express')
const router = express.Router()
const stationServices = require('../services/station')
const telemetryServices = require('../services/telemetry')
const Station = require('../models/station')
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
    // Rainfall telemetry
    if (station.type === 'rainfall') {
      telemetry = await telemetryServices.getRainfallTelemetry(station.telemetryId)
    }
    const model = new ViewModel(station, telemetry)
    return res.render(station.type === 'rainfall' ? 'rainfall' : 'station', { model })
  } else {
    // Return 500 error
  }
})

module.exports = router
