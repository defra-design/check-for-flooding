const express = require('express')
const router = express.Router()
const warningServices = require('../services/warning')
const outlookServices = require('../services/outlook')
const locationServices = require('../services/location')
const Place = require('../models/place')
const Warnings = require('../models/warnings')
const Outlook = require('../models/outlook/outlook')
const ViewModel = require('../models/views/home')

// Add your routes here - above the module.exports line
router.get('/', async (req, res) => {
  const cookie = req.headers.cookie || null
  const outlookResponse = await outlookServices.getOutlook(cookie)
  const warningResponse = await warningServices.getWarningsWithin(cookie)
  if (outlookResponse.status === 200 && warningResponse.status === 200) {
    const warnings = new Warnings(warningResponse.data)
    const outlook = new Outlook(outlookResponse.data)
    const model = new ViewModel(warnings, outlook, null, null)
    res.render('home', { model })
  } else {
    // Return 500 error
  }
})

router.post('/', async (req, res) => {
  const query = { term: req.body.search }
  const places = []

  // Check places
  if (query.term !== '') {
    const locationResponse = await locationServices.getLocationsByQuery(query.term)
    if (locationResponse.status === 200) {
      if (locationResponse.data.results && locationResponse.data.results.length) {
        // We have some matches
        locationResponse.data.results.forEach(result => {
          places.push(new Place(result))
        })
      }
    } else {
      // Log 500 error
      console.log('500 error: Location')
    }
  }

  const model = new ViewModel(null, null, query, places, true)

  if (model.isErrorEmpty || model.isErrorPostcode) {
    res.redirect('/')
  } else if (model.isSinglePlace) {
    res.redirect(`/location/${places[0].slug}`)
  } else if (model.isMultipleMatch) {
    res.render('choose-location', { model })
  } else {
    res.render('location-not-found', { model })
  }
})

// PWA Offline
router.get('/offline', (req, res) => {
  res.render('offline')
})

module.exports = router
