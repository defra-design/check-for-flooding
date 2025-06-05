import { formatDay, formatDate } from './dates'

const DEFAULT_BOUNDS = [-5.75447, 49.93027, 1.799683, 55.84093]
const TARGET_AREAS = ['inactive', 'removed', 'alert', 'warning', 'severe']
const FEATURE_ZOOM = 12

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

const addLiveSources = (map) => {
  // GeoJSON sources
  map.addSource('warning-polygons', {
    type: 'geojson',
    data: {type: 'FeatureCollection', features: []} // Empty source, setData on ready and moveend
  })
  map.addSource('warning-centroids', {
    type: 'geojson',
    data: '/service/geojson/warning-centroids'
  })
  map.addSource('station-centroids', {
    type: 'geojson',
    data: '/service/geojson/stations'
  })
}

const addLiveLayers = (map) => {
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
    minzoom: FEATURE_ZOOM
  }, position)

  map.addLayer({
    id: 'stations',
    type: 'symbol',
    source: 'station-centroids',
    layout: {
      'icon-image': ['concat', ['get', 'category'], '-', ['get', 'state']],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'state'],
        'high', 5,
        'wet', 4,
        'normal', 3,
        'dry', 2,
        1
      ]
    },
    minzoom: 12
  })

  map.addLayer({
    id: 'stations-small',
    type: 'symbol',
    source: 'station-centroids',
    layout: {
      'icon-image': ['concat', 'station-', ['match', ['get', 'state'],
        'high', 'alert',
        'wet', 'normal',
        'normal', 'normal',
        'dry', 'low',
        'low', 'low',
        'error'
      ]],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'state'],
        'high', 5,
        'wet', 4,
        'normal', 3,
        'dry', 2,
        1
      ]
    },
    maxzoom: 12
  })

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
    maxzoom: FEATURE_ZOOM
  })
}

const toggleLiveVisibility = (map, detail) => {
  // Toggle layers
  map.setLayoutProperty('warning-fill', 'visibility', 'visible')
  map.setLayoutProperty('warning-symbol', 'visibility', 'visible')
  map.setLayoutProperty('stations', 'visibility', 'visible')
  map.setLayoutProperty('stations-small', 'visibility', 'visible')
  // Filter features
  const layers = (Object.keys(queryMap).filter(k => detail.layers?.includes(queryMap[k])))
  map.setFilter('warning-fill', ['match', ['get', 'state'], layers.length ? layers : '', true, false])
  map.setFilter('warning-symbol', ['match', ['get', 'state'], layers.length ? layers : '', true, false])
  map.setFilter('stations', ['match', ['get', 'category'], layers.length ? layers : '', true, false])
  map.setFilter('stations-small', ['match', ['get', 'category'], layers.length ? layers : '', true, false])
}

const addOutlookSource = (map) => {
  map.addSource('outlook', {
    type: 'geojson',
    data: '/service/geojson/outlook'
  })
}

const addOutlookLayer = (map) => {
  const position = map.getLayer('small settlement names')
    ? 'small settlement names'
    : map.getLayer('Road labels')
      ? 'Road labels'
      : null

  map.addLayer({
    id: 'outlook',
    type: 'fill',
    source: 'outlook',
    paint: {
      'fill-color': ['match',
        ['get', 'risk-level'],
        4,
        '#d4351c',
        3,
        '#f47738',
        2,
        '#ffdd00',
        '#00703c'
      ],
      'fill-opacity': 0.75
    },
    filter: ['==', 'id', '']
  }, position)
}

const toggleOutlookVisibility = (map, detail) => {
  // Filter features
  const day = detail.segments.filter(s => ['d1', 'd2', 'd3', 'd4', 'd5'].includes(s)).map(s => s.charAt(1))[0] || ''
  map.setFilter('outlook', ['==', ['get', `is-day-${day}`], true])
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
  rainfall: 'ra',
  day1: 'd1',
  day2: 'd2',
  day3: 'd3',
  day4: 'd4',
  day5: 'd5',
}

