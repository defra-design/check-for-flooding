'use strict'
import 'elm-pep'
import '../components/charts'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Create LiveMap
window.flood.maps.createLiveMap('map', {
  btnText: 'View map',
  btnClasses: 'defra-button-map-s',
  layers: 'mv,rf',
  centre: window.flood.model.coordinates,
  selectedId: window.flood.model.id,
  zoom: 14
})
