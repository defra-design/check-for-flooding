const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const warningServices = require('../services/warning')
const Place = require('../models/place')
const Warnings = require('../models/warnings')
const ViewModel = require('../models/views/flood-warnings-and-alerts')

// Get levels
router.get('/flood-warnings-and-alerts', async (req, res) => {
  const queryTerm = req.query.place
  // Get place
  let place = {}
  if (queryTerm && queryTerm !== '') {
    const locationResponse = await locationServices.getLocationByQuery(queryTerm)
    if (locationResponse.status === 200) {
      if (!(locationResponse.data && locationResponse.data.result)) {
        return res.status(404).render('404')
      }
      place = new Place(locationResponse.data.result)
    } else {
      // Return 500 error
    }
  }
  // Get warnings
  const warningResponse = await warningServices.getWarningsWithin(place.bbox || [])
  if (warningResponse.status === 200) {
    const warnings = new Warnings(warningResponse.data)
    const model = new ViewModel(queryTerm, place, warnings)
    res.render('flood-warnings-and-alerts', { model })
  } else {
    // Return 500 error
  }
})

module.exports = router
