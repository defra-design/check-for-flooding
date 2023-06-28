const express = require('express')
const router = express.Router()
const webchatServices = require('../services/webchat')

router.get('/webchat-availability', async (req, res) => {
  try {
    res.status(200).json(await webchatServices.getAvailability())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

module.exports = router