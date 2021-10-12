const express = require('express')
const router = express.Router()

router.get('/station', (req, res) => {
  res.redirect('/river-sea-groundwater-rainfall-levels')
})

router.get('/station/:id', async (req, res) => {
  const id = req.params.id.toLowerCase()
  res.render('station', { id })
})

module.exports = router
