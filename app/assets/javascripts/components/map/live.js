'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Overlay, Feature } from 'ol'
import { transform, transformExtent } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { Point } from 'ol/geom'
import { buffer, containsExtent } from 'ol/extent'
import { fromExtent } from 'ol/geom/Polygon'
import GeoJSON from 'ol/format/GeoJSON'

import * as turf from '@turf/turf'

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
    // hasOverlays: false
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

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: maps.liveMaxBigZoom,
    view: view,
    // layers: layers,
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
    dataLayers.forEach((layer) => {
      const isVisible = lyrCodes.some(lyrCode => layer.get('featureCodes').includes(lyrCode))
      layer.setVisible(isVisible)
    })
    road.setVisible(lyrCodes.includes('mv'))
    satellite.setVisible(lyrCodes.includes('sv'))
    // Overide wanrings visibility if target area provided
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

  // Show or hide features within layers
  const setFeatureVisibility = (lyrCodes) => {
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
    dataLayers.forEach((layer) => {
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
      // Toggle overlay selected state
      // if (state.hasOverlays) {
      //   if (originalFeature && map.getOverlayById(state.selectedFeatureId)) {
      //     const overlayElement = map.getOverlayById(state.selectedFeatureId).getElement().parentNode
      //     overlayElement.classList.remove('defra-key-symbol--selected')
      //   }
      //   if (newFeature && map.getOverlayById(newFeatureId)) {
      //     const overlayElement = map.getOverlayById(newFeatureId).getElement().parentNode
      //     overlayElement.classList.add('defra-key-symbol--selected')
      //   }
      // }
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
    const extent = map.getView().calculateExtent(map.getSize())
    const turfExtentPolygon = turf.polygon(fromExtent(extent).getCoordinates())
    const isBigZoom = resolution <= maps.liveMaxBigZoom
    const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    // if (!layers.includes(warnings) && targetArea.pointFeature) {
    //   layers.push(warnings)
    // }
    // Check vectortile polygons
    if (layers.includes(warnings) && isBigZoom) {
      // Get polygons where bbox intersects extent
      const vectorTileFeatures = []
      vectorTilePolygons.getSource().getFeaturesInExtent(extent).forEach(feature => {
        const warning = warnings.getSource().getFeatureById(feature.getId())
        if (!!warning && warning.get('isVisible')) {
          const vectorTileFeature = new Feature({
            geometry: feature.getGeometry(),
            name: warning.get('name')
          })
          vectorTileFeature.setId(feature.getId())
          vectorTileFeatures.push(vectorTileFeature)
        }
      })
      // Simplify, clip and merge polygons
      const multiPointFeatures = []
      vectorTileFeatures.forEach((feature, i) => {
        const coordinates = feature.getGeometry().getCoordinates()
        // Simplify polygons
        const options = { tolerance: 100, highQuality: false }
        const turfPolygon = feature.getGeometry().getType() === 'MultiPolygon'
          ? turf.simplify(turf.multiPolygon(coordinates), options)
          : turf.simplify(turf.polygon(coordinates), options)
        // Clip polygons to extent
        const clippedPolygon = turf.intersect(turfPolygon, turfExtentPolygon)
        if (!clippedPolygon) return
        feature.setGeometry(new GeoJSON().readFeature(clippedPolygon).getGeometry())
        // Merge polygons of the same feature
        const masterFeature = multiPointFeatures.find(x => x.id_ === feature.getId())
        if (masterFeature) {
          const masterCoordinates = masterFeature.getGeometry().getCoordinates()
          const masterPolygon = masterFeature.getGeometry().getType() === 'MultiPolygon'
            ? turf.multiPolygon(masterCoordinates)
            : turf.polygon(masterCoordinates)
          const turfFeature = turf.union(masterPolygon, clippedPolygon)
          const mergedFeature = new GeoJSON().readFeature(turfFeature)
          masterFeature.setGeometry(mergedFeature.getGeometry())
        } else {
          multiPointFeatures.push(feature)
        }
      })
      // Change geometry to multiPoint
      multiPointFeatures.forEach((feature, i) => {
        const geometry = feature.getGeometry()
        feature.setGeometry(geometry.getType() === 'MultiPolygon'
          ? geometry.getInteriorPoints()
          : geometry.getInteriorPoint()
        )
        labels.getSource().addFeature(feature)
      })
    }
    // Check point features
    layers.forEach((layer) => {
      layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
        if (layer.get('ref') === 'warnings' && (isBigZoom || !feature.get('isVisible'))) return
        const pointFeature = new Feature({
          geometry: feature.getGeometry(),
          name: feature.get('name')
        })
        pointFeature.setId(feature.getId())
        labels.getSource().addFeature(pointFeature)
      })
    })
    // Add identifier to each feature
    labels.getSource().forEachFeature((feature, i) => {
      feature.set('identifier', (i + 1))
      console.log(i)
    })
  }

  // Show overlays
  const showLabels = () => {
    getVisibleFeatures()
    const numFeatures = labels.getSource().getFeatures().length
    const numWarnings = state.visibleFeatures.filter((feature) => feature.state === 'warnings').length
    const mumMeasurements = numFeatures - numWarnings
    // const features = state.visibleFeatures.slice(0, 9)
    // Show visual overlays
    labels.setVisible(maps.isKeyboard && numFeatures >= 1 && numFeatures <= 9)
    // hideLabels()
    // if (maps.isKeyboard && numFeatures >= 1 && numFeatures <= 9) {
    //   state.hasOverlays = true
    //   features.forEach((feature, i) => {
    //     const text = i + 1
    //     feature.labelCoordinates.forEach((coordinate, i) => {
    //       const overlayElement = document.createElement('span')
    //       overlayElement.setAttribute('aria-hidden', true)
    //       overlayElement.innerText = text
    //       const selected = feature.id === state.selectedFeatureId ? 'defra-key-symbol--selected' : ''
    //       map.addOverlay(
    //         new Overlay({
    //           id: `feature.id-${i}`,
    //           element: overlayElement,
    //           position: coordinate,
    //           className: `defra-key-symbol defra-key-symbol--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''} ${selected}`,
    //           offset: [0, 0]
    //         })
    //       )
    //     })
    //   })
    // }
    // Show non-visual feature details
    const model = {
      numFeatures: numFeatures,
      numWarnings: numWarnings,
      mumMeasurements: mumMeasurements,
      features: []
    }
    const html = window.nunjucks.render('description-live.html', { model: model })
    viewportDescription.innerHTML = html
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
  dataLayers.forEach((layer) => {
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
        // setFeatureVisibility(lyrs, layer)
        // Store reference to warnings source for use in vector tiles style function
        if (layer.get('ref') === 'warnings') {
          const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
          setFeatureVisibility(lyrs)
          maps.warningsSource = warnings.getSource()
          map.addLayer(vectorTilePolygons)
        }
        // Attempt to set selected feature when layer is ready
        setSelectedFeature(state.selectedFeatureId)
        // Show overlays
        showLabels()
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
      showLabels()
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
      if (!defaultLayers.includes(layer)) { return true }
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
      if (!defaultLayers.includes(layer)) {
        return feature.getId()
      }
    })
    setSelectedFeature(featureId)
  })

  // Show overlays on first tab in from browser controls
  viewport.addEventListener('focus', (e) => {
    if (maps.isKeyboard) {
      showLabels()
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
          setFeatureVisibility(lyrs)
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
      showLabels()
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
      showLabels()
    }
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && state.selectedFeatureId !== '') {
      setSelectedFeature()
    }
    // Set selected feature on [1-9] key presss
    if (!isNaN(e.key) && e.key >= 1 && e.key <= state.visibleFeatures.length && state.visibleFeatures.length <= 9) {
      setSelectedFeature(state.visibleFeatures[e.key - 1].id)
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

  // Vectortiles loadend
  // vectorTilePolygons.getSource().addEventListener('tileloadend', (e) => {
  //   showLabels()
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
