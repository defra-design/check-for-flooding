const express = require('express')
const router = express.Router()
const stationServices = require('../services/station')
const Station = require('../models/station')
const StationViewModel = require('../models/views/station')
const RainfallViewModel = require('../models/views/rainfall')

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
    const response = new Station(stationResponse.data)
    if (response.type === 'rainfall') {
      const model = new RainfallViewModel(response)
      return res.render('rainfall', { model })
    } else {
      const model = new StationViewModel(response)
      return res.render('station', { model })
    }
  } else {
    // Return 500 error
  }
})

module.exports = router
