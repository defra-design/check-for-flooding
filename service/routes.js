const express = require('express')
const router = express.Router()
const warningServices = require('./warning')
const riverServices = require('./river')
const stationServices = require('./station')
const outlookServices = require('./outlook')
const targetAreaServices = require('./target-area')
const telemetryServices = require('./telemetry')
const mapServices = require('./map')
const fs = require('fs')
const path = require('path')

//
// Warnings
//

// Get all warnings
router.get('/service/warnings', async (req, res, next) => {
  try {
    res.status(200).json(await warningServices.getWarnings())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get warnings that intersect a lon lat bbox
router.get('/service/warnings/:x1/:y1/:x2/:y2', async (req, res, next) => {
  try {
    const { x1, y1, x2, y2 } = req.params
    res.status(200).json(await warningServices.getWarningsWithinBbox([x1, y1, x2, y2]))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Target area
//

// Get a single target area with all its details
router.get('/service/target-area/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    res.status(200).json(await targetAreaServices.getTargetArea(id))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Rivers
//

// Get all rivers that contain query
router.get('/service/rivers/:query', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRivers(req.params.query))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get all catchments that contain query
router.get('/service/catchments/:query', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getCatchments(req.params.query))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Stations
//

// Get a single station with all its details
router.get('/service/station/:id', async (req, res, next) => {
  const isDownstage = req.params.id.includes('-downstream')
  const rloiId = req.params.id.replace('-downstream', '').replace('-upstream', '')
  try {
    res.status(200).json(await stationServices.getStation(rloiId, isDownstage))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get a single rain guage with all its details
router.get('/service/raingauge/:id', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationRain(req.params.id))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get stations within lon lat bbox
router.get('/service/stations-within/:x1/:y1/:x2/:y2', async (req, res, next) => {
  try {
    const { x1, y1, x2, y2 } = req.params
    res.status(200).json(await stationServices.getStationsWithinBbox([x1, y1, x2, y2]))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get stations by river name
router.get('/service/stations-by-river/:name', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationsByRiver(req.params.name))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get stations by catchment name
router.get('/service/stations-by-catchment/:name', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationsByCatchment(req.params.name))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Telemetry
//

router.get('/service/telemetry/:id/:start/:end/:latest?', async (req, res, next) => {
  try {
    res.status(200).json(await telemetryServices.getTelemetry(req.params.id, req.params.start, req.params.end, req.params.latest))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

router.get('/service/telemetry-rainfall/:id/:start/:end/:latest?', async (req, res, next) => {
  try {
    res.status(200).json(await telemetryServices.getRainfall(req.params.id, req.params.start, req.params.end, req.params.latest))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Outlook
//

router.get('/service/outlook', async (req, res, next) => {
  try {
    res.status(200).json(await outlookServices.getOutlook())
  } catch (err) {
    res.sendStatus(500)
    console.log(err)
  }
})

//
// Maps
//

// GeoJSON layers
router.get('/service/geojson/:type', async (req, res, next) => {
  const type = req.params.type
  try {
    if (['river', 'sea', 'groundwater', 'rainfall'].includes(type)) {
      res.status(200).json(await mapServices.getStationsGeoJSON(type))
    } else if (type === 'warnings') {
      res.status(200).json(await mapServices.getWarningsGeoJSON())
    } else if (type === 'outlook') {
      res.status(200).json(await mapServices.getOutlookGeoJSON())
    } else if (type === 'places') {
      res.status(200).json(await mapServices.getPlacesGeoJSON())
    } else {
      res.sendStatus(404)
    }
  } catch (err) {
    res.sendStatus(500)
    console.log(err)
  }
})

// Vector tiles
router.get('/tiles/target-areas/:z/:x/:y.pbf', async (req, res, next) => {
  const { x, y, z } = req.params
  fs.readFile(`${path.join(__dirname)}/vt/${z}/${x}/${y}.pbf`, (err, data) => {
    if (err) {
      res.status(204)
    } else {
      // set the content type based on the file
      res.setHeader('Content-Type', 'application/x-protobuf')
      res.setHeader('Content-Encoding', 'gzip')
      res.write(data, 'binary')
    }
    res.end(null, 'binary')
  })
})

//
// Test
//

router.get('/service/geojson/river-line/:id', async (req, res, next) => {
  try {
    res.status(200).json(await mapServices.getRiverGeoJSON(req.params.id))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

module.exports = router
