const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const Place = require('../models/place')

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
  // const river = new Location({
  //   NAME1: 'River Eden',
  //   LOCAL_TYPE: 'River'
  // })
  // Check places
  const response = await locationServices.getLocations(model.query)
  if (response.status === 200) {
    if (response.data.results.length) {
      // We have some matches
      const places = []
      response.data.results.forEach(result => { places.push(new Place(result.GAZETTEER_ENTRY)) })
      model.places = places
      if (places.length === 1) {
        // We have a single match
        res.redirect(`/location/${places[0].slug}`)
      } else if (places.filter(place => place.type !== 'postcode').length === 0) {
        // We have multiple postcodes
        model.isError = true
        model.isErrorPostcode = true
        res.render('find-location', { model })
      } else {
        // We have multiple matches
        res.render('choose-location', { model })
      }
    } else {
      // We have no matches
      res.render('location-not-found', { model })
    }
  } else {
    // Return 500 error
    console.log('500 error')
  }
})

module.exports = router
