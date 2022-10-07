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
    btnText: `View map of the flood ${window.flood.model.type} area`,
    btnClasses: 'defra-button-secondary defra-button-secondary--icon govuk-!-margin-top-4',
    layers: 'mv,ts,tw,ta',
    extent: window.flood.model.bbox,
    targetArea: {
      id: window.flood.model.id,
      name: window.flood.model.name,
      centre: window.flood.model.centroid
    },
    selectedId: window.flood.model.id
  })
}
