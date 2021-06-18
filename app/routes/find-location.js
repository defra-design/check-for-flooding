const express = require('express')
const router = express.Router()
const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', async (req, res) => {
  const model = { query: req.body.location }
  const locations = []
  if (model.query === '') {
    model.isError = true
    return res.render('find-location', { model })
  }
  const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
  const uri = `https://api.os.uk/search/names/v1/find?query=${model.query}&fq=${types}&key=${apiKey}`
  const response = await axios.get(uri).then((response) => {
    return response
  })
  if (response.status === 200) {
    // Filter results to remove non England and where names dont match
    const results = response.data.results && response.data.results.filter(result =>
      result.GAZETTEER_ENTRY.COUNTRY === 'England' && result.GAZETTEER_ENTRY.NAME1 === response.data.results[0].GAZETTEER_ENTRY.NAME1)
    // We have some matches
    if (results.length) {
      results.forEach(result => {
        const gazetteerEntry = result.GAZETTEER_ENTRY
        const localType = gazetteerEntry.LOCAL_TYPE
        const name = gazetteerEntry.NAME1
        const countyUnity = gazetteerEntry.COUNTY_UNITARY
        const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
        // Construct the slug
        const location = {}
        if (localType === 'Postcode') {
          location.slug = name.replace(/\s+/g, '-').toLowerCase()
          location.name = `${name}, ${(countyUnity || districtBorough)}`
        } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
          location.slug = name.replace(/\s+/g, '-').toLowerCase()
          location.name = name
        } else if (countyUnity || districtBorough) {
          location.slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${(countyUnity || districtBorough).replace(/\s+/g, '-').toLowerCase()}`
          location.name = `${name}, ${(countyUnity || districtBorough)}`
        }
        locations.push(location)
      })
      model.locations = locations
      console.log(model)
      if (results.length === 1) {
        res.redirect(`/location/${model.locations[0].slug}`)
      } else {
        res.render('choose-location', { model })
      }
    }
  } else {
    // Return 500 eror
    console.log('500 error')
  }
})

module.exports = router
