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
