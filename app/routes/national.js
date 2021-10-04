const express = require('express')
const router = express.Router()
const warningServices = require('../services/warning')
const outlookServices = require('../services/outlook')
const Warnings = require('../models/warnings')
const Outlook = require('../models/outlook/outlook')

// Add your routes here - above the module.exports line
router.get('/', async (req, res) => {
  const outlookResponse = await outlookServices.getOutlook()
  const warningResponse = await warningServices.getWarnings()
  if (outlookResponse.status === 200 && warningResponse.status === 200) {
    const warnings = new Warnings(warningResponse.data)
    const outlook = new Outlook(outlookResponse.data)
    res.render('national', { model: { outlook: outlook, warnings: warnings } })
  } else {
    // Return 500 error
  }
})

module.exports = router
