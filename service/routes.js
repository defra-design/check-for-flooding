const express = require('express')
const router = express.Router()
const warningServices = require('./warning')
const riverServices = require('./river')
const stationServices = require('./station')
const targetAreaServices = require('./target-area')

// Get all rivers
router.get('/service/rivers', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRivers())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get single river
router.get('/service/river/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRiverBySlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get all rivers that contain slug
router.get('/service/rivers/:slug', async (req, res, next) => {
  // We dont want long lists of rivers, brooks etc
  const broadSearches = ['river', 'brook', 'stream']
  if (broadSearches.includes(req.params.slug)) {
    res.status(200).json([])
  } else {
    try {
      res.status(200).json(await riverServices.getRiversLikeSlug(req.params.slug))
    } catch (err) {
      res.status(500)
      console.log(err)
    }
  }
})

// Get a single river and stations that is like the slug
router.get('/service/river-detail/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRiverDetailBySlug(req.params.slug))
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

// Get stations by river slug
router.get('/service/stations-by-river/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationsByRiverSlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Vector tiles from Postgres used with maps
router.get('/tiles/target-areas/:z/:x/:y.mvt', async (req, res, next) => {
  const { x, y, z } = req.params
  const response = await targetAreaServices.getTargetAreaMVT(x, y, z)
  if (response.isError) {
    res.status(404).send({ error: response.error.toString() })
  } else {
    res.setHeader('Content-Type', 'application/x-protobuf')
    if (response.st_asmvt.length === 0) {
      res.status(204)
    }
    res.send(response.st_asmvt)
  }
})

// GeoJSON used with maps
router.get('/service/warnings-geojson', async (req, res, next) => {
  try {
    res.status(200).json(await warningServices.getWarningsGeoJSON())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// GeoJSON used with maps
router.get('/service/stations-geojson', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationsGeoJSON('s,m,c,g'))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// GeoJSON used with maps
router.get('/service/rainfall-geojson', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationsGeoJSON('r'))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

module.exports = router
