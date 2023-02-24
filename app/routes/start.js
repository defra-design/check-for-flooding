const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line
router.get('/start', (req, res) => {
  res.render('start')
})

router.get('/offline', (req, res) => {
  res.render('offline')
})

module.exports = router