const createInfo = (props) => {
  let html
  let label
  if (TARGET_AREAS.includes(props.state)) {
    label = props.name.replace(/^(Flood (warning|alert)( removed)? for)/, '<span class="defra-info-caption">$1</span>')
    html = `
      <p class="govuk-body-s">Issued: ${props.date}</p>
    `
  }
  if (!TARGET_AREAS.includes(props.state)) {
    html = `
      <p class="govuk-body-s">Station body</p>
    `
  }

  return {
    featureId: props.id || undefined,
    width: '360px',
    label: label || props.name,
    html
  }
}

export const createLiveMap = (mapId, options = {}) => {
  // One live map per page
  console.log(options)
  let map, bounds
  const { btnText, extent, centre, zoom, layers, selectedFeature } = options
  const isStationLegend = ['ri','se','gr','ra'].some(l => layers.includes(l))

  const info = selectedFeature?.id ? createInfo(selectedFeature) : null

  const setData = () => {
    if (map.getZoom() >= FEATURE_ZOOM && !isBoundsWithin(map.getBounds(), bounds)) {
      bounds = map.getBounds()
      map.getSource('warning-polygons')?.setData('/service/geojson/warning-polygons')
    }
  }

  const fm = new defra.FloodMap(mapId, {
    behaviour: 'buttonFirst',
    buttonText: btnText,
    // place: 'Carlisle',
    symbols,
    transformRequest: createTileRequest(() => map),
    zoom: zoom || undefined,
    minZoom: 5,
    maxZoom: 18,
    bounds: extent || DEFAULT_BOUNDS || undefined,
    center: centre || undefined,
    maxBounds: [-5.719993, 49.955638, 1.794689, 55.825973],
    info,
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
      title: 'Live flood risk',
      width: '360px',
      display: 'inset',
      isVisible: true,
      // isPersistInUrl: true,
      key: [
        {
          heading: 'Flood warnings and alerts',
          layout: 'column',
          minZoom: FEATURE_ZOOM,
          isHidden: isStationLegend,
          items: [
            {
              id: queryMap.severe,
              label: 'Severe',
              fill: '#811418',
              isSelected: layers.includes(queryMap.severe)
            },
            {
              id: queryMap.warning,
              label: 'Warning',
              fill: '#E54048',
              isSelected: layers.includes(queryMap.warning)
            },
            {
              id: queryMap.alert,
              label: 'Alert',
              fill: '#F09D3E',
              isSelected: layers.includes(queryMap.alert)
            },
            {
              id: queryMap.removed,
              label: 'Removed',
              fill: '#778C9D',
              isSelected: layers.includes(queryMap.removed)
            }
          ]
        },
        {
          heading: 'Flood warnings and alerts',
          layout: 'column',
          maxZoom: FEATURE_ZOOM,
          isHidden: isStationLegend,
          items: [
            {
              id: queryMap.severe,
              label: 'Severe',
              icon: symbols[0],
              isSelected: layers.includes(queryMap.severe)
            },
            {
              id: queryMap.warning,
              label: 'Warning',
              icon: symbols[1],
              isSelected: layers.includes(queryMap.warning)
            },
            {
              id: queryMap.alert,
              label: 'Alert',
              icon: symbols[2],
              isSelected: layers.includes(queryMap.alert)
            },
            {
              id: queryMap.removed,
              label: 'Removed',
              icon: symbols[3],
              isSelected: layers.includes(queryMap.removed)
            }
          ]
        },
        {
          heading: 'Water level measuring stations',
          layout: 'column',
          isHidden: !isStationLegend,
          items: [
            {
              id: queryMap.river,
              label: 'River',
              icon: symbols[5],
              isSelected: layers.includes(queryMap.river)
            },
            {
              id: queryMap.sea,
              label: 'Sea',
              icon: symbols[7],
              isSelected: layers.includes(queryMap.sea)
            },
            {
              id: queryMap.groundwater,
              label: 'Groundwater',
              icon: symbols[10],
              isSelected: layers.includes(queryMap.groundwater)
            },
            {
              id: queryMap.rainfall,
              label: 'Rainfall',
              icon: symbols[12],
              isSelected: layers.includes(queryMap.rainfall)
            }
          ]
        }
      ]
    },
    queryFeature: {
      layers: ['warning-fill', 'warning-symbol', 'stations', 'stations-small']
    }
  }, (provider) => {
    // This callback is run within the component immediately after the MapLibre map has been instatiated
    const { map } = provider

    // Call GeoJSON source with new bbox on map move end if zoom is greater than layer minzoom
    map.on('moveend', () => setData(map))
  })

  fm.addEventListener('ready', e => {
    bounds = null // Need to reset
    map = fm.map
    addLiveSources(map)
    setData() // Conditionally set polygon data
    addLiveLayers(map, e.detail.style)
    toggleLiveVisibility(map, e.detail)
  })

  // Listen for segments, layers or style changes
  fm.addEventListener('change', e => {
    if (e.detail.type === 'style') {
      addLiveSources(map)
      setData() // Conditionally set polygon data
      addLiveLayers(fm.map, e.detail.style)
    }
    toggleLiveVisibility(fm.map, e.detail)
  })

  // Listen to map queries
  fm.addEventListener('query', e => {
    // Show info panel for feature query
    if (e.detail.resultType === 'feature') {
      const feature = e.detail.features.items[0]
      fm.setInfo(createInfo(feature))
    }

    // Hide info panel and clear selected feature
    if (!e.detail.resultType) {
      fm.setInfo(null)
    }
  })
}

