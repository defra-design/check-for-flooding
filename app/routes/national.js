const express = require('express')
const router = express.Router()
const warningServices = require('../services/warning')
const outlookServices = require('../services/outlook')
const Warnings = require('../models/warnings')
const Outlook = require('../models/outlook/outlook')
const ViewModel = require('../models/views/national')

// Add your routes here - above the module.exports line
router.get('/', async (req, res) => {
  const cookie = req.headers.cookie || null
  const outlookResponse = await outlookServices.getOutlook(cookie)
  const warningResponse = await warningServices.getWarningsWithin(cookie)
  if (outlookResponse.status === 200 && warningResponse.status === 200) {
    const warnings = new Warnings(warningResponse.data)
    const outlook = new Outlook(outlookResponse.data)
    const model = new ViewModel(warnings, outlook)
    res.render('national', { model })
  } else {
    // Return 500 error
  }
})

// PWA Offline
router.get('/offline', (req, res) => {
  res.render('offline')
})

module.exports = router
