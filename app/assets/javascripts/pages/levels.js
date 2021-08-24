'use strict'
import 'elm-pep'
import '../core'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/filter'

// Create list filter
const filter = document.getElementById('filter')
if (filter) {
  window.flood.createFilter(filter)
}

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-map-s',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.bbox
  })
}
