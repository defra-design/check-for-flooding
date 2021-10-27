'use strict'
import 'elm-pep'
import '../core'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/tooltip'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map of levels',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.bbox
  })
}

// Add tool tips
const { forEach } = window.flood.utils
const tooltips = document.querySelectorAll('.defra-tooltip')
if (tooltips) {
  forEach(tooltips, tooltip => {
    window.flood.createTooltip(tooltip)
  })
}
