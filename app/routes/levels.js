const express = require('express')
const riverServices = require('../services/river')
const locationServices = require('../services/location')
const levelServices = require('../services/level')
const router = express.Router()
const River = require('../models/river')
const Place = require('../models/place')
const Levels = require('../models/levels')
const ViewModel = require('../models/views/river-sea-groundwater-rainfall-levels')

// Get levels
router.get('/river-sea-groundwater-rainfall-levels', async (req, res) => {
  const query = Object.assign({}, { search: '', type: '' }, req.query)
  const places = []
  const rivers = []
  let levels

  if (query.search !== '') {
    // Check places
    const locationResponse = await locationServices.getLocationsByQuery(query.search)
    if (locationResponse.status === 200) {
      if (locationResponse.data.results && locationResponse.data.results.length) {
        // We have some matches
        locationResponse.data.results.forEach(result => { places.push(new Place(result)) })
      }
    } else {
      // Log 500 error
      console.log('500 error: Location')
    }
    // Check rivers
    const riverResponse = await riverServices.getRivers(query.search)
    if (riverResponse.status === 200) {
      riverResponse.data.forEach(item => { rivers.push(new River(item)) })
    } else {
      // Log 500 error
      console.log('500 error: Rivers')
    }
  }
  if (places.length === 1 && !rivers.length) {
    // We have a single place
    const levelResponse = await levelServices.getLevelsWithin(places[0].bboxBuffered)
    levels = new Levels(query.type, levelResponse.data)
  } else if (rivers.length === 1 && !places.length) {
    // We have a single river
    const levelResponse = await levelServices.getLevelsByRiver(rivers[0].slug)
    levels = new Levels(query.type, levelResponse.data)
  }
  const model = new ViewModel(query, places, rivers, levels)
  res.render('levels', { model })
})

// Search levels
router.post('/river-sea-groundwater-rainfall-levels', async (req, res) => {
  res.redirect(`/river-sea-groundwater-rainfall-levels?search=${encodeURI(req.body.search)}`)
})

module.exports = router
