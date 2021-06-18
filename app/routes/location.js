const express = require('express')
const router = express.Router()
const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY

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
      // Found a match
      if (response.data.header.totalresults > 0) {
        const gazetteerEntry = response.data.results[0].GAZETTEER_ENTRY
        const country = gazetteerEntry.COUNTRY
        const localType = gazetteerEntry.LOCAL_TYPE
        const name = gazetteerEntry.NAME1
        const countyUnity = gazetteerEntry.COUNTY_UNITARY
        const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
        const model = {}
        if (localType === 'Postcode') {
          model.slug = name.replace(/\s+/g, '-').toLowerCase()
          model.name = `${name}, ${(countyUnity || districtBorough)}`
        } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
          model.slug = name.replace(/\s+/g, '-').toLowerCase()
          model.name = name
        } else if (countyUnity || districtBorough) {
          model.slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${(countyUnity || districtBorough).replace(/\s+/g, '-').toLowerCase()}`
          model.name = `${name}, ${(countyUnity || districtBorough)}`
        }
        // Valid url and region
        if (country === 'England' && query === model.slug) {
          return res.render('location', model)
        }
      }
      // Return 404 error
      return res.status(404).render('404')
    }
    // Return 500 error
  })
})

module.exports = router
