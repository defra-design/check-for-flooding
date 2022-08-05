'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Feature } from 'ol'
import { transform, transformExtent } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { Point } from 'ol/geom'
import { buffer as bufferExtent, containsExtent } from 'ol/extent'
import { fromExtent } from 'ol/geom/Polygon'
import { Control } from 'ol/control'
import GeoJSON from 'ol/format/GeoJSON'

import { polygon, multiPolygon } from '@turf/helpers'
import simplify from '@turf/simplify'
import intersect from '@turf/intersect'
import union from '@turf/union'

const { addOrUpdateParameter, getParameterByName, forEach, xhr } = window.flood.utils
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
  const riverLine = maps.layers.riverLine() // Test
  const warnings = maps.layers.warnings()
  const river = maps.layers.river()
  const sea = maps.layers.sea()
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
    riverLine, // Test
    river,
    sea,
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
  const toggleLayerVisibility = (lyrCodes) => {
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
        // River (Tidal)
        if (props.riverSlug) {
          if (props.status === 'Suspended' || props.status === 'Closed' || (!props.value && !props.iswales)) {
            state = 'riverError'
          } else {
            state = 'river'
          }
        // Sea level
        } else {
          if (props.status === 'Suspended' || props.status === 'Closed' || (!props.value && !props.iswales)) {
            state = 'seaError'
          } else {
            state = 'sea'
          }
        }
      } else if (props.type === 'R') {
        // Rainfall
        state = props.value24hr && props.value24hr > 0 ? 'rain' : 'rainDry'
      }
      // WebGl: Feature properties must be strings or numbers
      feature.set('state', state)
    })
  }

  // Show or hide rivers
  const toggleRiver = (featureId) => {
    const feature = river.getSource().getFeatureById(featureId)
    const riverId = feature ? feature.get('riverId') : null
    maps.selectedRiverId = riverId
    vectorTilePolygons.setStyle(maps.styles.vectorTilePolygons)

    //
    // Test
    //
    riverLine.getSource().clear()
    riverLine.setVisible(false)
    if (riverId) {
      xhr(`/service/geojson/river-line/${riverId}`, (error, response) => {
        if (!error) {
          const features = new GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(response)
          riverLine.setVisible(true)
          riverLine.getSource().addFeatures(features)
          riverLine.setStyle(riverLine.getStyle())
        }
      }, 'json')
    }
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
  const toggleSelectedFeature = (newFeatureId = '') => {
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
      // If a river station has been selected determin and stor the vector tile segments
      if (layer.get('ref') === 'river') {
        toggleRiver(newFeatureId)
      }
      // Refresh vector tiles
      if (layer.get('ref') === 'warnings') {
        vectorTilePolygons.setStyle(maps.styles.vectorTilePolygons)
      }
      // Refresh point layers to hide non local rivers
      layer.setStyle(layer.getStyle())
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

  // Get features visible in the current viewport
  const toggleVisibleFeatures = () => {
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
      let pointFeatures = layer.getSource().getFeaturesInExtent(extent)
      // If we have a local river remove all other points
      if (maps.selectedRiverId) {
        pointFeatures = pointFeatures.filter(f => f.get('riverId') === maps.selectedRiverId)
      }
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
    extent = bufferExtent(extent, -1000)
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
    model.id = feature.getId()
    // Format dates and id's for stations
    if (['s', 'r'].includes(feature.getId().toString().charAt(0))) {
      model.id = feature.getId().substring(1)
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
    extent = getLonLatFromExtent(bufferExtent(targetArea.polygonFeature.getGeometry().getExtent(), 150))
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
    toggleLayerVisibility(lyrs)
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
            }
          }
        }
        // WebGL: Limited dynamic styling could be done server side for client performance
        if (['river', 'sea', 'groundwater', 'rainfall'].includes(layer.get('ref'))) {
          setFeatueState(layer)
        }
        // Store reference to warnings source for use in vector tiles style function
        if (layer.get('ref') === 'warnings') {
          const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
          setWarningVisibility(lyrs)
          maps.warningsSource = warnings.getSource()
        }
        // Attempt to set selected feature when layer is ready
        toggleSelectedFeature(state.selectedFeatureId)
        // Show overlays
        toggleVisibleFeatures()
      }
    })
  })

  // Update river display when new tiles load
  // vectorTilePolygons.getSource().on('tileloadend', (e) => {
  //   toggleRiver(state.selectedFeatureId)
  // })

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
      // Update river visibility when new features come into view
      toggleRiver(state.selectedFeatureId)
      // Show overlays for visible features
      toggleVisibleFeatures()
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
      // DBL Test
      if (layer === vectorTilePolygons) {
        console.log(feature.getId())
        console.log(feature.getProperties())
      }
      if (!defaultLayers.includes(layer) || layer === vectorTilePolygons) {
        return feature.getId()
      }
    })
    toggleSelectedFeature(featureId)
  })

  // Show overlays on first tab in from browser controls
  viewport.addEventListener('focus', (e) => {
    if (maps.isKeyboard) {
      toggleVisibleFeatures()
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
      toggleLayerVisibility(lyrs)
      vectorTilePolygons.setStyle(maps.styles.vectorTilePolygons)
      lyrs = lyrs.join(',')
      replaceHistory('lyr', lyrs)
      toggleVisibleFeatures()
    }
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    toggleSelectedFeature()
  })

  // Clear selectedfeature when key is opened
  openKeyButton.addEventListener('click', (e) => {
    toggleSelectedFeature()
  })

  // Reset map extent on reset button click
  resetButton.addEventListener('click', (e) => {
    setExtentFromLonLat(map, state.initialExt)
    resetButton.setAttribute('disabled', '')
    viewport.focus()
  })

  // Handle all liveMap specific key presses
  containerElement.addEventListener('keyup', (e) => {
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && state.selectedFeatureId !== '') {
      toggleSelectedFeature()
    }
    // Set selected feature on [1-9] key presss
    const visibleFeatures = labels.getSource().getFeatures()
    if (!isNaN(e.key) && e.key >= 1 && e.key <= visibleFeatures.length && visibleFeatures.length <= 9) {
      toggleSelectedFeature(labels.getSource().getFeatureById(e.key).get('featureId'))
    }
    // Show overlays when any key is pressed other than Escape
    if (e.key !== 'Escape') {
      toggleVisibleFeatures()
    }
  })

  // River level navigation
  containerElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('defra-button-secondary')) {
      const newFeatureId = e.target.getAttribute('data-id')
      const feature = river.getSource().getFeatureById(newFeatureId) || sea.getSource().getFeatureById(newFeatureId)
      toggleSelectedFeature(newFeatureId)
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
