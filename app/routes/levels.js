const express = require('express')
const riverServices = require('../services/river')
const locationServices = require('../services/location')
const levelServices = require('../services/level')
const router = express.Router()
const River = require('../models/river')
// const Catchment = require('../models/catchment')
const Place = require('../models/place')
const Levels = require('../models/levels')
const ViewModel = require('../models/views/river-sea-groundwater-rainfall-levels')

// Get levels
router.get('/river-sea-groundwater-rainfall-levels', async (req, res) => {
  const cookie = req.headers.cookie || null
  const query = Object.assign({}, { searchType: '', search: '', type: '', error: '' }, req.query)
  const places = []
  const rivers = []
  let levels

  if (query.search !== '') {
    // Check places
    if (query.searchType === '' || query.searchType === 'place') {
      const locationResponse = await locationServices.getLocationsByQuery(query.search, query.searchType === 'place')
      if (locationResponse.status === 200) {
        const results = locationResponse.data.results
        if (results && results.length) {
          // We have one or more matches
          results.forEach(result => { places.push(new Place(result)) })
        }
      } else {
        // Log 500 error
        console.log('500 error: Location')
      }
    }
    // Check rivers
    if (query.searchType === '' || query.searchType === 'river') {
      // const service = query.searchType === 'river' ? 'getRiver' : 'getRivers'
      // const riverResponse = await riverServices[service](cookie, query.search)
      const riverResponse = await riverServices.getRivers(cookie, query.search)
      if (riverResponse.status === 200) {
        riverResponse.data.forEach(item => { rivers.push(new River(item)) })
      } else {
        // Log 500 error
        console.log('500 error: Rivers')
      }
    }
  }
  // Remove Bing broad 'admindivision2' match when we have a single river
  const isBingBroadRiverMatch = places.length === 1 && places[0].type === 'admindivision2' && rivers.length === 1
  places.length = isBingBroadRiverMatch ? 0 : places.length

  if (places.length === 1 && !rivers.length) {
    // We have a single place
    const levelResponse = await levelServices.getLevelsWithin(cookie, places[0].bboxBuffered)
    levels = new Levels(query.type, levelResponse.data)
  } else if (rivers.length === 1 && !places.length) {
    // We have a single river
    const levelResponse = await levelServices.getLevelsByRiver(cookie, rivers[0].display)
    levels = new Levels(query.type, levelResponse.data)
  }
  const model = new ViewModel(query, places, rivers, levels, query.error)
  res.render('levels', { model })
})

// Search levels
router.post('/river-sea-groundwater-rainfall-levels', async (req, res) => {
  res.redirect(`/river-sea-groundwater-rainfall-levels?search=${encodeURI(req.body.search)}`)
})

module.exports = router
