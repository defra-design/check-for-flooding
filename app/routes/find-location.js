const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const Place = require('../models/place')
const ViewModel = require('../models/views/find-location')

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', async (req, res) => {
  const query = { term: req.body.place }
  const places = []

  // Check places
  if (query.term !== '') {
    const locationResponse = await locationServices.getLocationsByQuery(query.term)
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
  }
  const model = new ViewModel(query, places, true)

  if (model.isErrorEmpty || model.isErrorPostcode) {
    res.render('find-location', { model })
  } else if (model.isSinglePlace) {
    res.redirect(`/location/${places[0].slug}`)
  } else if (model.isMultipleMatch) {
    res.render('choose-location', { model })
  } else {
    res.render('location-not-found', { model })
  }
})

module.exports = router
