const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const riverServices = require('../services/river')
const Place = require('../models/place')
const river = require('../services/river')

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', async (req, res) => {
  const model = { query: req.body.location }
  if (model.query === '') {
    model.isError = true
    model.isErrorEmpty = true
    return res.render('find-location', { model })
  }

  // Check rivers
  let rivers = []
  const riverResponse = await riverServices.getRivers(model.query)
  if (riverResponse.status === 200) {
    rivers = riverResponse.data
  } else {
    // Return 500 error
    console.log('500 error: Rivers')
  }
  model.rivers = rivers

  // Check places
  const places = []
  const locationResponse = await locationServices.getLocations(model.query)
  if (locationResponse.status === 200) {
    if (locationResponse.data.results && locationResponse.data.results.length) {
      // We have some matches
      locationResponse.data.results.forEach(result => { places.push(new Place(result.GAZETTEER_ENTRY)) })
    }
  } else {
    // Return 500 error
    console.log('500 error: Location')
  }
  model.places = places

  // Routing
  if (!places.length && !rivers.length) {
    // We have no matches
    res.render('location-not-found', { model })
  } else if (places.length === 1 && !rivers.length) {
    // We have a single location
    res.redirect(`/location/${places[0].slug}`)
  } else if (rivers.length === 1 && !places.length) {
    // We have a single river
    res.redirect(`/levels/${rivers[0].slug}`)
  } else if (places.filter(place => place.type !== 'postcode').length === 0 && !rivers.length) {
    // We have too many full postcodes
    model.isError = true
    model.isErrorPostcode = true
    res.render('find-location', { model })
  } else {
    // We have multiple matches
    if (places.filter(place => place.type !== 'postcode').length === 0) {
      // We dont want to disoplay hundreds of full postcodes
      model.places = []
    }
    res.render('choose-location', { model })
  }
})

module.exports = router
