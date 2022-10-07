'use strict'
import 'elm-pep'
import '../core'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/symbols'
import '../components/map/style'
import '../components/map/container'
import '../components/map/live'

// Create LiveMap
if (document.getElementById('map-live')) {
  window.flood.maps.createLiveMap('map-live', {
    btnText: 'View map of flood warnings and alerts',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ts,tw,ta',
    extent: window.flood.model.bbox
  })
}
