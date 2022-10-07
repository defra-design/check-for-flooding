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
import '../components/levels-table'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map of levels',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr,rf,rl',
    extent: window.flood.model.bbox,
    riverId: window.flood.model.riverId
  })
}

// Add category tabs progressive enhancement
if (document.getElementById('filter')) {
  window.flood.createLevelsTable('filter')
}
