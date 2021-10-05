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

router.get('/location', (req, res) => {
  res.redirect('/find-location')
})

router.get('/location/:location', async (req, res) => {
  const slug = req.params.location.toLowerCase()
  const locationResponse = await locationServices.getLocationBySlug(slug)
  if (locationResponse.status === 200) {
    if (locationResponse.data && locationResponse.data.result) {
      // We have a valid route
      const place = new Place(locationResponse.data.result)
      const warningResponse = await warningServices.getWarningsWithin(place.bbox)
      const warnings = new Warnings(warningResponse.data)
      const levelResponse = await levelServices.getLevelsWithin(place.bboxBuffered)
      const levels = new Levels({}, place, {}, (levelResponse.data || []))
      const banner = new BannerLocation(place, warnings, levels)
      const outlookResponse = await outlookServices.getOutlook()
      const outlook = new Outlook(outlookResponse.data, { bbox2k: place.bbox })
      return res.render('location', { model: { place: place, banner: banner, outlook: outlook } })
    } else {
      // Return 404
      return res.status(404).render('404')
    }
  } else {
    // Return 500 error
  }
})

module.exports = router
