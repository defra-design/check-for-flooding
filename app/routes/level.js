const express = require('express')
const riverServices = require('../services/river')
const router = express.Router()
const River = require('../models/river')
const Level = require('../models/level')

// Add your routes here - above the module.exports line
router.get('/levels/:river', async (req, res) => {
  const slug = req.params.river.toLowerCase()
  const response = await riverServices.getRiverDetail(slug)
  if (response.status === 200) {
    if (response.data) {
      // We have a valid route
      const model = new River(response.data[0])
      const levels = []
      response.data.forEach((item, index) => {
        if (index >= 1) {
          levels.push(new Level(item))
        }
      })
      model.levels = levels
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
