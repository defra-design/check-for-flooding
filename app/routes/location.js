const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const warningServices = require('../services/warning')
const outlookServices = require('../services/outlook')
const levelServices = require('../services/level')
const Place = require('../models/place')
const Warnings = require('../models/warnings')
const Levels = require('../models/levels')
const Outlook = require('../models/outlook/outlook-tabs')
const BannerLocation = require('../models/banner-location')
const ViewModel = require('../models/views/location')

router.get('/location', (req, res) => {
  res.redirect('/')
})

router.get('/location/:location', async (req, res) => {
  const cookie = req.headers.cookie || null
  const referrer = req.get('Referrer')
  const slug = req.params.location.toLowerCase()
  const locationResponse = await locationServices.getLocationBySlug(slug)
  if (locationResponse.status === 200) {
    if (locationResponse.data && locationResponse.data.result) {
      // We have a valid route
      const place = new Place(locationResponse.data.result)
      const warningResponse = await warningServices.getWarningsWithin(cookie, place.bbox)
      const levelResponse = await levelServices.getLevelsWithin(cookie, place.bboxBuffered)
      const outlookResponse = await outlookServices.getOutlook(cookie)
      const warnings = new Warnings(warningResponse.data)
      const levels = new Levels(null, levelResponse.data)
      const banner = new BannerLocation(place, warnings, levels)
      const outlook = new Outlook(outlookResponse.data, { bbox2k: place.bbox })
      const model = new ViewModel(place, banner, outlook, referrer)
      return res.render('location', { model })
    } else {
      // Return 404
      return res.status(404).render('404')
    }
  } else {
    // Return 500 error
  }
})

module.exports = router
