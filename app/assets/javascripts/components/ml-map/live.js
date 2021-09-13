const maps = window.flood.maps
const MLMapContainer = maps.MLMapContainer

function LiveMLMap (mapId, options) {
  options.style = 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-outdoor/style.json'
  const container = new MLMapContainer(mapId, options)
  const map = container.map
  map.addSource('target-areas', {
    type: 'vector',
    tiles: ['/tiles/target-areas/{z}/{x}/{y}.pbf']
  })
  map.addLayer({
    id: 'target-areas', // Layer ID
    type: 'polygon',
    source: 'target-areas', // ID of the tile source created above
    // Source has several layers. We visualize the one with name 'sequence'.
    'source-layer': 'sequence',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-opacity': 0.6,
      'line-color': 'rgb(53, 175, 109)',
      'line-width': 2
    }
  })
  map.fitBounds([[-3.110958, 54.791515], [-2.753690, 55.010296]], { duration: 0 })
}

maps.createLiveMLMap = (mapId, options = {}) => {
  return new LiveMLMap(mapId, options)
}
