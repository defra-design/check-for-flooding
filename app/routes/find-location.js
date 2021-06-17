const express = require('express')
const router = express.Router()

router.get('/find-location', (req, res) => {
  res.render('find-location')
})

router.post('/find-location', (req, res) => {
  const location = req.body.location
  if (location) {
    res.redirect(`/location/${location}`)
  } else {
    const model = { error: true }
    res.render('find-location', { model })
  }
})

module.exports = router
