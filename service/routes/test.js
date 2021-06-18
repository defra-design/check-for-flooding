const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line
router.get('/service/test', (req, res) => {
  res.json({ foo: 'bar' })
})

module.exports = router
