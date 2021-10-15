'use strict'
import 'elm-pep'
import '../core'
import '../components/filter'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Create list filter
const filter = document.getElementById('filter')
if (filter) {
  window.flood.createFilter(filter, {
    detailsId: 'filter-details',
    countId: 'search-count',
    listId: 'list'
  })
}

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.bbox
  })
}
