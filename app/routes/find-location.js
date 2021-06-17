const express = require('express')
const router = express.Router()

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', (req, res) => {
  const model = { location: req.body.location }
  if (model.location) {
    res.redirect(`/location/${model.location}`)
  } else {
    model.error = true
    res.render('find-location', { model })
  }
})

module.exports = router
