'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer
import { LngLatBounds, LngLat } from 'maplibre-gl'

const { addOrUpdateParameter, getParameterByName, forEach, xhr } = window.flood.utils
const maps = window.flood.maps
const MapContainer = maps.MapContainer
const nrwUrl = process.env.NRW_URL

function LiveMap (mapId, options) {
  //
  // Private methods
  //

  // Compare two lonLat extent arrays and return true if they are 'considered' different
  const isNewExtent = (newExt) => {
    // Check either lons or lats are the same
    const isSameLon1 = newExt[0] < (state.initialExt[0] + 0.0001) && newExt[0] > (state.initialExt[0] - 0.0001)
    const isSameLon2 = newExt[2] < (state.initialExt[2] + 0.0001) && newExt[2] > (state.initialExt[2] - 0.0001)
    const isSameLat1 = newExt[1] < (state.initialExt[1] + 0.0001) && newExt[1] > (state.initialExt[1] - 0.0001)
    const isSameLat2 = newExt[3] < (state.initialExt[3] + 0.0001) && newExt[3] > (state.initialExt[3] - 0.0001)
    const isSameWidth = isSameLon1 && isSameLon2
    const isSameHeight = isSameLat1 && isSameLat2
    // Check origianl extent is contained within the new extent
    const newBounds = new LngLatBounds(
      new LngLat(newExt[0], newExt[1]),
      new LngLat(newExt[2], newExt[3])
    )
    const initialSW = new LngLat(state.initialExt[0], state.initialExt[1])
    const initialNE = new LngLat(state.initialExt[2], state.initialExt[3])
    const isInititalWithinNew = newBounds.contains(initialSW) && newBounds.contains(initialNE)
    return !((isSameWidth || isSameHeight) && isInititalWithinNew)
  }

  // Add target areas to corresponsing warning layers
  const addWarnings = (geojson) => {
    // Add a target area if not active
    if (state.targetArea && !geojson.features.filter(f => f.properties.id === state.targetArea.properties.id).length) {
      geojson.features.push(state.targetArea)
    }
    // Add point data here to save on requests
    map.getSource('warnings').setData(geojson)
    const warnings = geojson.features // .filter(f => f.properties.state !== 'removed')
    // Set fill colour for target areas
    const severe = warnings.filter(w => w.properties.state === 'severe').map(w => w.properties.id)
    const warning = warnings.filter(w => w.properties.state === 'warning').map(w => w.properties.id)
    const alert = warnings.filter(w => w.properties.state === 'alert').map(w => w.properties.id)
    map.setPaintProperty('target-areas', 'fill-color', ['case',
      ['in', ['get', 'id'], ['literal', severe.length ? severe : '']], '#E3000F',
      ['in', ['get', 'id'], ['literal', warning.length ? warning : '']], '#E3000F',
      ['in', ['get', 'id'], ['literal', alert.length ? alert : '']], '#F18700',
      '#6F777B']
    )
    state.warnings = warnings
    setFeatureVisibility()
  }

  // Show or hide layers or features within layers
  const setFeatureVisibility = () => {
    // Get layers from querystring
    if (getParameterByName('lyr')) {
      state.layers = getParameterByName('lyr').split(',')
      // Set input states in the key
      const inputs = document.querySelectorAll('.defra-map-key input')
      forEach(inputs, (input) => { input.checked = state.layers.includes(input.id) })
    }
    // Toggle base layer group
    baseLayers.forEach(layer => {
      map.setLayoutProperty(layer.id, 'visibility', state.layers.includes('mv') ? 'visible' : 'none')
    })
    // Apply base layer custom properties
    map.setLayoutProperty('country names', 'visibility', 'none')
    // Toggle aerial layer
    map.setLayoutProperty('aerial', 'visibility', state.layers.includes('sv') ? 'visible' : 'none')
    const types = Object.keys(layersConfig).filter(k => state.layers.includes(layersConfig[k]))
    // Add inactive type for target areas
    types.push('inactive')
    // Conditionally hide selected feature
    if (state.selectedFeature) {
      const properties = state.selectedFeature.properties
      const type = properties.type === 'targetarea' ? properties.state : properties.type
      if (!types.includes(type)) toggleSelectedFeature(null)
    }
    // Filter warning points and stations
    map.setFilter('warnings', ['all', ['match', ['get', 'state'], types.length ? types : '', true, false], ['<', ['zoom'], 10]])
    map.setFilter('stations', ['match', ['get', 'type'], types.length ? types : '', true, false])
    // Filter target areas
    const warnings = state.warnings.filter(w => state.layers.includes(layersConfig[w.properties.state])).map(f => f.properties.id)
    // Add target area id if not active
    if (state.targetArea && !state.warnings.find(w => w.properties.id === state.targetArea.properties.id)) {
      warnings.push(state.targetArea.properties.id)
    }
    map.setFilter('target-areas', ['match', ['get', 'id'], warnings.length ? warnings : '', true, false])
    // Toggle river line visibility
    map.setLayoutProperty('rivers-fluvial', 'visibility', state.layers.includes('rl') ? 'visible' : 'none')
    map.setLayoutProperty('rivers-tidal-outer', 'visibility', state.layers.includes('rl') ? 'visible' : 'none')
    map.setLayoutProperty('rivers-tidal-inner', 'visibility', state.layers.includes('rl') ? 'visible' : 'none')
    map.setLayoutProperty('rivers-arrow', 'visibility', state.layers.includes('rl') ? 'visible' : 'none')
  }

  // Set selected feature
  const toggleSelectedFeature = (feature, updateHistory = true) => {
    if (feature) {
      state.selectedFeature = feature
      feature.properties.selected = '-selected'
      map.getSource('selected').setData({ type: 'FeatureCollection', features: [feature] })
      const layoutIconImage = map.getLayoutProperty(feature.layer.id, 'icon-image')
      map.setLayoutProperty('selected', 'icon-image', layoutIconImage, { validate: false })
      map.setFilter('selected', map.getFilter(feature.layer.id))
      map.setFilter('target-areas-selected', ['in', 'id', feature.properties.id])
      const html = getFeatureHtml(feature.properties)
      container.showInfo('Selected feature information', html)
    } else {
      state.selectedFeature = null
      map.getSource('selected').setData({ type: 'FeatureCollection', features: [] })
      map.setFilter('target-areas-selected', ['in', 'id', ''])
    }
    if (updateHistory) {
      replaceHistory('fid', feature ? feature.properties.id : '')
    }
  }

  // Show or hide rivers
  const toggleRiver = (riverId, updateHistory = true) => {
    if (riverId) {
      map.setFilter('rivers-fluvial', ['all', ['==', 'river_id', riverId], ['==', 'form', 'inlandRiver']])
      map.setFilter('rivers-tidal-outer', ['all', ['==', 'river_id', riverId], ['==', 'form', 'tidalRiver']])
      map.setFilter('rivers-tidal-inner', ['all', ['==', 'river_id', riverId], ['==', 'form', 'tidalRiver']])
      map.setFilter('rivers-arrow', ['==', 'river_id', riverId])
    } else {
      map.setFilter('rivers-fluvial', ['==', 'id', ''])
      map.setFilter('rivers-tidal-outer', ['==', 'id', ''])
      map.setFilter('rivers-tidal-inner', ['==', 'id', ''])
      map.setFilter('rivers-arrow', ['==', 'id', ''])
    }
    if (updateHistory) {
      replaceHistory('rid', riverId)
    }
  }

  // Toggle key symbols based on resolution
  const toggleKeySymbol = () => {
    forEach(containerElement.querySelectorAll('.defra-map-key__symbol[data-display="toggle-image"]'), (symbol) => {
      const isBigZoom = map.getZoom() > 10
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
    // let name = ''
    // if (feature.get('type') === 'C') {
    //   name = `Tide level: ${feature.get('name')}`
    // } else if (feature.get('type') === 'S' || feature.get('type') === 'M') {
    //   name = `River level: ${feature.get('name')}, ${feature.get('river')}`
    // } else if (feature.get('type') === 'G') {
    //   name = `Groundwater level: ${feature.get('name')}`
    // } else if (feature.getId().startsWith('rainfall_stations')) {
    //   name = `Rainfall: ${feature.get('station_name')}`
    // } else if (feature.get('severity_value') === 3) {
    //   name = `Severe flood warning: ${feature.get('ta_name')}`
    // } else if (feature.get('severity_value') === 2) {
    //   name = `Flood warning: ${feature.get('ta_name')}`
    // } else if (feature.get('severity_value') === 1) {
    //   name = `Flood alert: ${feature.get('ta_name')}`
    // }
    // return name
  }

  // Get features visible in the current viewport
  const getVisibleFeatures = () => {
    // const features = []
    // const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    // const resolution = map.getView().getResolution()
    // const extent = map.getView().calculateExtent(map.getSize())
    // const isBigZoom = resolution <= maps.liveMaxBigZoom
    // const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    // if (!layers.includes(warnings) && targetArea.pointFeature) {
    //   layers.push(warnings)
    // }
    // layers.forEach((layer) => {
    //   layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
    //     if (layer.get('ref') === 'warnings' && !feature.get('isVisible')) { return false }
    //     features.push({
    //       id: feature.getId(),
    //       name: featureName(feature),
    //       state: layer.get('ref'), // Used to style the overlay
    //       isBigZoom: isBigZoom,
    //       centre: feature.getGeometry().getCoordinates()
    //     })
    //   })
    // })
    // return features
  }

  // Show overlays
  const showOverlays = () => {
    // state.visibleFeatures = getVisibleFeatures()
    // const numFeatures = state.visibleFeatures.length
    // const numWarnings = state.visibleFeatures.filter((feature) => feature.state === 'warnings').length
    // const mumMeasurements = numFeatures - numWarnings
    // const features = state.visibleFeatures.slice(0, 9)
    // // Show visual overlays
    // hideOverlays()
    // if (maps.isKeyboard && numFeatures >= 1 && numFeatures <= 9) {
    //   state.hasOverlays = true
    //   features.forEach((feature, i) => {
    //     const overlayElement = document.createElement('span')
    //     overlayElement.setAttribute('aria-hidden', true)
    //     overlayElement.innerText = i + 1
    //     const selected = feature.id === state.selectedFeatureId ? 'defra-key-symbol--selected' : ''
    //     map.addOverlay(
    //       new Overlay({
    //         id: feature.id,
    //         element: overlayElement,
    //         position: feature.centre,
    //         className: `defra-key-symbol defra-key-symbol--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''} ${selected}`,
    //         offset: [0, 0]
    //       })
    //     )
    //   })
    // }
    // // Show non-visual feature details
    // const model = {
    //   numFeatures: numFeatures,
    //   numWarnings: numWarnings,
    //   mumMeasurements: mumMeasurements,
    //   features: features
    // }
    // const html = window.nunjucks.render('description-live.html', { model: model })
    // viewportDescription.innerHTML = html
  }

  // Hide overlays
  const hideOverlays = () => {
    // state.hasOverlays = false
    // map.getOverlays().clear()
  }

  // Set target area polygon opacity
  const setFillOpacity = (layers) => {
    const settings = ['interpolate', ['exponential', 0.5], ['zoom'], 10, 1, 16, 0.3]
    layers.forEach(l => { map.setPaintProperty(l, 'fill-opacity', settings) })
  }

  // Pan map
  const panToFeature = (feature) => {
    // let extent = map.getView().calculateExtent(map.getSize())
    // extent = buffer(extent, -1000)
    // if (!containsExtent(extent, feature.getGeometry().getExtent())) {
    //   map.getView().setCenter(feature.getGeometry().getCoordinates())
    // }
  }

  // Day format function
  const formatDay = (date) => {
    const day = date.getDate()
    const nth = (day) => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' }
    }
    const shortDay = date.toLocaleString('en-GB', { weekday: 'short' })
    const today = new Date()
    const yesterday = new Date()
    const tomorrow = new Date()
    today.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    if (date.getTime() === today.getTime()) {
      return 'today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'yesterday'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'tomorrow'
    } else {
      return ' on ' + shortDay + ' ' + date.getDate() + nth(day)
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
  const getFeatureHtml = (properties) => {
    if (properties.type === 'targetarea') {
      const date = properties.state === 'removed' ? properties.severityChangedDate : properties.issuedDate
      properties.date = `${formatTime(new Date(date))}, ${formatDayMonth(new Date(date))}`
    } else if (properties.latestDate) {
      properties.date = `${formatTime(new Date(properties.latestDate))}, ${formatDayMonth(new Date(properties.latestDate))}`
    }
    properties.nrwUrl = nrwUrl
    const env = window.nunjucks.configure('views')
    env.addFilter('isNumber', (value) => { return typeof value === 'number' }, true)
    return env.render('info-live.html', { model: properties })
  }

  // Get feature by id or point, requires warnings object
  const getFeatureInView = (point, id, warnings) => {
    let feature = map.queryRenderedFeatures(point, {
      layers: featureLayers,
      filter: id ? ['in', ['get', 'id'], id] : undefined,
      validate: false
    }).find(f => f !== undefined)
    if (feature && feature.source === 'polygons') {
      feature = warnings.find(f => f.properties.id === feature.id)
      if (feature) {
        feature.layer = { id: 'warnings' }
      }
    }
    return feature
  }

  // Map has rendered so we can now customise the setup
  const setup = () => {
    // Show reset button if extent has changed
    const ext = maps.getExtentFromBounds(map.getBounds())
    if (isNewExtent(ext)) {
      resetButton.removeAttribute('disabled')
    }
    // Show selected feature
    if (getParameterByName('fid')) {
      const fid = decodeURI(getParameterByName('fid'))
      const feature = getFeatureInView(null, fid, state.warnings)
      toggleSelectedFeature(feature, false)
    }
    // Show selected river
    if (getParameterByName('rid')) {
      const rid = parseInt(decodeURI(getParameterByName('rid')), 10)
      toggleRiver(rid, false)
    }
  }

  // We need to wait for style data to load before adding sources and layers
  const initMap = () => {
    // Get a reference to background layers
    baseLayers = map.getStyle().layers
    map.moveLayer('buildings 2D', 'surfacewater shadow')
    map.moveLayer('buildings 3D', 'surfacewater shadow')
    // Add sources
    map.addSource('aerial', maps.style.source.aerial)
    map.addSource('polygons', maps.style.source.polygons)
    map.addSource('warnings', maps.style.source.warnings)
    map.addSource('stations', maps.style.source.stations)
    map.addSource('selected', maps.style.source.selected)
    // Add layers
    map.addLayer(maps.style.aerial, baseLayers[0].id)
    // Target areas
    map.addLayer(maps.style['target-areas'], 'surfacewater shadow')
    map.addLayer(maps.style['target-areas-selected'], 'road numbers')
    // River centre lines
    map.addLayer(maps.style['rivers-fluvial'], 'road numbers')
    map.addLayer(maps.style['rivers-tidal-outer'], 'road numbers')
    map.addLayer(maps.style['rivers-tidal-inner'], 'road numbers')
    map.addLayer(maps.style['rivers-arrow'], 'road numbers')
    // Points
    map.addLayer(maps.style.stations)
    map.addLayer(maps.style.warnings)
    map.addLayer(maps.style.selected)
    // Add warnings data here so that we have access features outside viewport
    loadGeoJson(`${window.location.origin}/service/geojson/warnings`, addWarnings)
    // Set polygon opacity
    setFillOpacity(['target-areas'])
  }

  // A helper method to load geojson at runtime
  const loadGeoJson = (uri, callback) => {
    xhr(uri, (err, response) => {
      if (err) {
        console.log('Error: ' + err)
        // Continue without warnings or display an error?
        setFeatureVisibility()
      } else {
        callback(response)
      }
    }, 'json')
  }

  //
  // Configure
  //

  // Layers config
  const layersConfig = { default: 'mv', aerial: 'ms', severe: 'ts', warning: 'tw', alert: 'ta', removed: 'tr', river: 'ri', sea: 'se', groundwater: 'gr', rain: 'rf' }

  // State object
  const state = {
    isFirstRenderComplete: false,
    warnings: [],
    visibleFeatures: [],
    selectedFeature: null,
    riverId: null,
    targetArea: null,
    initialExt: [],
    layers: []
  }

  // Layers
  let baseLayers
  const featureLayers = ['target-areas', 'stations', 'warnings']

  // Define bounds
  let ext = getParameterByName('ext')
  if (ext) {
    ext = maps.cleanExtent(ext.split(','))
  } else if (options.extent && options.extent.length) {
    ext = maps.cleanExtent(options.extent)
  } else if (options.centre) {
    ext = null
  } else {
    ext = maps.extent
  }

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    bounds: ext,
    centre: options.centre,
    zoom: 10,
    queryParamKeys: ['v', 'lyr', 'ext', 'fid', 'rid'],
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

  // Store extent for use with reset button
  state.initialExt = window.history.state?.initialExt || maps.getExtentFromBounds(map.getBounds())

  toggleKeySymbol()

  // Create target area feature if not active
  if (options.targetArea) {
    state.targetArea = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: options.targetArea.centre
      },
      properties: {
        id: options.targetArea.id,
        name: options.targetArea.name,
        state: 'inactive',
        type: 'targetarea'
      }
    }
  }

  //
  // Events
  //

  // We need to wait for style data and icons to load before we can initialise the map
  map.once('styledata', () => {
    // Create multiple images from one sprite file
    const images = []
    // Cant use a base64 image string in ie11
    map.loadImage('/public/images/map-symbols.png', (error, sprite) => {
      Object.keys(maps.symbols).forEach(key => {
        const pos = maps.symbols[key]
        if (error) throw error
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        context.canvas.width = pos.size
        context.canvas.height = pos.size
        context.drawImage(sprite, pos.left, pos.top, pos.size, pos.size, 0, 0, pos.size, pos.size)
        const dataUrl = canvas.toDataURL('img/png')
        const image = document.createElement('img')
        image.src = dataUrl
        image.onload = () => {
          map.addImage(key, image)
          images.push(key)
          if (images.length === Object.keys(maps.symbols).length) {
            initMap()
          }
        }
      })
    })
  })

  // Hack! We need to know when features have been rendered so we can query them
  const isFirstRenderComplete = () => {
    map.off('idle', isFirstRenderComplete)
    state.isFirstRenderComplete = true
    setup()
  }
  map.on('idle', isFirstRenderComplete)

  let timer = null
  map.on('moveend', () => {
    // Toggle key symbols depending on resolution
    toggleKeySymbol()
    // Clear viewport description to force screen reader to re-read
    viewportDescription.innerHTML = ''
    // Tasks dependent on a time delay
    clearTimeout(timer)
    timer = setTimeout(() => {
      // Update url (history state) to reflect new extent
      const ext = maps.getExtentFromBounds(map.getBounds())
      replaceHistory('ext', ext.join(','))
      // Show reset button if extent has changed
      if (isNewExtent(ext)) {
        resetButton.removeAttribute('disabled')
      }
    }, 350)
  })

  // Map click
  map.on('click', (e) => {
    if (!state.isFirstRenderComplete) return
    const feature = getFeatureInView(e.point, null, state.warnings)
    toggleSelectedFeature(feature)
    toggleRiver(feature ? feature.properties.riverId : '')
  })

  // Change cursor on feature hover
  featureLayers.forEach(layer => {
    map.on('mouseenter', layer, (e) => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', layer, (e) => {
      map.getCanvas().style.cursor = ''
    })
  })

  // Set selected feature if map is clicked
  // Clear overlays if non-keyboard interaction
  // map.addEventListener('click', (e) => {
  //   // Hide overlays if non-keyboard interaction
  //   if (!maps.isKeyboard) {
  //     hideOverlays()
  //   }
  //   // Get mouse coordinates and check for feature
  //   const featureId = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
  //     if (!defaultLayers.includes(layer)) {
  //       return feature.getId()
  //     }
  //   })
  //   setSelectedFeature(featureId)
  // })

  // Show overlays on first tab in from browser controls
  // viewport.addEventListener('focus', (e) => {
  //   if (maps.isKeyboard) {
  //     showOverlays()
  //   }
  // })

  // Toggle layers/features when key item clicked
  keyElement.addEventListener('click', (e) => {
    if (e.target.nodeName !== 'INPUT') { return }
    e.stopPropagation()
    state.layers = [...keyElement.querySelectorAll('input')].filter(x => x.checked).map(x => x.id)
    // targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
    replaceHistory('lyr', state.layers.join(','))
    setFeatureVisibility()
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    toggleSelectedFeature(null)
  })

  // Clear selectedfeature when key is opened
  openKeyButton.addEventListener('click', (e) => {
    toggleSelectedFeature(null)
  })

  // Reset map extent on reset button click
  resetButton.addEventListener('click', (e) => {
    maps.fitBoundsFromExtent(map, state.initialExt)
    resetButton.setAttribute('disabled', '')
    viewport.focus()
  })

  // Handle all liveMap specific key presses
  // containerElement.addEventListener('keyup', (e) => {
  //   // Show overlays when any key is pressed other than Escape
  //   if (e.key !== 'Escape') {
  //     showOverlays()
  //   }
  //   // Clear selected feature when pressing escape
  //   if (e.key === 'Escape' && state.selectedFeatureId !== '') {
  //     setSelectedFeature()
  //   }
  //   // Set selected feature on [1-9] key presss
  //   if (!isNaN(e.key) && e.key >= 1 && e.key <= state.visibleFeatures.length && state.visibleFeatures.length <= 9) {
  //     setSelectedFeature(state.visibleFeatures[e.key - 1].id)
  //   }
  // })

  // River level navigation
  // containerElement.addEventListener('click', (e) => {
  //   if (e.target.classList.contains('defra-button-secondary')) {
  //     const newFeatureId = e.target.getAttribute('data-id')
  //     const feature = river.getSource().getFeatureById(newFeatureId) || tide.getSource().getFeatureById(newFeatureId)
  //     setSelectedFeature(newFeatureId)
  //     panToFeature(feature)
  //   }
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

  // Build default uri
  let uri = window.location.href
  uri = addOrUpdateParameter(uri, 'v', mapId)
  uri = addOrUpdateParameter(uri, 'lyr', options.layers || '')
  uri = addOrUpdateParameter(uri, 'ext', options.extent || '')
  uri = addOrUpdateParameter(uri, 'fid', options.selectedId || '')
  uri = addOrUpdateParameter(uri, 'rid', options.riverId || '')

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

  // Detect keyboard interaction
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
    // Advance history
    const data = { v: mapId, isBack: true }
    const title = options.title // document.title
    let uri = window.location.href
    uri = addOrUpdateParameter(uri, 'v', mapId)
    // Add any querystring parameters from constructor
    if (options.layers) { uri = addOrUpdateParameter(uri, 'lyr', options.layers) }
    if (options.extent) { uri = addOrUpdateParameter(uri, 'ext', options.extent) }
    if (options.selectedId) { uri = addOrUpdateParameter(uri, 'fid', options.selectedId) }
    window.history.pushState(data, title, uri)
    options.isBack = true
    return new LiveMap(mapId, options)
  })

  // Recreate map on browser history change
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.v === mapId) {
      options.isBack = window.history.state.isBack
      // Safari bfcache behaviour
      const container = document.getElementById(mapId)
      if (container) container.remove()
      return new LiveMap(e.state.v, options)
    }
  })

  // Recreate map on page refresh
  if (window.flood.utils.getParameterByName('v') === mapId) {
    options.isBack = window.history.state && window.history.state.isBack
    return new LiveMap(mapId, options)
  }
}
