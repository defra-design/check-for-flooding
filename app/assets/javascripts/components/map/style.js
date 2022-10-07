'use strict'
/*
Sets up the window.flood.maps styles objects
*/
// const bingApiKey = process.env.BING_API_KEY

window.flood.maps.style = {
  source: {
    aerial: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']
      // tiles: [`http://dev.virtualearth.net/REST/V1/Imagery/Metadata/AerialWithLabelsOnDemand?output=json&include=ImageryProviders&key=${bingApiKey}`]
      // tiles: ['http://ak.dynamic.t0.tiles.virtualearth.net/comp/ch/{quadkey}?mkt=en-gb&it=A,G,L&og=1944&n=z&dpi=d1']

    },
    polygons: {
      type: 'vector',
      tiles: [`${window.location.origin}/service/vector-tiles/{z}/{x}/{y}.pbf`],
      maxzoom: 12,
      promoteId: 'id'
    },
    warnings: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      promoteId: 'id'
    },
    stations: {
      type: 'geojson',
      data: `${window.location.origin}/service/geojson/stations`,
      promoteId: 'id'
    },
    selected: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    }
  },
  aerial: {
    id: 'aerial',
    type: 'raster',
    source: 'aerial',
    layout: {
      visibility: 'none'
    }
  },
  'target-areas': {
    id: 'target-areas',
    source: 'polygons',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': ['case',
        ['in', ['get', 'id'], ''], '#E3000F',
        ['in', ['get', 'id'], ''], '#E3000F',
        ['in', ['get', 'id'], ''], '#F18700',
        '#6F777B'
      ]
    },
    filter: ['in', ['get', 'id'], ''],
    minzoom: 10
  },
  'target-areas-selected': {
    id: 'target-areas-selected',
    source: 'polygons',
    'source-layer': 'targetareas',
    type: 'line',
    paint: {
      'line-color': '#ffdd00',
      'line-width': 3
    },
    filter: ['in', ['get', 'id'], ''],
    minzoom: 10
  },
  warnings: {
    id: 'warnings',
    source: 'warnings',
    type: 'symbol',
    layout: {
      'icon-image': ['concat', ['get', 'state'], ['get', 'selected']],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'state'],
        'severe', 3,
        'warning', 2,
        'alert', 1,
        1
      ]
    },
    maxzoom: 10
  },
  stations: {
    id: 'stations',
    source: 'stations',
    type: 'symbol',
    layout: {
      'icon-image': ['step', ['zoom'],
        ['concat', 'level-', ['get', 'state'], ['get', 'selected']], 10,
        ['concat', ['get', 'type'], '-', ['get', 'state'], ['get', 'selected']]
      ],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'state'],
        'withrisk', 4,
        'default', 3,
        'norisk', 2,
        'error', 1,
        1
      ]
    }
  },
  rivers: {
    id: 'rivers',
    source: 'polygons',
    'source-layer': 'rivers',
    type: 'line',
    paint: {
      'line-color': '#1d70b8',
      'line-width': 3
    },
    filter: ['in', ['get', 'id'], '']
  },
  selected: {
    id: 'selected',
    source: 'selected',
    type: 'symbol',
    layout: {
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true
    }
  }
  // selected: {
  //   id: 'selected',
  //   source: 'selected',
  //   type: 'circle',
  //   paint: {
  //     'circle-radius': 20,
  //     'circle-color': 'yellow'
  //   }
  // }
}
