const express = require('express')
const router = express.Router()
const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY

// Add your routes here - above the module.exports line
router.get('/location/:location', (req, res) => {
  const query = req.params.location
  const types = ['postcode', 'hamlet', 'village', 'town', 'city'].map(i => `local_type:${i}`).join(' ')
  const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&maxresults=5&key=${apiKey}`
  console.log(uri)
  async function find () {
    axios.get(uri)
      .then(function (response) {
        console.log(JSON.stringify(response.data, null, 2))
        // Construct a friendly url
        res.render('location')
      })
  }
  find()
})

module.exports = router
