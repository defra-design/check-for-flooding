import '../core'
import '../components/ml-map/maps'
import '../components/ml-map/container'
import '../components/ml-map/live'

// Create LiveMLMap
window.flood.maps.createLiveMLMap('map', {
  // btnText: 'View map',
  // btnClasses: 'defra-button-map-s',
  // layers: 'mv,ri,ti,gr,rf',
  bounds: [[-10.76418, 49.528423], [1.9134116, 61.331151]]
})
