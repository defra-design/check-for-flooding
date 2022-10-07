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
// import '../components/map/outlook'

// Create LiveMap
if (document.getElementById('map-live')) {
  window.flood.maps.createLiveMap('map-live', {
    btnText: window.flood.model.hasWarnings ? 'View map of flood warnings and alerts' : 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ts,tw,ta'
  })
}

// Create Outlook Map
// if (document.getElementById('map-outlook')) {
//   window.flood.maps.createOutlookMap('map-outlook', {
//     btnText: 'View map showing flood risk areas',
//     btnClasses: 'defra-button-secondary defra-button-secondary--icon',
//     days: window.flood.model.outlookDays
//   })
// }
