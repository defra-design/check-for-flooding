const express = require('express')
const router = express.Router()
const stationServices = require('../services/station')
const telemetryServices = require('../services/telemetry')
const thresholdServices = require('../services/threshold')
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
  const rloiId = req.params.id.toLowerCase()
  const stationResponse = await stationServices.getStation(rloiId)
  let telemetry, thresholds, station, place
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    // Station details
    station = new Station(stationResponse.data)
    // Station telemetry
    const start = moment().subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
    const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
    telemetry = await telemetryServices.getStationTelemetry(station.id, start, end, station.measure)
    telemetry = telemetry.data
    // Station thresholds only for river and groundwater stations
    if (['upstream', 'downstream', 'groundwater'].includes(station.measure) && telemetry.observed.length) {
      thresholds = await thresholdServices.getThresholds(station.id, station.measure === 'downstream')
      thresholds = new Thresholds(thresholds.data, Number(telemetry.observed[0].value))
    }
  } else {
    // Return 500 error
  }
  // const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  // if (locationResponse.status === 200) {
  //   if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
  //     return res.status(404).render('404')
  //   }
  //   place = new Place(locationResponse.data.resourceSets[0].resources[0])
  // } else {
  //   // Return 500 error
  // }
  const model = new ViewModel(station, telemetry, thresholds, place)
  return res.render('station', { model })
})

router.get('/rainfall-station/:id', async (req, res) => {
  const id = req.params.id.toLowerCase()
  const stationResponse = await stationServices.getStationRain(id)
  let telemetry, station, place
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    // Station details
    station = new Station(stationResponse.data)
    // Rainfall telemetry
    const start = moment().subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
    const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
    telemetry = await telemetryServices.getRainfallTelemetry(station.id, start, end)
    telemetry = telemetry.data
  } else {
    // Return 500 error
  }
  // const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  // if (locationResponse.status === 200) {
  //   if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
  //     return res.status(404).render('404')
  //   }
  //   place = new Place(locationResponse.data.resourceSets[0].resources[0])
  // } else {
  //   // Return 500 error
  // }
  const model = new ViewModel(station, telemetry, null, place)
  return res.render('rainfall', { model })
})

module.exports = router
