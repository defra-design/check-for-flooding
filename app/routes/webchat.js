const express = require('express')
const router = express.Router()
const webchatServices = require('../services/webchat')

router.get('/webchat-availability', async (req, res) => {
  try {
    const response = await webchatServices.getAvailability()
    if (response && response.hasOwnProperty('isAvailable')) {
      res.status(200).json(response)
    } else {
      res.status(500).json('Error')
    }
  } catch (err) {
    res.status(500).json('Error')
  }
})

module.exports = router