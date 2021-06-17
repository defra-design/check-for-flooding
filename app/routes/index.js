const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line
router.get('/', (req, res) => {
  res.render('index')
})

module.exports = router
