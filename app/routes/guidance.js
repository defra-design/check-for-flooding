const express = require('express')
const router = express.Router()

router.get('/about-river-sea-groundwater-rainfall-levels', (req, res) => {
  res.render('levels-faq')
})

module.exports = router
