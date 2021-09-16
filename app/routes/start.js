const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line
router.get('/start', (req, res) => {
  console.log('/start: get')
  res.render('start')
})

module.exports = router
