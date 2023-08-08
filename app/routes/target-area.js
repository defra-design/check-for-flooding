const express = require('express')
const router = express.Router()
const targetAreaServices = require('../services/target-area')
const levelServices = require('../services/level')
const TargetArea = require('../models/target-area')
const TargetAreaViewModel = require('../models/views/target-area')
const Levels = require('../models/levels')
const LevelsViewModel = require('../models/views/river-sea-groundwater-rainfall-levels')

router.get('/target-area', (req, res) => {
  res.redirect('/flood-warnings-and-alerts')
})

router.get('/target-area/:id', async (req, res) => {
  const cookie = req.headers.cookie || null
  const id = req.params.id.toLowerCase()
  const ab = req.query.t || 'a'
  const targetAreaResponse = await targetAreaServices.getTargetArea(cookie, id)
  if (targetAreaResponse.status === 200) {
    const targetArea = new TargetArea(targetAreaResponse.data)
    const model = new TargetAreaViewModel(targetArea)
    model.ab = ab
    return res.render('target-area', { model })
  } else if (targetAreaResponse.status === 404) {
    return res.status(404).render('404')
  } else {
    // Return 500 error
  }
})

router.get('/target-area/:id/levels', async (req, res) => {
  const cookie = req.headers.cookie || null
  const id = req.params.id.toLowerCase()
  const levelResponse = await levelServices.getLevelsByTargetAreaTrigger(cookie, id)
  if (levelResponse.status === 200) {
    if (!levelResponse.data) {
      return res.status(404).render('404')
    }
    const targetAreaResponse = await targetAreaServices.getTargetArea(cookie, id)
    const targetArea = new TargetArea(targetAreaResponse.data)
    const levels = new Levels('river', levelResponse.data)
    const name = `${targetArea.name} flood ${targetArea.type} area`
    const model = new LevelsViewModel({ search: name, searchType: 'trigger' }, null, null, levels, null)
    return res.render('levels', { model })
  } else {
    // Return 500 error
  }
})

module.exports = router
