const express = require('express')
const riverServices = require('../services/river')
const router = express.Router()
const River = require('../models/river')

// Add your routes here - above the module.exports line
router.get('/levels/:river', async (req, res) => {
  const slug = req.params.river.toLowerCase()
  const response = await riverServices.getRiver(slug)
  if (response.status === 200) {
    if (response.data && response.data) {
      // We have a valid route
      const model = new River(response.data)
      return res.render('river', { model })
    } else {
      // Return 404
      return res.status(404).render('404')
    }
  } else {
    // Return 500 error
  }
})

module.exports = router
