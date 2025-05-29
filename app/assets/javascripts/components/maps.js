const isBoundsWithin = (inner, outer) => {
  if (!(inner && outer)) {
    return false
  }

  const innerSW = inner.getSouthWest()
  const innerNE = inner.getNorthEast()
  const outerSW = outer.getSouthWest()
  const outerNE = outer.getNorthEast()

  const isWithin =
    innerSW.lng >= outerSW.lng &&
    innerSW.lat >= outerSW.lat &&
    innerNE.lng <= outerNE.lng &&
    innerNE.lat <= outerNE.lat

  return isWithin
}

const createTileRequest = (getMap) => { // Factory function to pass a reference to the map instance
  return (url, resourceType) => {
    const headers = {}

    if (resourceType === 'Source' && url.includes('/service/geojson/warning-polygons')) {
      const map = getMap()
      const bounds = map.getBounds()
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',')
      url += `?bbox=${bbox}`
    }

    return {
      url, headers
    }
  }
}

const addSources = (map) => {
  // GeoJSON sources
  map.addSource('warning-polygons', {
    type: 'geojson',
    data: '/service/geojson/warning-polygons'
  })
  map.addSource('warning-centroids', {
    type: 'geojson',
    data: '/service/geojson/warning-centroids'
  })
  // map.addSource('station-centroids', {
  //   type: 'geojson',
  //   data: process.env.CFF_STATION_CENTROIDS
  // })
  // map.addSource('rainfall-centroids', {
  //   type: 'geojson',
  //   data: process.env.CFF_RAINFALL_CENTROIDS
  // })
}

const addLayers = (map, basemap) => {
  const position = map.getLayer('small settlement names')
    ? 'small settlement names'
    : map.getLayer('Road labels')
      ? 'Road labels'
      : null

  map.addLayer({
    id: 'warning-fill',
    type: 'fill',
    source: 'warning-polygons',
    layout: {
      visibility: 'none',
      // 'fill-sort-key': ['match', ['get', 'state'],
      //   'severe', 4,
      //   'warning', 3,
      //   'alert', 2,
      //   1
      // ]
    },
    paint: {
      'fill-color': ['match',
        ['get', 'state'],
        'severe',
        '#8c1419',
        'warning',
        '#e84952',
        'alert',
        '#f2A747',
        '#8297A7'
      ],
      'fill-opacity': 0.75
    },
    minzoom: 12
  }, position)

  // map.addLayer({
  //   id: 'stations',
  //   type: 'symbol',
  //   source: 'station-centroids',
  //   layout: {
  //     'icon-image': ['concat', ['get', 'category'], '-', ['get', 'state']],
  //     'icon-size': 0.5,
  //     'icon-allow-overlap': true,
  //     'icon-ignore-placement': true,
  //     'symbol-z-order': 'source',
  //     'symbol-sort-key': ['match', ['get', 'state'],
  //       'high', 5,
  //       'wet', 4,
  //       'normal', 3,
  //       'dry', 2,
  //       1
  //     ]
  //   },
  //   minzoom: 12
  // })

  // map.addLayer({
  //   id: 'stations-small',
  //   type: 'symbol',
  //   source: 'station-centroids',
  //   layout: {
  //     'icon-image': ['concat', 'station-', ['match', ['get', 'state'],
  //       'high', 'alert',
  //       'wet', 'normal',
  //       'normal', 'normal',
  //       'dry', 'low',
  //       'low', 'low',
  //       'error'
  //     ]],
  //     'icon-size': 0.5,
  //     'icon-allow-overlap': true,
  //     'icon-ignore-placement': true,
  //     'symbol-z-order': 'source',
  //     'symbol-sort-key': ['match', ['get', 'state'],
  //       'high', 5,
  //       'wet', 4,
  //       'normal', 3,
  //       'dry', 2,
  //       1
  //     ]
  //   },
  //   maxzoom: 12
  // })

  map.addLayer({
    id: 'warning-symbol',
    type: 'symbol',
    source: 'warning-centroids',
    layout: {
      'icon-image': ['get', 'state'],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'state'],
        'severe', 4,
        'warning', 3,
        'alert', 2,
        1
      ]
    },
    maxzoom: 12
  })
}

const toggleVisibility = (map, detail) => {
  // Toggle layers
  map.setLayoutProperty('warning-fill', 'visibility', 'visible')
  map.setLayoutProperty('warning-symbol', 'visibility', 'visible')
  // map.setLayoutProperty('stations', 'visibility', detail.segments.includes('li') ? 'visible' : 'none')
  // map.setLayoutProperty('stations-small', 'visibility', detail.segments.includes('li') ? 'visible' : 'none')
  // Filter features
  const layers = (Object.keys(queryMap).filter(k => detail.layers?.includes(queryMap[k])))
  map.setFilter('warning-fill', ['match', ['get', 'state'], layers.length ? layers : '', true, false])
  map.setFilter('warning-symbol', ['match', ['get', 'state'], layers.length ? layers : '', true, false])
  // map.setFilter('stations', ['match', ['get', 'category'], layers.length ? layers : '', true, false])
  // map.setFilter('stations-small', ['match', ['get', 'category'], layers.length ? layers : '', true, false])
}

const toggleSelected = (map, id = '') => {
  map.setFilter('warning-fill-selected', ['==', 'id', id])
  map.setFilter('warning-symbol-selected', ['==', 'id', id])
  // map.setFilter('stations-selected', ['==', 'id', id])
  // map.setFilter('stations-small-selected', ['==', 'id', id])
}

