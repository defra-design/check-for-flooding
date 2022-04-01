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
    btnText: 'Map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon govuk-!-margin-top-2',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.bbox
  })
}

// Add tool tips
const tooltips = document.querySelectorAll('[data-tooltip]')
if (tooltips) {
  window.flood.createTooltips()
}
