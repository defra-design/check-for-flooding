const express = require('express')
const router = express.Router()
const locationServices = require('../services/location')
const Place = require('../models/place')

router.get('/location', (req, res) => {
  res.redirect('/find-location')
})

router.get('/location/:location', async (req, res) => {
  const slug = req.params.location.toLowerCase()
  const response = await locationServices.getLocationBySlug(slug)
  if (response.status === 200) {
    if (response.data && response.data.result) {
      // We have a valid route
      const model = new Place(response.data.result)
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
