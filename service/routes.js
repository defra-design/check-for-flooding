const express = require('express')
const router = express.Router()
const services = require('./services')

// Get all rivers
router.get('/service/rivers', async (req, res, next) => {
  try {
    res.status(200).json(await services.getRivers())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get single river
router.get('/service/river/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await services.getRiverBySlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get all rivers that contain slug
router.get('/service/rivers/:slug', async (req, res, next) => {
  // We dont want long lists of rivers, brooks etc
  const broadSearches = ['river', 'brook', 'stream']
  if (broadSearches.includes(req.params.slug)) {
    res.status(200).json([])
  } else {
    try {
      res.status(200).json(await services.getRiversLikeSlug(req.params.slug))
    } catch (err) {
      res.status(500)
      console.log(err)
    }
  }
})

// Get single river detail
router.get('/service/river-detail/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await services.getRiverDetailBySlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

module.exports = router