export const createOutlookMap = (mapId, options = {}) => {
  const { btnText, extent, days } = options
  const DEFAULT_BOUNDS = [-5.75447, 49.93027, 1.799683, 55.84093]

  const items = days.map((day, i) => { return {
    id: queryMap[`day${i + 1}`],
    label: `<strong>${formatDay(new Date(day.date))}</strong>${formatDate(new Date(day.date))}`
  }})

  const fm = new defra.FloodMap(mapId, {
    behaviour: 'buttonFirst',
    buttonText: btnText,
    // place: 'Carlisle',
    symbols,
    transformRequest: createTileRequest(() => map),
    minZoom: 6,
    maxZoom: 9,
    bounds: extent || DEFAULT_BOUNDS,
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
      title: '5 day flood forecast',
      width: '360px',
      display: 'inset',
      isVisible: true,
      isPersistInUrl: true,
      segments: [
        {
          display: 'segmented',
          items
        }
      ],
      key: [
        {
          heading: 'Risk areas',
          layout: 'column',
          display: 'ramp',
          items: [
            {
              label: 'Very low',
              fill: '#00703c'
            },
            {
              label: 'Low',
              fill: '#ffdd00'
            },
            {
              label: 'Medium',
              fill: '#f47738'
            },
            {
              label: 'High',
              fill: '#d4351c'
            }
          ]
        },
      ]
    },
    queryFeature: {
      layers: ['outlook']
    }
  }, (provider) => {
    // Call GeoJSON source with new bbox on map move end if zoom is greater than layer minzoom
    const { map } = provider
    map.on('moveend', () => setData(map))
  })

  fm.addEventListener('ready', e => {
    map = fm.map
    addOutlookSource(map)
    addOutlookLayer(map, e.detail.style)
    toggleOutlookVisibility(map, e.detail)
  })

  // Listen for segments, layers or style changes
  fm.addEventListener('change', e => {
    if (e.detail.type === 'style') {
      addOutlookSource(map)
      addOutlookLayer(fm.map, e.detail.style)
    }
    toggleOutlookVisibility(fm.map, e.detail)
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
