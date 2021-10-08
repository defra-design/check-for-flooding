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
  const query = req.query
  let model
  if (query.river && query.river !== '') {
    // River query
    const term = decodeURI(query.river)
    const riverResponse = await riverServices.getRiverDetail(term)
    if (riverResponse.status === 200) {
      if (!(riverResponse.data && Object.keys(riverResponse.data).length)) {
        return res.render('404')
      }
    } else {
      // Return 500 error
    }
    const river = new River(riverResponse.data)
    const levelResponse = await levelServices.getLevelsByRiver(term)
    const levels = new Levels(query.filters, {}, river, levelResponse.data || [])
    model = new ViewModel(query, null, null, river, null, levels)
  } else if (query.place && query.place !== '') {
    // Place query
    const term = decodeURI(query.place)
    const locationResponse = await locationServices.getLocationByQuery(term)
    // Get place
    if (locationResponse.status === 200) {
      if (!(locationResponse.data && locationResponse.data.result)) {
        return res.status(404).render('404')
      }
    } else {
      // Return 500 error
      return res.status(503).render('500')
    }
    const place = new Place(locationResponse.data.result)
    const levelResponse = await levelServices.getLevelsWithin(place.bboxBuffered)
    const levels = new Levels(query.filters, place, {}, levelResponse.data || [])
    model = new ViewModel(query, place, null, null, null, levels)
  } else {
    model = new ViewModel(query, null, null, null, null, null)
  }
  res.render('river-sea-groundwater-rainfall-levels', { model })
})

// Search levels
router.post('/river-sea-groundwater-rainfall-levels', async (req, res) => {
  // const queryTerm = req.body.location
  const query = { term: req.body.location }
  const places = []
  let rivers = []

  // Empty search
  // if (queryTerm === '') {
  //   return res.render('river-sea-groundwater-rainfall-levels', { model })
  // }

  // Check places
  if (query.term !== '') {
    const locationResponse = await locationServices.getLocationsByQuery(query.term)
    if (locationResponse.status === 200) {
      if (locationResponse.data.results && locationResponse.data.results.length) {
        // We have some matches
        locationResponse.data.results.forEach(result => { places.push(new Place(result.GAZETTEER_ENTRY)) })
      }
    } else {
      // Log 500 error
      console.log('500 error: Location')
    }

    // Check rivers
    const riverResponse = await riverServices.getRivers(query.term)
    if (riverResponse.status === 200) {
      rivers = riverResponse.data
    } else {
      // Log 500 error
      console.log('500 error: Rivers')
    }
  }
  const model = new ViewModel(query, null, places, null, rivers, null, true)

  if (model.isSinglePlace) {
    res.redirect(`/river-sea-groundwater-rainfall-levels?place=${encodeURI(query.term)}#`)
  } else if (model.isSingleRiver) {
    res.redirect(`/river-sea-groundwater-rainfall-levels?river=${encodeURI(query.term)}#`)
  } else {
    res.render('river-sea-groundwater-rainfall-levels', { model })
  }
})

router.post('/filter-levels', async (req, res) => {
  const { type, term } = req.body
  const filters = req.body.filters ? Array.isArray(req.body.filters) ? req.body.filters.join(',') : req.body.filters : ''
  res.redirect(`/river-sea-groundwater-rainfall-levels?${type}=${term}&filters=${filters}#`)
})

module.exports = router
