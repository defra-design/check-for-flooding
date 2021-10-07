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
    if (!warnings.groups.length) {
      model.isNoResults = true
    }
    res.render('flood-warnings-and-alerts', { model })
  } else {
    // Return 500 error
  }
})

// Search warnings
router.post('/flood-warnings-and-alerts', async (req, res) => {
  const queryTerm = req.body.location
  const model = { queryTerm: queryTerm }

  // Empty search
  if (queryTerm === '') {
    return res.redirect('/flood-warnings-and-alerts')
  }

  // Check places
  const locationResponse = await locationServices.getLocationsByQuery(queryTerm)
  const places = []
  if (locationResponse.status === 200) {
    if (locationResponse.data.results && locationResponse.data.results.length) {
      // We have some matches
      locationResponse.data.results.forEach(result => { places.push(new Place(result.GAZETTEER_ENTRY)) })
    }
  } else {
    // Log 500 error
    console.log('500 error: Location')
  }
  model.places = places

  if (!places.length) {
    // We have no matches
    model.isErrorLocation = true
    res.render('flood-warnings-and-alerts', { model })
  } else if (places.length === 1) {
    console.log(`/flood-warnings-and-alerts?place=${encodeURI(queryTerm)}`)
    // We have a single place
    res.redirect(`/flood-warnings-and-alerts?place=${encodeURI(queryTerm)}#`)
  } else if (places.filter(place => place.type !== 'postcode').length === 0) {
    // We have too many full postcodes
    model.isError = true
    model.isErrorPostcode = true
    res.render('flood-warnings-and-alerts', { model })
  } else {
    // We have multiple matches
    if (places.filter(place => place.type !== 'postcode').length === 0) {
      // We dont want to display hundreds of full postcodes
      model.places = []
    }
    model.isMultipleMatch = true
    res.render('flood-warnings-and-alerts', { model })
  }
})

module.exports = router
