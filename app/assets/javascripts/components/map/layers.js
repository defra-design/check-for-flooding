'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer, VectorImage, VectorTile as VectorTileLayer } from 'ol/layer'
import { BingMaps, XYZ, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source'
import Feature from 'ol/Feature'
import { GeoJSON, MVT } from 'ol/format'

//
// Vector source
//

window.flood.maps.layers = {

  //
  // Tile layers
  //

  topography: () => {
    return new TileLayer({
      ref: 'road',
      source: new BingMaps({
        key: 'AtbOHVZK_YNqr1Cu_FIB39nZ8Uq9XPB-RmLjk6cxJwRW3I0J3kkDZ_5qQaiMu6H-' + '&c4w=1&cstl=rd&src=h&st=me|lv:0_trs|v:0_pt|v:0',
        imagerySet: 'RoadOnDemand',
        hidpi: true
      }),
      visible: false,
      zIndex: 0
    })
  },

  // Bing maps road
  road: () => {
    return new TileLayer({
      ref: 'road',
      // source: new BingMaps({
      //   key: window.flood.model.bingApiKey,
      //   imagerySet: 'RoadOnDemand',
      //   hidpi: true
      // }),
      source: new XYZ({
        url: 'https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=4flNisK69QG6w6NGkDZ4CZz0CObcUA5h',
        attributions: `Contains OS data &copy; Crown copyright and database rights ${(new Date()).getFullYear()}`
      }),
      visible: false,
      zIndex: 0
    })
  },

  // Bing maps aerial
  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      source: new BingMaps({
        key: window.flood.model.bingApiKey,
        imagerySet: 'AerialWithLabelsOnDemand',
        hidpi: true
      }),
      visible: false,
      zIndex: 0
    })
  },

  //
  // Vector tile layers
  //

  vectorTilePolygons: () => {
    return new VectorTileLayer({
      ref: 'polygons',
      source: new VectorTileSource({
        format: new MVT({
          idProperty: 'id',
          featureClass: Feature
        }),
        url: '/tiles/target-areas/{z}/{x}/{y}.pbf',
        maxZoom: 12
      }),
      // renderMode: 'hybrid',
      renderMode: 'vector',
      extent: window.flood.maps.extent,
      style: window.flood.maps.styles.vectorTilePolygons,
      zIndex: 1
    })
  },

  //
  // Vector layers
  //

  places: () => {
    return new VectorLayer({
      ref: 'places',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/places'
      }),
      style: window.flood.maps.styles.places,
      visible: true,
      zIndex: 5,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      renderMode: 'hybrid'
    })
  },

  warnings: () => {
    return new VectorLayer({
      ref: 'warnings',
      featureCodes: 'ts, tw, ta, tr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/warnings'
      }),
      style: window.flood.maps.styles.warnings,
      visible: false,
      zIndex: 5
    })
  },

  river: () => {
    return new VectorLayer({
      ref: 'river',
      featureCodes: 'ri',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/river'
      }),
      style: window.flood.maps.styles.stations,
      visible: false,
      zIndex: 4
    })
  },

  tide: () => {
    return new VectorLayer({
      ref: 'tide',
      featureCodes: 'ti',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/tide'
      }),
      style: window.flood.maps.styles.stations,
      visible: false,
      zIndex: 4
    })
  },

  groundwater: () => {
    return new VectorLayer({
      ref: 'groundwater',
      featureCodes: 'gr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/groundwater'
      }),
      style: window.flood.maps.styles.stations,
      visible: false,
      zIndex: 4
    })
  },

  rainfall: () => {
    return new VectorLayer({
      ref: 'rainfall',
      featureCodes: 'rf',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/rainfall'
      }),
      style: window.flood.maps.styles.stations,
      visible: false,
      zIndex: 3
    })
  },

  areasOfConcern: () => {
    return new VectorImage({
      ref: 'areasOfConcern',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/outlook'
      }),
      renderMode: 'hybrid',
      style: window.flood.maps.styles.outlookPolygons,
      opacity: 0.6,
      zIndex: 4
    })
  },

  selected: () => {
    return new VectorLayer({
      ref: 'selected',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857'
      }),
      zIndex: 10
    })
  },

  labels: () => {
    return new VectorLayer({
      ref: 'labels',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857'
      }),
      style: window.flood.maps.styles.labels,
      visible: false,
      zIndex: 11,
      declutter: true
    })
  }

  //
  // WebGL layers
  //

  // warnings: () => {
  //   return new WebGLPointsLayer({
  //     ref: 'warnings',
  //     featureCodes: 'ts, tw, ta, tr',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       // url: '/api/warnings.geojson'
  //       url: '/service/warnings-geojson'
  //     }),
  //     style: window.flood.maps.styles.warningsJSON,
  //     visible: false,
  //     zIndex: 4
  //   })
  // },

  // stations: () => {
  //   return new WebGLPointsLayer({
  //     ref: 'stations',
  //     featureCodes: 'ri, ti, gr',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       // url: '/api/stations.geojson'
  //       url: '/service/stations-geojson'
  //     }),
  //     style: window.flood.maps.styles.measurementsJSON,
  //     visible: false,
  //     zIndex: 3
  //   })
  // },

  // rainfall: () => {
  //   return new WebGLPointsLayer({
  //     ref: 'rainfall',
  //     featureCodes: 'rf',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       // url: '/api/rainfall.geojson'
  //       url: '/service/rainfall-geojson'
  //     }),
  //     style: window.flood.maps.styles.measurementsJSON,
  //     visible: false,
  //     zIndex: 2
  //   })
  // }

}
