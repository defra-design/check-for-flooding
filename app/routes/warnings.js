const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const warningServices = require('../services/warning')
const Place = require('../models/place')
const Warnings = require('../models/warnings')
const ViewModel = require('../models/views/flood-warnings-and-alerts')

// Get warnings
router.get('/flood-warnings-and-alerts', async (req, res) => {
  const cookie = req.headers.cookie || null
  const querySearch = req.query.search
  const places = []
  if (querySearch !== '') {
    // Check places
    const locationResponse = await locationServices.getLocationsByQuery(querySearch)
    if (locationResponse.status === 200) {
      if (locationResponse.data.results && locationResponse.data.results.length) {
        // We have some matches
        locationResponse.data.results.forEach(result => { places.push(new Place(result)) })
      }
    } else {
      // Log 500 error
      console.log('500 error: Location')
    }
  }
  const warningResponse = await warningServices.getWarningsWithin(cookie, places.length === 1 ? places[0].bboxBuffered : null)
  const warnings = new Warnings(warningResponse.data)
  const model = new ViewModel(querySearch, places, warnings)
  res.render('warnings', { model })
})

// Search warnings
router.post('/flood-warnings-and-alerts', async (req, res) => {
  res.redirect(`/flood-warnings-and-alerts?search=${encodeURI(req.body.search)}`)
})

module.exports = router
