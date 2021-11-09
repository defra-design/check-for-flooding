const express = require('express')
const router = express.Router()

router.get('/how-we-measure-river-sea-groundwater-rainfall-levels', (req, res) => {
  res.render('levels-faq')
})

module.exports = router
