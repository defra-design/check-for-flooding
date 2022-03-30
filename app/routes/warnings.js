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
  let place
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
  const warningResponse = await warningServices.getWarningsWithin(place ? place.bbox : [])
  if (warningResponse.status === 200) {
    const warnings = new Warnings(warningResponse.data)
    const model = new ViewModel(queryTerm, place, null, warnings)
    res.render('warnings', { model })
  } else {
    // Return 500 error
  }
})

// Search warnings
router.post('/flood-warnings-and-alerts', async (req, res) => {
  const queryTerm = req.body.location
  // Empty search
  if (queryTerm === '') {
    return res.redirect('/warnings')
  }
  // Check places
  const locationResponse = await locationServices.getLocationsByQuery(queryTerm)
  const places = []
  if (locationResponse.status === 200) {
    if (locationResponse.data.results && locationResponse.data.results.length) {
      // We have some matches
      // locationResponse.data.results.forEach(result => { places.push(new Place(result)) })
      locationResponse.data.results.forEach(result => { places.push(new Place(result.GAZETTEER_ENTRY)) })
    }
  } else {
    // Log 500 error
    console.log('500 error: Location')
  }
  const model = new ViewModel(queryTerm, null, places, null)
  if (model.isSingleMatch) {
    res.redirect(`/warnings?place=${encodeURI(queryTerm)}#`)
  } else {
    res.render('warnings', { model })
  }
})

module.exports = router
