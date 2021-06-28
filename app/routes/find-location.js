const express = require('express')
const router = express.Router()
const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY
const Location = require('../models/location')

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', async (req, res) => {
  const model = { query: req.body.location }
  if (model.query === '') {
    model.isError = true
    return res.render('find-location', { model })
  }
  const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
  const uri = `https://api.os.uk/search/names/v1/find?query=${model.query}&fq=${types}&key=${apiKey}`
  const response = await axios.get(uri).then((response) => {
    return response
  })
  if (response.status === 200) {
    // Filter results to remove non England and where names don't match
    const results = response.data.results && response.data.results.filter(result =>
      result.GAZETTEER_ENTRY.COUNTRY === 'England' && result.GAZETTEER_ENTRY.NAME1 === response.data.results[0].GAZETTEER_ENTRY.NAME1)
    // We have some matches
    if (results.length) {
      const locations = []
      results.forEach(result => {
        locations.push(new Location(result.GAZETTEER_ENTRY))
      })
      model.locations = locations
      if (locations.length === 1) {
        // We have a single match
        res.redirect(`/location/${locations[0].slug}`)
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

router.post('/choose-location', (req, res) => {
  if (req.body.place) {
    res.redirect(`/location/${req.body.place}`)
  } else {
    const model = JSON.parse(req.body.model)
    model.isError = true
    return res.render('choose-location', { model })
  }
})

module.exports = router
