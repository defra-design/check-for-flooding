const express = require('express')
const router = express.Router()
const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY
const Location = require('../models/place')

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
  const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
  const uri = `https://api.os.uk/search/names/v1/find?query=${model.query}&fq=${types}&key=${apiKey}`
  const response = await axios.get(uri).then((response) => {
    return response
  })
  if (response.status === 200) {
    let results = []
    if (response.data && response.data.results) {
      // Remove non-England results
      results = response.data.results.filter(result => result.GAZETTEER_ENTRY.COUNTRY === 'England')
      // Remove fuzzy matches
      results = results.filter(result => result.GAZETTEER_ENTRY.NAME1.toLowerCase().includes(model.query.toLowerCase()))
      // Remove duplicates (OS API bug?)
      results = Array.from(new Map(results.map(result => [result.GAZETTEER_ENTRY.ID, result])).values())
    }
    if (results.length) {
      // We have some matches
      const places = []
      results.forEach(result => {
        places.push(new Location(result.GAZETTEER_ENTRY))
      })
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