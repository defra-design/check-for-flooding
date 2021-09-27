const express = require('express')
const router = express.Router()
const outlookServices = require('../services/outlook')
const Outlook = require('../models/outlook/outlook')

// Add your routes here - above the module.exports line
router.get('/', async (req, res) => {
  const response = await outlookServices.getOutlook()
  if (response.status === 200) {
    const outlook = new Outlook(response.data)
    res.render('national', { model: { outlook: outlook } })
  } else {
    // Return 500 error
  }
})

module.exports = router
