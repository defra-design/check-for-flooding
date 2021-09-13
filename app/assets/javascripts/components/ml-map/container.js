import { Map } from 'maplibre-gl'

window.flood.maps.MLMapContainer = function MLMapContainer (mapId, options) {
  const containerElement = document.createElement('div')
  containerElement.id = mapId
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-labelledby', 'mapLabel')
  document.body.appendChild(containerElement)

  const map = new Map({
    container: containerElement.id,
    minZoom: 6,
    maxZoom: 18,
    style: options.style,
    maxBounds: options.bounds,
    attributionControl: false,
    interactive: false
  })
  this.map = map
}
