const express = require('express')
const router = express.Router()
const targetAreaServices = require('../services/target-area')
const TargetArea = require('../models/target-area')
const Level = require('../models/level')
const ViewModel = require('../models/views/target-area')

router.get('/target-area', (req, res) => {
  res.redirect('/flood-warnings-and-alerts')
})

router.get('/target-area/:id', async (req, res) => {
  const cookie = req.headers.cookie || null
  const id = req.params.id.toLowerCase()
  const targetAreaResponse = await targetAreaServices.getTargetArea(cookie, id)
  if (targetAreaResponse.status === 200) {
    if (!targetAreaResponse.data) {
      return res.status(404).render('404')
    }
    const targetArea = new TargetArea(targetAreaResponse.data)
    const model = new ViewModel(targetArea)
    return res.render('target-area', { model })
  } else {
    // Return 500 error
  }
})

module.exports = router
