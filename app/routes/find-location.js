const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const Place = require('../models/place')

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', async (req, res) => {
  const query = req.body.place
  const model = { query: query }
  if (query === '') {
    model.isError = true
    model.isErrorEmpty = true
    return res.render('find-location', { model })
  }

  // Check places
  const places = []
  const locationResponse = await locationServices.getLocationsByQuery(model.query)
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
    res.render('location-not-found', { model })
  } else if (places.length === 1) {
    // We have a single match
    res.redirect(`/location/${places[0].slug}`)
  } else if (places.filter(place => place.type !== 'postcode').length === 0) {
    // We have too many full postcodes
    model.isError = true
    model.isErrorPlace = true
    model.isErrorPostcode = true
    res.render('find-location', { model })
  } else {
    // We have multiple matches
    if (places.filter(place => place.type !== 'postcode').length === 0) {
      // We dont want to display hundreds of full postcodes
      model.places = []
    }
    res.render('choose-location', { model })
  }
})

module.exports = router
