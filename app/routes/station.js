const express = require('express')
const router = express.Router()
const stationServices = require('../services/station')
const telemetryServices = require('../services/telemetry')
const locationServices = require('../services/location')
const Station = require('../models/station')
const Place = require('../models/place')
const Thresholds = require('../models/thresholds')
const ViewModel = require('../models/views/station')
const moment = require('moment-timezone')

router.get('/station', (req, res) => {
  res.redirect('/river-sea-groundwater-rainfall-levels')
})

router.get('/station/:id', async (req, res) => {
  const cookie = req.headers.cookie || null
  const rloiId = req.params.id.toLowerCase()
  const stationResponse = await stationServices.getStation(cookie, rloiId)
  let telemetry, station, thresholds, place
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    // Station details
    station = new Station(stationResponse.data)
    // Station telemetry
    const start = moment(station.latestDatetime).subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
    const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
    telemetry = await telemetryServices.getStationTelemetry(cookie, station.measureId, start, end, station.latestDatetime)
    telemetry = telemetry.data
    // Thresholds
    thresholds = new Thresholds([
      { id: `${station.id}-max`, name: 'max', value: station.levelMax, date: station.levelMaxDateTime },
      { id: `${station.id}-high`, name: 'high', value: station.levelHigh, date: null }
    ], station.latestHeight)
  } else {
    // Return 500 error
  }
  const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  if (locationResponse.status === 200) {
    if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
      return res.status(404).render('404')
    }
    place = new Place(locationResponse.data.resourceSets[0].resources[0])
  } else {
    // Return 500 error
  }
  const model = new ViewModel(station, telemetry, thresholds, place)
  return res.render('station', { model })
})

router.get('/rainfall-station/:id', async (req, res) => {
  const cookie = req.headers.cookie || null
  const id = req.params.id.toLowerCase()
  const stationResponse = await stationServices.getStationRain(cookie, id)
  let telemetry, station, place
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    // Station details
    station = new Station(stationResponse.data)
    // Rainfall telemetry
    const start = moment(station.latestDatetime).subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
    const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
    telemetry = await telemetryServices.getRainfallTelemetry(cookie, station.measureId, start, end, station.latestDatetime)
    telemetry = telemetry.data
  } else {
    // Return 500 error
  }
  const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  if (locationResponse.status === 200) {
    if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
      return res.status(404).render('404')
    }
    place = new Place(locationResponse.data.resourceSets[0].resources[0])
  } else {
    // Return 500 error
  }
  const model = new ViewModel(station, telemetry, null, place)
  return res.render('rainfall', { model })
})

module.exports = router
