const express = require('express')
const utils = require('../utils')
const riverServices = require('../services/river')
const locationServices = require('../services/location')
const levelServices = require('../services/level')
const router = express.Router()
const River = require('../models/river')
const Level = require('../models/level')
const Place = require('../models/place')

// Add your routes here - above the module.exports line
router.get('/levels/location/:location', async (req, res) => {
  const slug = req.params.location.toLowerCase()
  let response = await locationServices.getLocation(slug)
  const model = {}

  // Get place
  if (response.status === 200) {
    if (response.data && response.data.result) {
      // We have a valid location
      model.place = new Place(response.data.result)
    } else {
      // Return 404
      return res.status(404).render('404')
    }
  } else {
    // Return 500 error
    return res.status(503).render('500')
  }

  // Get levels
  if (model.place) {
    response = await levelServices.getLevelsWithin(model.place.bboxBuffered)
    if (response.data) {
      const levels = utils.groupBy(response.data, 'group_name')
      Object.entries(levels).forEach(([key, value]) => {
        value.forEach((item, index) => {
          levels[key][index] = new Level(item)
        })
      })
      model.numLevels = response.data.length
      model.levels = levels
    }
  }

  return res.render('levels', { model })
})

// Add your routes here - above the module.exports line
router.get('/levels/:river', async (req, res) => {
  const slug = req.params.river.toLowerCase()
  const response = await riverServices.getRiverDetail(slug)
  if (response.status === 200) {
    if (response.data) {
      // We have a valid route
      const river = new River(response.data[0])
      const levels = []
      response.data.forEach((item, index) => {
        if (index >= 1) {
          const level = new Level(item)
          levels.push(level)
        }
      })
      const model = {
        river: river,
        levels: levels
      }
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
