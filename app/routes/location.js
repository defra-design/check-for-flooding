const express = require('express')
const router = express.Router()
const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY
const Place = require('../models/place')

router.get('/location', (req, res) => {
  res.redirect('/find-location')
})

router.get('/location/:location', async (req, res) => {
  const query = req.params.location.toLowerCase()
  const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
  const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&maxresults=1&key=${apiKey}`
  axios.get(uri).then(function (response) {
    // Successful response
    if (response.status === 200) {
      // Found one or more matches
      if (response.data.header.totalresults > 0) {
        // Select first choice
        const gazetteerEntry = response.data.results[0].GAZETTEER_ENTRY
        const model = new Place(gazetteerEntry)
        // We have a valid url and region
        if (gazetteerEntry.COUNTRY === 'England' && query === model.slug) {
          return res.render('location', { model })
        }
      }
      // Return 404 error
      return res.status(404).render('404')
    }
    // Return 500 error
  })
})

module.exports = router
