const express = require('express')
const router = express.Router()
const thresholdServices = require('../services/threshold')
const stationServices = require('../services/station')
const telemetryServices = require('../services/telemetry')
const locationServices = require('../services/location')
const warningServices = require('../services/warning')
const Station = require('../models/station')
const Place = require('../models/place')
const Thresholds = require('../models/thresholds')
const Warnings = require('../models/warnings')
const Banner = require('../models/banner-station')
const ViewModel = require('../models/views/station')
const moment = require('moment-timezone')

router.get('/station', (req, res) => {
  res.redirect('/river-sea-groundwater-rainfall-levels')
})

router.get('/station/:id/:downstream?', async (req, res) => {
  const cookie = req.headers.cookie || null
  const isDownstream = req.params.downstream?.toLowerCase() === 'downstream'
  const rloiId = req.params.id.toLowerCase()
  let telemetry, station, banner, thresholds, place

  // Get station details
  const stationResponse = await stationServices.getStation(cookie, rloiId, isDownstream)
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    station = new Station(stationResponse.data)
    // Telemetry
    if (station.latestDatetime) {
      const start = moment(station.latestDatetime).subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
      const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
      try {
        telemetry = await telemetryServices.getStationTelemetry(cookie, station.measureId, start, end, station.latestDatetime)
        telemetry = telemetry.data
      } catch (err) {
        console.log(err)
      }
      // Generate dummy forecast
      if (station.isForecast) {
        const forecast = await telemetryServices.getStationForecastTelemetry(cookie, station.latestDatetime, station.latestHeight, station.levelHigh)
        telemetry.forecast = forecast.data.values
        station.forecastHighest = forecast.data.highestValue
        station.forecastHighestDateTime = forecast.data.highestValueDateTime
      }
    } else {
      telemetry = {}
    }

    // Get thresholds
    const thresholdResponse = await thresholdServices.getThresholds(cookie, rloiId, isDownstream)
    // Add thresholds from station data and merge with warning thresholds
    thresholds = new Thresholds(thresholdResponse.data, station.status === 'active' && station.latestStatus === 'success' ? station.latestHeight : null)
  } else {
    // Return 500 error
  }

  // Get place details
  const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  if (locationResponse.status === 200) {
    if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
      return res.status(404).render('404')
    }
    const locationResponsePlace = locationResponse.data.resourceSets[0].resources[0]
    if (locationResponsePlace) {
      place = new Place(locationResponsePlace)
      const warningResponse = await warningServices.getWarningsWithin(cookie, place.bboxBuffered)
      banner = new Banner(new Warnings(warningResponse.data), place)
    }
  } else {
    // Return 500 error
  }

  const model = new ViewModel(station, banner, telemetry, thresholds, place)
  return res.render('station', { model })
})

router.get('/rainfall-station/:id', async (req, res) => {
  const cookie = req.headers.cookie || null
  const id = req.params.id.toLowerCase()
  let telemetry, station, banner, place

  // Get station details
  const stationResponse = await stationServices.getStationRain(cookie, id)
  if (stationResponse.status === 200) {
    if (!stationResponse.data) {
      return res.status(404).render('404')
    }
    station = new Station(stationResponse.data)
    // Telemetry
    const start = moment(station.latestDatetime).subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z')
    const end = moment().toISOString().replace(/.\d+Z$/g, 'Z')
    telemetry = await telemetryServices.getRainfallTelemetry(cookie, station.measureId, start, end, station.latestDatetime)
    telemetry = telemetry.data
  } else {
    // Return 500 error
  }

  // Get place details
  const locationResponse = await locationServices.getLocationByLatLon(station.centroid[1], station.centroid[0])
  if (locationResponse.status === 200) {
    if (!locationResponse.data && locationResponse.data.resourceSets && locationResponse.data.resourceSets.length) {
      return res.status(404).render('404')
    }
    const locationResponsePlace = locationResponse.data.resourceSets[0].resources[0]
    if (locationResponsePlace) {
      place = new Place(locationResponsePlace)
      const warningResponse = await warningServices.getWarningsWithin(cookie, place.bboxBuffered)
      banner = new Banner(new Warnings(warningResponse.data), place)
    }
  } else {
    // Return 500 error
  }

  const model = new ViewModel(station, banner, telemetry, null, place)
  return res.render('rainfall', { model })
})

module.exports = router
