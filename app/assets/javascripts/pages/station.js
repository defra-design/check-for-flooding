'use strict'
import 'elm-pep'
import '../core'
import '../components/charts'
import '../components/toggletip'
import '../components/toggle-list-display'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

const { forEach } = window.flood.utils

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr',
    centre: window.flood.model.centroid,
    zoom: 14,
    selectedId: `stations.${window.flood.model.id}`
  })
}

// Add toggleTips
const toggletips = document.querySelectorAll('.defra-toggletip')
if (toggletips) {
  forEach(toggletips, toggletip => {
    window.flood.createToggleTip(toggletip)
  })
}
