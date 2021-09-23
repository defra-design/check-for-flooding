const express = require('express')
const router = express.Router()

// Get levels
router.get('/flood-warnings-and-alerts', async (req, res) => {
  return res.render('warnings')
})

module.exports = router