const symbols = [
  'severe',
  'warning',
  'alert',
  'removed',
  'river-high',
  'river-normal',
  'river-error',
  'sea-normal',
  'sea-error',
  'groundwater-high',
  'groundwater-normal',
  'groundwater-error',
  'rainfall-wet',
  'rainfall-dry',
  'rainfall-error',
  'station-alert',
  'station-normal',
  'station-low',
  'station-error'
].map(s => `/public/images/symbols/${s}.svg`)

const queryMap = {
  severe: 'ts',
  warning: 'tw',
  alert: 'ta',
  removed: 'tr',
  river: 'ri',
  sea: 'se',
  groundwater: 'gr',
  rainfall: 'ra'
}

let map, bounds

export const createLiveMap = (mapId, options = {}) => {
  const { btnText, extent, centre, zoom } = options
  console.log(options)

  const fm = new defra.FloodMap(mapId, {
    behaviour: 'buttonFirst',
    buttonText: btnText,
    // place: 'Carlisle',
    symbols,
    transformRequest: createTileRequest(() => map),
    zoom: zoom || undefined,
    minZoom: 5,
    maxZoom: 18,
    bounds: extent || undefined,
    center: centre || undefined,
    maxBounds: [-5.719993, 49.955638, 1.794689, 55.825973],
    styles: [{
      name: 'default',
      attribution: `Contains OS data ${String.fromCharCode(169)} Crown copyright and database rights ${(new Date()).getFullYear()}`,
      url: process.env.DEFAULT_URL
    }, {
      name: 'dark',
      attribution: 'Test',
      url: process.env.DARK_URL
    },{
      name: 'aerial',
      url: process.env.AERIAL_URL,
      logo: null
    },{
      name: 'deuteranopia',
      attribution: 'Test',
      url: process.env.DEUTERANOPIA_URL
    },{
      name: 'tritanopia',
      attribution: 'Test',
      url: process.env.TRITANOPIA_URL
    }],
    legend: {
      title: 'Menu',
      width: '360px',
      display: 'inset',
      isVisible: true,
      keyDisplay: 'min', // 'all'
      isPersistInUrl: true,
      key: [
        {
          heading: 'Flood warnings and alerts',
          layout: 'column',
          minZoom: 12,
          items: [
            {
              id: queryMap.severe,
              label: 'Severe',
              fill: '#811418',
              isSelected: true
            },
            {
              id: queryMap.warning,
              label: 'Warning',
              fill: '#E54048',
              isSelected: true
            },
            {
              id: queryMap.alert,
              label: 'Alert',
              fill: '#F09D3E',
              isSelected: true
            },
            {
              id: queryMap.removed,
              label: 'Removed',
              fill: '#778C9D'
            }
          ]
        },
        {
          heading: 'Flood warnings and alerts',
          layout: 'column',
          maxZoom: 12,
          items: [
            {
              id: queryMap.severe,
              label: 'Severe',
              icon: symbols[0],
              isSelected: true
            },
            {
              id: queryMap.warning,
              label: 'Warning',
              icon: symbols[1]
            },
            {
              id: queryMap.alert,
              label: 'Alert',
              icon: symbols[2]
            },
            {
              id: queryMap.removed,
              label: 'Removed',
              icon: symbols[3]
            }
          ]
        },
        {
          heading: 'Water level measuring stations',
          layout: 'column',
          items: [
            {
              id: queryMap.river,
              label: 'River',
              icon: symbols[5]
            },
            {
              id: queryMap.sea,
              label: 'Sea',
              icon: symbols[7]
            },
            {
              id: queryMap.groundwater,
              label: 'Groundwater',
              icon: symbols[10]
            },
            {
              id: queryMap.rainfall,
              label: 'Rainfall',
              icon: symbols[12]
            }
          ]
        }
      ]
    },
    queryFeature: {
      layers: ['warning-fill', 'warning-symbol']
    }
  }, (provider) => {
    // Call GeoJSON source with new bbox on map move end if zoom is greater than layer minzoom
    const { map } = provider
    map.on('moveend', () => {
      if (map.getZoom() >= 12 && !isBoundsWithin(map.getBounds(), bounds)) {
        bounds = map.getBounds()
        map.getSource('warning-polygons')?.setData('/service/geojson/warning-polygons')
      }
    })
  })

  fm.addEventListener('ready', e => {
    map = fm.map

    addSources(map)
    addLayers(map, e.detail.style)
    toggleVisibility(map, e.detail)
  })

  // Listen for segments, layers or style changes
  fm.addEventListener('change', e => {
    if (e.detail.type === 'style') {
      addSources(map)
      addLayers(fm.map, e.detail.style)
    }
    toggleVisibility(fm.map, e.detail)
  })

  // Listen to map queries
  fm.addEventListener('query', e => {
    // Show info panel for feature query
    if (e.detail.resultType === 'feature') {
      const feature = e.detail.features.items[0]
      fm.setInfo({
        width: '360px',
        label: feature.name,
        html: `<p class="govuk-body-s">id: ${feature.id}</p>`
      })
    }

    // Hide info panel and clear selected feature
    if (!e.detail.resultType) {
      fm.setInfo(null)
    }
  })
}

export const createOutlookMap = (mapId, options = {}) => {
  console.log('Creating outlook map')
}
