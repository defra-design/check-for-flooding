const NodeCache = require('node-cache')
const express = require('express')
const router = express.Router()
const webchatServices = require('../services/webchat')

const cache = new NodeCache({ stdTTL: 5 })

const verifyCache = (req, res, next) => {
  try {
    if (cache.has('availability')) {
      return res.status(200).json(cache.get('availability'))
    }
    return next()
  } catch (err) {
    throw new Error(err)
  }
}

router.get('/webchat-availability', verifyCache, async (req, res) => {
  try {
    const response = await webchatServices.getAvailability()
    cache.set('availability', response)
    return res.status(200).json(response)
  } catch (err) {
    console.log(err)
    res.status(500).json('Error')
  }
})

module.exports = router