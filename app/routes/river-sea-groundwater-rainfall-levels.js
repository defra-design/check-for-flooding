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
  const query = {
    term: decodeURI(req.query.river || req.query.place),
    type: req.query.river ? 'river' : (req.query.place ? 'place' : ''),
    filters: req.query.filters
  }
  if (query.term !== '' && query.type === 'river') {
    // We have a river query
    let response = await riverServices.getRiverDetail(query.term)
    if (response.status === 200) {
      if (!(response.data && Object.keys(response.data).length)) {
        return res.render('404')
      }
    } else {
      // Return 500 error
    }
    const river = new River(response.data)
    response = await levelServices.getLevelsByRiver(query.term)
    const levels = new Levels(query, {}, river, response.data || [])
    const model = new ViewModel(query, {}, river, levels)
    return res.render('river-sea-groundwater-rainfall-levels', { model })
  } else if (query.term !== '' && query.type === 'place') {
    // A place query
    let response = await locationServices.getLocationByQuery(query.term)
    // Get place
    if (response.status === 200) {
      if (!(response.data && response.data.result)) {
        return res.status(404).render('404')
      }
    } else {
      // Return 500 error
      return res.status(503).render('500')
    }
    const place = new Place(response.data.result)
    response = await levelServices.getLevelsWithin(place.bboxBuffered)
    const levels = new Levels(query, place, {}, response.data || [])
    const model = new ViewModel(query, place, {}, levels)
    return res.render('river-sea-groundwater-rainfall-levels', { model })
  } else {
    // No query
    res.render('river-sea-groundwater-rainfall-levels')
  }
})

// Search levels
router.post('/river-sea-groundwater-rainfall-levels', async (req, res) => {
  const queryTerm = req.body.location
  const model = { queryTerm: queryTerm }

  // Empty search
  if (queryTerm === '') {
    return res.render('river-sea-groundwater-rainfall-levels', { model })
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

  // Check rivers
  const riverResponse = await riverServices.getRivers(queryTerm)
  let rivers = []
  if (riverResponse.status === 200) {
    rivers = riverResponse.data
  } else {
    // Log 500 error
    console.log('500 error: Rivers')
  }
  model.rivers = rivers

  if (!places.length && !rivers.length) {
    // We have no matches
    model.isNoResults = true
    res.render('river-sea-groundwater-rainfall-levels', { model })
  } else if (places.length === 1 && !rivers.length) {
    // We have a single place
    res.redirect(`/river-sea-groundwater-rainfall-levels?place=${encodeURI(queryTerm)}#`)
  } else if (rivers.length === 1 && !places.length) {
    // We have a single river
    res.redirect(`/river-sea-groundwater-rainfall-levels?river=${encodeURI(queryTerm)}#`)
  } else if (places.filter(place => place.type !== 'postcode').length === 0 && !rivers.length) {
    // We have too many full postcodes
    model.isError = true
    model.isErrorPostcode = true
    res.render('river-sea-groundwater-rainfall-levels', { model })
  } else {
    // We have multiple matches
    if (places.filter(place => place.type !== 'postcode').length === 0) {
      // We dont want to display hundreds of full postcodes
      model.places = []
    }
    model.isMultipleMatch = true
    res.render('river-sea-groundwater-rainfall-levels', { model })
  }
})

router.post('/filter-levels', async (req, res) => {
  const { type, term } = req.body
  const filters = req.body.filters ? Array.isArray(req.body.filters) ? req.body.filters.join(',') : req.body.filters : ''
  res.redirect(`/river-sea-groundwater-rainfall-levels?${type}=${term}&filters=${filters}#`)
})

module.exports = router
