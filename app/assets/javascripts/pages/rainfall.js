'use strict'
import 'elm-pep'
import '../core'
import '../components/bar-chart'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/toggletip'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,rf',
    centre: window.flood.model.centroid,
    zoom: 14,
    selectedId: `stations.${window.flood.model.id}`
  })
}

// Create bar chart
if (document.getElementById('bar-chart')) {
  window.flood.charts.createBarChart('bar-chart', window.flood.model.telemetryId, window.flood.model.period)
}

// Add toggletips
if (document.querySelectorAll('.defra-toggletip')) {
  window.flood.createToggletips()
}
