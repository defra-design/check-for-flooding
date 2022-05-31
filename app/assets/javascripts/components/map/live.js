'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Feature } from 'ol'
import { transform, transformExtent } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { Point } from 'ol/geom'
import { buffer, containsExtent } from 'ol/extent'
import { fromExtent } from 'ol/geom/Polygon'
import { Control } from 'ol/control'
import GeoJSON from 'ol/format/GeoJSON'

import { polygon, multiPolygon } from '@turf/helpers'
import simplify from '@turf/simplify'
import intersect from '@turf/intersect'
import union from '@turf/union'

const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const maps = window.flood.maps
const { setExtentFromLonLat, getLonLatFromExtent } = window.flood.maps
const MapContainer = maps.MapContainer

function LiveMap (mapId, options) {
  // Set maxBigZoom value
  maps.liveMaxBigZoom = 100

  // Optional target area features
  const targetArea = {}

  // State object
  const state = {
    visibleFeatures: [],
    selectedFeatureId: '',
    initialExt: []
  }

  // View
  const view = new View({
    zoom: 6, // Default zoom
    minZoom: 6, // Minimum zoom level
    maxZoom: 18,
    center: maps.centre, // Default centre required
    extent: maps.extent // Constrains extent
  })

  // Configure default interactions
  // const interactions = defaultInteractions({
  //   pinchRotate: false
  // })

  // Create day control
  // const backgroundElement = document.createElement('button')
  // backgroundElement.className = 'defra-map-background'
  // backgroundElement.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M10,-0c5.484,0.005 9.995,4.516 10,10c-0.005,5.484 -4.516,9.995 -10,10c-5.484,-0.005 -9.995,-4.516 -10,-10c0.005,-5.484 4.516,-9.995 10,-10Zm-5.813,16.23l0.018,-0.196c0.04,-0.395 -0.026,-0.337 0.17,-0.656c0.196,-0.32 0.246,-0.356 0.424,-0.585c0.179,-0.23 0.333,-0.159 0.322,-0.567c-0.012,-0.408 0.197,-0.355 -0.155,-0.665c-0.352,-0.31 -0.542,-0.456 -0.828,-0.689c-0.286,-0.234 -0.187,-0.273 -0.651,-0.417c-0.463,-0.144 -0.367,0.087 -0.733,-0.172c-0.366,-0.259 -0.445,-0.251 -0.756,-0.508l-0.396,-0.317c-0.083,-0.482 -0.125,-0.97 -0.125,-1.458c0,-2.48 1.062,-4.713 2.755,-6.272c-0.002,0.16 0.05,0.29 0.045,0.525c-0.006,0.41 -0.09,0.65 0.264,0.624c0.57,-0.043 0.522,-0.549 1.151,-0.841c0.628,-0.293 0.666,-0.323 0.999,-0.704c0.332,-0.382 0.531,-0.487 0.447,-1.02l-0.054,-0.322c0.821,-0.299 1.701,-0.476 2.618,-0.507l-0.015,0.042c-0.114,0.323 -0.307,0.273 0.026,0.543c0.334,0.269 0.538,0.211 0.374,0.626c-0.164,0.415 0.146,0.644 -0.461,0.578c-0.607,-0.067 -0.768,-0.115 -1.026,-0.131c-0.257,-0.016 -0.374,-0.158 -0.35,0.204c0.024,0.362 0.049,0.293 0.028,0.733c-0.02,0.441 0.005,0.598 -0.215,0.86c-0.219,0.261 -0.414,0.399 -0.108,0.625c0.306,0.225 0.139,0.275 0.556,0.128c0.416,-0.148 0.485,-0.208 0.708,-0.553c0.223,-0.344 0.254,-0.401 0.565,-0.527c0.311,-0.126 0.21,-0.282 0.44,0.025c0.23,0.307 0.045,0.469 0.341,0.618c0.296,0.149 0.152,0.121 0.186,-0.263c0.034,-0.384 -0.08,-0.364 0.314,-0.392c0.394,-0.028 0.131,-0.082 0.619,0.178c0.488,0.261 0.591,0.363 0.816,0.63c0.225,0.266 0.416,0.412 0.258,0.668c-0.157,0.256 -0.041,0.292 -0.501,0.272c-0.46,-0.021 -0.529,-0.003 -0.881,-0.103c-0.353,-0.1 -0.719,-0.232 -1.014,-0.282c-0.296,-0.05 -0.479,-0.111 -0.818,-0.05c-0.339,0.06 -0.541,0.026 -0.817,0.241c-0.275,0.215 -0.445,0.176 -0.728,0.66c-0.282,0.484 -0.234,0.464 -0.357,0.932c-0.122,0.467 -0.421,0.814 -0.295,1.329c0.125,0.515 -0.072,0.767 0.312,1.095c0.384,0.329 0.391,0.438 0.773,0.651c0.383,0.212 0.513,0.246 0.969,0.243c0.456,-0.002 0.382,-0.015 0.945,-0.071c0.562,-0.056 0.595,-0.125 0.9,0.233c0.305,0.358 0.384,0.277 0.398,0.881c0.014,0.603 -0.037,0.675 -0.141,1.028c-0.104,0.354 -0.103,0.422 -0.179,0.912c-0.076,0.49 -0.226,0.558 -0.141,1.006c0.085,0.447 -0.026,0.457 0.111,1.032c0.138,0.575 0.175,0.547 0.256,1.07c0.081,0.523 0.013,0.608 0.255,0.788c0.242,0.181 0.006,0.079 0.348,-0.134c0.343,-0.212 0.239,-0.167 0.492,-0.469c0.252,-0.301 0.157,0.035 0.527,-0.671c0.369,-0.707 0.402,-0.929 0.601,-1.316c0.199,-0.388 0.153,-0.454 0.415,-0.823c0.263,-0.368 0.327,-0.308 0.659,-0.728c0.331,-0.42 0.255,-0.21 0.551,-0.678c0.296,-0.469 0.365,-0.309 0.584,-0.859c0.22,-0.55 0.358,-0.577 0.427,-1.031c0.069,-0.453 0.144,-0.055 0,-0.858c-0.144,-0.803 -0.225,-0.674 -0.423,-1.097c-0.199,-0.422 -0.56,-0.55 -0.744,-0.825c-0.183,-0.275 -0.187,-0.448 -0.444,-0.67c-0.256,-0.223 -0.169,-0.196 -0.219,-0.423c-0.05,-0.227 0.038,-0.255 0.329,-0.085c0.292,0.17 0.171,-0.046 0.596,0.267c0.425,0.312 0.683,0.261 0.972,0.546c0.289,0.284 0.55,0.456 0.55,0.455c-0,-0 0.094,0.058 0.419,-0.02c0.325,-0.077 0.472,0.027 0.475,-0.35c0.003,-0.378 -0.133,-0.369 -0.288,-0.595c-0.156,-0.225 -0.399,-0.232 -0.56,-0.502c-0.162,-0.27 -0.218,-0.272 -0.3,-0.613c-0.083,-0.342 0.112,-0.214 0.379,-0.068c0.256,0.141 0.366,0.088 0.686,0.255c0.454,1.059 0.687,2.198 0.685,3.35c0,4.703 -3.819,8.522 -8.522,8.522c-2.246,0 -4.29,-0.87 -5.813,-2.292Z" style="fill:currentColor;"/></svg><span class="govuk-visually-hidden">Base map type</span>'
  // const backgroundControl = new Control({
  //   element: backgroundElement
  // })

  // Add OS copyright logo
  const osLogoImage = document.createElement('img')
  osLogoImage.className = 'defra-map-os-logo'
  osLogoImage.setAttribute('alt', 'Ordnance Survey logo')
  osLogoImage.src = '/public/images/os-logo-maps-2x.png'
  osLogoImage.width = 90
  osLogoImage.height = 24
  const osLogo = new Control({
    element: osLogoImage
  })

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: maps.liveMaxBigZoom,
    view: view,
    // layers: layers,
    controls: [osLogo],
    queryParamKeys: ['v', 'lyr', 'ext', 'fid'],
    // interactions: interactions,
    originalTitle: options.originalTitle,
    title: options.title,
    heading: options.heading,
    keyTemplate: 'key-live.html',
    isBack: options.isBack
  }

  // Create MapContainer
  const container = new MapContainer(mapId, containerOptions)
  const map = container.map
  const containerElement = container.containerElement
  const viewport = container.viewport
  const viewportDescription = container.viewportDescription
  const keyElement = container.keyElement
  const resetButton = container.resetButton
  const closeInfoButton = container.closeInfoButton
  const openKeyButton = container.openKeyButton

  // Layers
  const road = maps.layers.road()
  const satellite = maps.layers.satellite()
  const vectorTilePolygons = maps.layers.vectorTilePolygons()
  const warnings = maps.layers.warnings()
  const river = maps.layers.river()
  const tide = maps.layers.tide()
  const groundwater = maps.layers.groundwater()
  const rainfall = maps.layers.rainfall()
  const selected = maps.layers.selected()
  const labels = maps.layers.labels()

  // These layers are static
  const defaultLayers = [
    road,
    satellite,
    selected,
    labels
  ]

  // These layers can be manipulated
  const dataLayers = [
    vectorTilePolygons,
    river,
    tide,
    groundwater,
    rainfall,
    warnings
  ]
  const layers = defaultLayers.concat(dataLayers)

  // Add layers
  map.getLayers().extend(layers)

  //
  // Private methods
  //

  // Compare two lonLat extent arrays and return true if they are different
  const isNewExtent = (newExt) => {
    // Check either lons or lats are the same
    const isSameLon1 = newExt[0] < (state.initialExt[0] + 0.0001) && newExt[0] > (state.initialExt[0] - 0.0001)
    const isSameLon2 = newExt[2] < (state.initialExt[2] + 0.0001) && newExt[2] > (state.initialExt[2] - 0.0001)
    const isSameLat1 = newExt[1] < (state.initialExt[1] + 0.0001) && newExt[1] > (state.initialExt[1] - 0.0001)
    const isSameLat2 = newExt[3] < (state.initialExt[3] + 0.0001) && newExt[3] > (state.initialExt[3] - 0.0001)
    const isSameWidth = isSameLon1 && isSameLon2
    const isSameHeight = isSameLat1 && isSameLat2
    // Check extent is within original extent
    const initialExtent = transformExtent(state.initialExt, 'EPSG:4326', 'EPSG:3857')
    const newExtent = transformExtent(newExt, 'EPSG:4326', 'EPSG:3857')
    const isNewWithinInitital = containsExtent(newExtent, initialExtent)
    return !((isSameWidth || isSameHeight) && isNewWithinInitital)
  }

  // Show or hide layers
  const setLayerVisibility = (lyrCodes) => {
    dataLayers.forEach(layer => {
      if (layer === vectorTilePolygons) return
      const isVisible = lyrCodes.some(lyrCode => layer.get('featureCodes').includes(lyrCode))
      layer.setVisible(isVisible)
    })
    road.setVisible(lyrCodes.includes('mv'))
    satellite.setVisible(lyrCodes.includes('sv'))
    osLogoImage.style.display = lyrCodes.includes('mv') ? 'block' : 'none'

    // Overide warnings visibility if target area provided
    if (targetArea.pointFeature) {
      warnings.setVisible(true)
    }
  }

  // WebGL: Limited dynamic styling could be done server side
  const setFeatueState = (layer) => {
    layer.getSource().forEachFeature((feature) => {
      const props = feature.getProperties()
      let state = ''
      if (['S', 'M', 'G'].includes(props.type)) {
        // River or groundwater
        if (props.status === 'Suspended' || props.status === 'Closed' || (!props.value && !props.iswales)) {
          state = props.type === 'G' ? 'groundError' : 'riverError'
        } else if (props.value && props.atrisk && props.type !== 'C' && !props.iswales) {
          state = props.type === 'G' ? 'groundHigh' : 'riverHigh'
        } else {
          state = props.type === 'G' ? 'ground' : 'river'
        }
      } else if (props.type === 'C') {
        // Tide
        if (props.status === 'Suspended' || props.status === 'Closed' || (!props.value && !props.iswales)) {
          state = 'tideError'
        } else {
          state = 'tide'
        }
      } else if (props.type === 'R') {
        // Rainfall
        state = props.value24hr && props.value24hr > 0 ? 'rain' : 'rainDry'
      }
      // WebGl: Feature properties must be strings or numbers
      feature.set('state', state)
    })
  }

  // Show or hide warnings within warning layer
  const setWarningVisibility = (lyrCodes) => {
    warnings.getSource().forEachFeature((feature) => {
      const props = feature.getProperties()
      const isVisible = !!(
        // Warnings
        (props.severity && props.severity === 1 && lyrCodes.includes('ts')) ||
        (props.severity && props.severity === 2 && lyrCodes.includes('tw')) ||
        (props.severity && props.severity === 3 && lyrCodes.includes('ta')) ||
        (props.severity && props.severity === 4 && lyrCodes.includes('tr')) ||
        // Target area provided
        (targetArea.pointFeature && targetArea.pointFeature.getId() === feature.getId())
      )
      // WebGl: Feature properties must be strings or numbers
      // feature.set('isVisible', isVisible.toString())
      feature.set('isVisible', isVisible)
    })
  }

  // Set selected feature
  const setSelectedFeature = (newFeatureId = '') => {
    selected.getSource().clear()
    dataLayers.forEach(layer => {
      if (layer === vectorTilePolygons) return
      const originalFeature = layer.getSource().getFeatureById(state.selectedFeatureId)
      const newFeature = layer.getSource().getFeatureById(newFeatureId)
      if (originalFeature) {
        originalFeature.set('isSelected', false)
      }
      if (newFeature) {
        newFeature.set('isSelected', true)
        setFeatureHtml(newFeature)
        selected.getSource().addFeature(newFeature)
        selected.setStyle(maps.styles[layer.get('ref') === 'warnings' ? 'warnings' : 'stations']) // WebGL: layers don't use a style function
        container.showInfo('Selected feature information', newFeature.get('html'))
      }
      // Refresh target area polygons
      if (layer.get('ref') === 'warnings') {
        vectorTilePolygons.setStyle(maps.styles.vectorTilePolygons)
      }
    })
    state.selectedFeatureId = newFeatureId
    // Update url
    replaceHistory('fid', newFeatureId)
  }

  // Toggle key symbols based on resolution
  const toggleKeySymbol = () => {
    forEach(containerElement.querySelectorAll('.defra-map-key__symbol[data-display="toggle-image"]'), (symbol) => {
      const isBigZoom = map.getView().getResolution() <= maps.liveMaxBigZoom
      if (isBigZoom) {
        symbol.classList.add('defra-map-key__symbol--big')
        symbol.classList.remove('defra-map-key__symbol--small')
      } else {
        symbol.classList.add('defra-map-key__symbol--small')
        symbol.classList.remove('defra-map-key__symbol--big')
      }
    })
  }

  // Update url and replace history state
  const replaceHistory = (key, value) => {
    const data = { v: mapId, isBack: options.isBack, initialExt: state.initialExt }
    const uri = addOrUpdateParameter(window.location.href, key, value)
    const title = document.title
    window.history.replaceState(data, title, uri)
  }

  // Generate feature name
  const featureName = (feature) => {
    let name = ''
    if (feature.get('type') === 'C') {
      name = `Tide level: ${feature.get('name')}`
    } else if (feature.get('type') === 'S' || feature.get('type') === 'M') {
      name = `River level: ${feature.get('name')}, ${feature.get('river')}`
    } else if (feature.get('type') === 'G') {
      name = `Groundwater level: ${feature.get('name')}`
    } else if (feature.get('type') === 'R') {
      name = `Rainfall: ${feature.get('name')}`
    } else if (feature.getId().startsWith('rainfall_stations')) {
      name = `Rainfall: ${feature.get('station_name')}`
    } else if (feature.get('severity') === 1) {
      name = `Severe flood warning: ${feature.get('name')}`
    } else if (feature.get('severity') === 2) {
      name = `Flood warning: ${feature.get('name')}`
    } else if (feature.get('severity') === 3) {
      name = `Flood alert: ${feature.get('name')}`
    }
    return name
  }

  // Get features visible in the current viewport
  const getVisibleFeatures = () => {
    labels.getSource().clear()
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const resolution = map.getView().getResolution()
    const isBigZoom = resolution <= maps.liveMaxBigZoom
    const extent = map.getView().calculateExtent(map.getSize())
    const layers = dataLayers.filter(layer => layer !== vectorTilePolygons && lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    // Add target area isn't an active alert or warning
    if (!layers.includes(warnings) && targetArea.pointFeature) layers.push(warnings)
    // Add vectortile polygons to labels
    if (layers.includes(warnings) && isBigZoom) {
      let warningPolygonFeatures = getWarningPolygonsIntersectingExtent(extent)
      warningPolygonFeatures = mergePolygons(warningPolygonFeatures, extent)
      addWarningPolygonsToLabels(warningPolygonFeatures)
    }
    // Add point features to labels
    addPointFeaturesToLabels(layers, extent)
    const features = labels.getSource().getFeatures()
    // Show labels if count is between 1 and 9
    const hasAccessibleFeatures = maps.isKeyboard && features.length <= 9
    labels.setVisible(hasAccessibleFeatures)
    // Build model
    const numWarnings = features.filter(feature => feature.get('type') === 'warning').length
    const mumMeasurements = features.length - numWarnings
    const model = {
      numFeatures: features.length,
      numWarnings: numWarnings,
      mumMeasurements: mumMeasurements,
      features: features.map(feature => ({
        type: feature.get('type'),
        severity: feature.get('severity'),
        name: feature.get('name')
      }))
    }
    // Update viewport description
    const html = window.nunjucks.render('description-live.html', { model: model })
    viewportDescription.innerHTML = html
    // Set numeric id and move featureId to properties
    if (!hasAccessibleFeatures) return
    features.forEach((feature, i) => {
      feature.set('featureId', feature.getId())
      feature.setId((i + 1))
    })
  }

  // Get VectorTile Features Intersecting Extent
  const getWarningPolygonsIntersectingExtent = (extent) => {
    const warningsPolygons = []
    vectorTilePolygons.getSource().getFeaturesInExtent(extent).forEach(feature => {
      const warning = warnings.getSource().getFeatureById(feature.getId())
      if (!!warning && warning.get('isVisible')) {
        const warningsPolygon = new Feature({
          geometry: feature.getGeometry(),
          name: warning.get('name'),
          type: warning.get('type')
        })
        warningsPolygon.setId(feature.getId())
        warningsPolygons.push(warningsPolygon)
      }
    })
    return warningsPolygons
  }

  // Add point features intersecting extent to labels source
  const addPointFeaturesToLabels = (layers, extent) => {
    const resolution = map.getView().getResolution()
    const isBigZoom = resolution <= maps.liveMaxBigZoom
    for (const layer of layers) {
      if (labels.getSource().getFeatures().length > 9) break
      const pointFeatures = layer.getSource().getFeaturesInExtent(extent)
      for (const feature of pointFeatures) {
        if (layer.get('ref') !== 'warnings' || (layer.get('ref') === 'warnings' && !isBigZoom && feature.get('isVisible'))) {
          const pointFeature = new Feature({
            geometry: feature.getGeometry(),
            name: feature.get('name'),
            type: feature.get('type')
          })
          pointFeature.setId(feature.getId())
          if (labels.getSource().getFeatures().length > 9) break
          labels.getSource().addFeature(pointFeature)
        }
      }
    }
  }

  // Add warning polygons to labels source
  const addWarningPolygonsToLabels = (features) => {
    features.forEach(feature => {
      const geometry = feature.getGeometry()
      feature.setGeometry(geometry.getType() === 'MultiPolygon'
        ? geometry.getInteriorPoints()
        : geometry.getInteriorPoint()
      )
      labels.getSource().addFeature(feature)
    })
  }

  // Simplify, clip and merge vector tile polygons
  const mergePolygons = (features, extent) => {
    const mergedPolygons = []
    const turfExtentPolygon = polygon(fromExtent(extent).getCoordinates())
    features.forEach(feature => {
      const coordinates = feature.getGeometry().getCoordinates()
      // Simplify polygons
      const options = { tolerance: 100, highQuality: false }
      const turfPolygon = feature.getGeometry().getType() === 'MultiPolygon'
        ? simplify(multiPolygon(coordinates), options)
        : simplify(polygon(coordinates), options)
      // Clip polygons to extent
      const clippedPolygon = intersect(turfPolygon, turfExtentPolygon)
      if (!clippedPolygon) return
      feature.setGeometry(new GeoJSON().readFeature(clippedPolygon).getGeometry())
      // Merge polygons of the same feature
      const masterFeature = mergedPolygons.find(x => x.id_ === feature.getId())
      if (masterFeature) {
        const masterCoordinates = masterFeature.getGeometry().getCoordinates()
        const masterPolygon = masterFeature.getGeometry().getType() === 'MultiPolygon'
          ? multiPolygon(masterCoordinates)
          : polygon(masterCoordinates)
        const turfFeature = union(masterPolygon, clippedPolygon)
        const mergedFeature = new GeoJSON().readFeature(turfFeature)
        masterFeature.setGeometry(mergedFeature.getGeometry())
      } else {
        mergedPolygons.push(feature)
      }
    })
    return mergedPolygons
  }

  // Pan map
  const panToFeature = (feature) => {
    let extent = map.getView().calculateExtent(map.getSize())
    extent = buffer(extent, -1000)
    if (!containsExtent(extent, feature.getGeometry().getExtent())) {
      map.getView().setCenter(feature.getGeometry().getCoordinates())
    }
  }

  // Time format function
  const formatTime = (date) => {
    const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
    const amPm = (date.getHours() < 12) ? 'am' : 'pm'
    return hours + ':' + minutes + amPm
  }

  // Day format function
  const formatDayMonth = (date) => {
    const day = date.getDate()
    const month = date.toLocaleString('en-GB', { month: 'long' })
    return `${day} ${month}`
  }

  // Set feature overlay html
  const setFeatureHtml = (feature) => {
    const model = feature.getProperties()
    const id = feature.getId().substring(feature.getId().indexOf('.') + 1)
    model.id = id.includes('.') ? id.substring(0, id.indexOf('.')) : id
    // Format dates for river levels
    if (feature.getId().startsWith('stations')) {
      model.date = `${formatTime(new Date(model.valueDate))}, ${formatDayMonth(new Date(model.valueDate))}`
    } else if (model.issuedDate) {
      model.date = `${formatTime(new Date(model.issuedDate))}, ${formatDayMonth(new Date(model.issuedDate))}`
    }
    const html = window.nunjucks.render('info-live.html', { model: model })
    feature.set('html', html)
  }

  //
  // Setup
  //

  // Set initial selected feature id
  if (getParameterByName('fid')) {
    state.selectedFeatureId = decodeURI(getParameterByName('fid'))
  }

  // Create optional target area feature
  if (options.targetArea) {
    targetArea.pointFeature = new Feature({
      geometry: new Point(transform(options.targetArea.centre, 'EPSG:4326', 'EPSG:3857')),
      name: options.targetArea.name,
      ta_code: options.targetArea.id,
      type: 'TA'
    })
    targetArea.pointFeature.setId(options.targetArea.id)
  }

  // Define map extent
  let extent
  if (getParameterByName('ext')) {
    extent = getParameterByName('ext').split(',').map(Number)
  } else if (options.extent && options.extent.length) {
    extent = options.extent.map(x => { return parseFloat(x.toFixed(6)) })
  } else if (targetArea.polygonFeature) {
    extent = getLonLatFromExtent(buffer(targetArea.polygonFeature.getGeometry().getExtent(), 150))
  } else {
    extent = getLonLatFromExtent(maps.extent)
  }

  // Set map viewport
  if (!getParameterByName('ext') && options.centre) {
    map.getView().setCenter(transform(options.centre, 'EPSG:4326', 'EPSG:3857'))
    map.getView().setZoom(options.zoom || 6)
  } else {
    setExtentFromLonLat(map, extent)
  }

  // Store extent for use with reset button
  state.initialExt = window.history.state.initialExt || getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))

  // Set layers from querystring
  if (getParameterByName('lyr')) {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    setLayerVisibility(lyrs)
    const checkboxes = document.querySelectorAll('.defra-map-key input[type=checkbox]')
    forEach(checkboxes, (checkbox) => {
      checkbox.checked = lyrs.includes(checkbox.id)
    })
    const radios = document.querySelectorAll('.defra-map-key input[type=radio]')
    forEach(radios, (radio) => {
      radio.checked = lyrs.includes(radio.id)
    })
  }

  //
  // Events
  //

  // Set selected feature and polygon states when features have loaded
  dataLayers.forEach(layer => {
    const change = layer.getSource().on('change', (e) => {
      if (e.target.getState() === 'ready') {
        unByKey(change) // Remove ready event when layer is ready
        if (layer.get('ref') === 'warnings') {
          // Add optional target area
          if (targetArea.pointFeature) {
            if (!warnings.getSource().getFeatureById(targetArea.pointFeature.getId())) {
              // Add point feature
              warnings.getSource().addFeature(targetArea.pointFeature)
              // VectorSource: Add polygon not required if VectorTileSource
              // if (targetArea.polygonFeature && targetAreaPolygons.getSource() instanceof VectorSource) {
              //   targetAreaPolygons.getSource().addFeature(targetArea.polygonFeature)
              // }
            }
          }
        }
        // WebGL: Limited dynamic styling could be done server side for client performance
        if (['river', 'tide', 'groundwater', 'rainfall'].includes(layer.get('ref'))) {
          setFeatueState(layer)
        }
        // Set feature visibility after all features have loaded
        // const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
        // setWarningVisibility(lyrs, layer)
        // Store reference to warnings source for use in vector tiles style function
        if (layer.get('ref') === 'warnings') {
          const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
          setWarningVisibility(lyrs)
          maps.warningsSource = warnings.getSource()
        }
        // Attempt to set selected feature when layer is ready
        setSelectedFeature(state.selectedFeatureId)
        // Show overlays
        getVisibleFeatures()
      }
    })
  })

  // Set key symbols, opacity, history and overlays on map pan or zoom (fires on map load aswell)
  let timer = null
  map.addEventListener('moveend', (e) => {
    // Toggle key symbols depending on resolution
    toggleKeySymbol()
    // Timer used to stop 100 url replaces in 30 seconds limit
    clearTimeout(timer)
    // Clear viewport description to force screen reader to re-read
    viewportDescription.innerHTML = ''
    // Vector tiles with featureClass ol.feature have redraw bug
    // vectorTilePolygons.getSource().refresh({ force: true })
    // Tasks dependent on a time delay
    timer = setTimeout(() => {
      if (!container.map) return
      // Show overlays for visible features
      getVisibleFeatures()
      // Update url (history state) to reflect new extent
      const ext = getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))
      replaceHistory('ext', ext.join(','))
      // Show reset button if extent has changed
      if (isNewExtent(ext)) {
        resetButton.removeAttribute('disabled')
      }
      // Fix margin issue
      map.updateSize()
    }, 350)
  })

  // Show cursor when hovering over features
  map.addEventListener('pointermove', (e) => {
    // Detect vector feature at mouse coords
    const hit = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (feature.get('layer') !== 'hydrologicalboundaries' && (!defaultLayers.includes(layer) || layer === vectorTilePolygons)) { return true }
    })
    map.getTarget().style.cursor = hit ? 'pointer' : ''
  })

  // Set selected feature if map is clicked
  // Clear overlays if non-keyboard interaction
  map.addEventListener('click', (e) => {
    // Hide overlays if non-keyboard interaction
    if (!maps.isKeyboard) {
      labels.setVisible(false)
    }
    // Get mouse coordinates and check for feature
    const featureId = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (!defaultLayers.includes(layer) || layer === vectorTilePolygons) {
        return feature.getId()
      }
    })
    setSelectedFeature(featureId)
  })

  // Show overlays on first tab in from browser controls
  viewport.addEventListener('focus', (e) => {
    if (maps.isKeyboard) {
      getVisibleFeatures()
    }
  })

  // Toggle layers/features when key item clicked
  keyElement.addEventListener('click', (e) => {
    if (e.target.nodeName === 'INPUT') {
      e.stopPropagation()
      let lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      if (e.target.type === 'checkbox') {
        const checkbox = e.target
        checkbox.checked ? lyrs.push(checkbox.id) : lyrs.splice(lyrs.indexOf(checkbox.id), 1)
        if (['ts', 'tw', 'ta', 'tr'].includes(checkbox.id)) {
          setWarningVisibility(lyrs)
        }
      } else if (e.target.type === 'radio') {
        if (lyrs.includes('mv')) { lyrs.splice(lyrs.indexOf('mv'), 1) }
        if (lyrs.includes('sv')) { lyrs.splice(lyrs.indexOf('sv'), 1) }
        lyrs.push(e.target.id)
      }
      setLayerVisibility(lyrs)
      vectorTilePolygons.setStyle(maps.styles.vectorTilePolygons)
      lyrs = lyrs.join(',')
      replaceHistory('lyr', lyrs)
      getVisibleFeatures()
    }
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    setSelectedFeature()
  })

  // Clear selectedfeature when key is opened
  openKeyButton.addEventListener('click', (e) => {
    setSelectedFeature()
  })

  // Reset map extent on reset button click
  resetButton.addEventListener('click', (e) => {
    setExtentFromLonLat(map, state.initialExt)
    resetButton.setAttribute('disabled', '')
    viewport.focus()
  })

  // Handle all liveMap specific key presses
  containerElement.addEventListener('keyup', (e) => {
    // Show overlays when any key is pressed other than Escape
    if (e.key !== 'Escape') {
      getVisibleFeatures()
    }
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && state.selectedFeatureId !== '') {
      setSelectedFeature()
    }
    // Set selected feature on [1-9] key presss
    const visibleFeatures = labels.getSource().getFeatures()
    if (!isNaN(e.key) && e.key >= 1 && e.key <= visibleFeatures.length && visibleFeatures.length <= 9) {
      setSelectedFeature(labels.getSource().getFeatureById(e.key).get('featureId'))
    }
  })

  // River level navigation
  containerElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('defra-button-secondary')) {
      const newFeatureId = e.target.getAttribute('data-id')
      const feature = river.getSource().getFeatureById(newFeatureId) || tide.getSource().getFeatureById(newFeatureId)
      setSelectedFeature(newFeatureId)
      panToFeature(feature)
    }
  })

  // Show attributions click
  // backgroundElement.addEventListener('click', (e) => {
  //   container.showInfo('Choose base map type', '<span>Some controls here...</span>')
  // })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = (mapId, options = {}) => {
  // Set meta title and page heading
  options.originalTitle = document.title
  options.heading = 'Live flood map'
  options.title = options.heading + ' - Check for flooding - GOV.UK'

  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = options.title // document.title
    const uri = window.location.href
    window.history.replaceState(data, title, uri)
  }

  // Build default uri
  let uri = window.location.href
  uri = addOrUpdateParameter(uri, 'v', mapId)
  uri = addOrUpdateParameter(uri, 'lyr', options.layers || '')
  uri = addOrUpdateParameter(uri, 'ext', options.extent || '')
  uri = addOrUpdateParameter(uri, 'fid', options.selectedId || '')

  // Create map button
  const btnContainer = document.getElementById(mapId)
  const button = document.createElement('a')
  button.setAttribute('href', uri)
  if (options.btnType !== 'link') {
    button.setAttribute('role', 'button')
    button.setAttribute('data-module', 'govuk-button')
  }
  button.id = mapId + '-btn'
  button.innerHTML = `<svg width="15" height="20" viewBox="0 0 15 20" focusable="false"><path d="M15,7.5c0.009,3.778 -4.229,9.665 -7.5,12.5c-3.271,-2.835 -7.509,-8.722 -7.5,-12.5c0,-4.142 3.358,-7.5 7.5,-7.5c4.142,0 7.5,3.358 7.5,7.5Zm-7.5,5.461c3.016,0 5.461,-2.445 5.461,-5.461c0,-3.016 -2.445,-5.461 -5.461,-5.461c-3.016,0 -5.461,2.445 -5.461,5.461c0,3.016 2.445,5.461 5.461,5.461Z" fill="currentColor"/></svg><span>${options.btnText || 'View map'}</span><span class="govuk-visually-hidden">(Visual only)</span>`
  button.className = options.btnClasses || (options.btnType === 'link' ? 'defra-link-icon-s' : 'defra-button-secondary defra-button-secondary--icon')
  btnContainer.parentNode.replaceChild(button, btnContainer)

  // Detect keyboard interactions
  window.addEventListener('keydown', (e) => {
    maps.isKeyboard = true
  })
  // Needs keyup to detect first tab into web area
  window.addEventListener('keyup', (e) => {
    maps.isKeyboard = true
  })
  window.addEventListener('pointerdown', (e) => {
    maps.isKeyboard = false
  })
  window.addEventListener('focusin', (e) => {
    if (maps.isKeyboard) {
      e.target.setAttribute('keyboard-focus', '')
    }
  })
  window.addEventListener('focusout', (e) => {
    forEach(document.querySelectorAll('[keyboard-focus]'), (element) => {
      element.removeAttribute('keyboard-focus')
    })
  })

  // Create map on button press
  button.addEventListener('click', (e) => {
    e.preventDefault()
    // Advance history
    const data = { v: mapId, isBack: true }
    const title = options.title // document.title
    window.history.pushState(data, title, uri)
    options.isBack = true
    return new LiveMap(mapId, options)
  })

  // Recreate map on browser history change
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.v === mapId) {
      options.isBack = window.history.state.isBack
      return new LiveMap(e.state.v, options)
    }
  })

  // Recreate map on page refresh
  if (window.flood.utils.getParameterByName('v') === mapId) {
    options.isBack = window.history.state.isBack
    return new LiveMap(mapId, options)
  }
}
