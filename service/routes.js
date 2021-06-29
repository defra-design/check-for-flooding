const express = require('express')
const router = express.Router()
const services = require('./services')

router.get('/service/rivers', async (req, res, next) => {
  try {
    res.json(await services.getRivers())
  } catch (err) {
    return err
  }
})

router.get('/service/river/:slug', async (req, res, next) => {
  try {
    res.json(await services.getRiverBySlug(req.params.slug))
  } catch (err) {
    return err
  }
})

router.get('/service/rivers/:slug', async (req, res, next) => {
  try {
    res.json(await services.getRiversLikeSlug(req.params.slug))
  } catch (err) {
    return err
  }
})

module.exports = router
