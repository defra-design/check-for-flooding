'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer, VectorImage, VectorTile as VectorTileLayer } from 'ol/layer'
import { BingMaps, XYZ, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source'
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import { GeoJSON, MVT } from 'ol/format'

// const { xhr } = window.flood.utils

//
// Vector source
//

// const targetAreaPolygonsSource = new VectorSource({
//   format: new GeoJSON(),
//   projection: 'EPSG:3857',
//   // Custom loader to only send get request if below resolution cutoff
//   loader: (extent, resolution) => {
//     if (resolution < window.flood.maps.liveMaxBigZoom) {
//       xhr(`/api/ows?service=wfs&version=2.0.0&request=getFeature&typename=flood:flood_warning_alert&outputFormat=application/json&srsname=EPSG:3857&bbox=${extent.join(',')},EPSG:3857`, (err, json) => {
//         if (err) {
//           console.log('Error: ' + err)
//         } else {
//           targetAreaPolygonsSource.addFeatures(new GeoJSON().readFeatures(json))
//         }
//       })
//     }
//   },
//   // Custom strategy to only return extent if below resolution cutoff
//   strategy: (extent, resolution) => {
//     return resolution < window.flood.maps.liveMaxBigZoom ? [extent] : [[0, 0, 0, 0]]
//   }
// })

window.flood.maps.layers = {

  //
  // Tile layers
  //

  topography: () => {
    return new TileLayer({
      ref: 'road',
      source: new BingMaps({
        key: 'AtbOHVZK_YNqr1Cu_FIB39nZ8Uq9XPB-RmLjk6cxJwRW3I0J3kkDZ_5qQaiMu6H-' + '&c4w=1&cstl=rd&src=h&st=me|lv:0_trs|v:0_pt|v:0',
        imagerySet: 'RoadOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  road: () => {
    return new TileLayer({
      ref: 'road',
      // source: new BingMaps({
      //   key: window.flood.model.bingMaps,
      //   imagerySet: 'RoadOnDemand'
      // }),
      // source: new OSM(),
      source: new XYZ({
        url: 'https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=4flNisK69QG6w6NGkDZ4CZz0CObcUA5h'
      }),
      visible: false,
      zIndex: 0
    })
  },

  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      source: new BingMaps({
        key: window.flood.model.bingMaps,
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  //
  // Vector tile layers
  //

  targetAreaPolygons: () => {
    return new VectorTileLayer({
      ref: 'targetAreaPolygons',
      source: new VectorTileSource({
        format: new MVT({
          idProperty: 'id'
        }),
        url: '/tiles/target-areas/{z}/{x}/{y}.pbf'
      }),
      // renderMode: 'hybrid',
      extent: window.flood.maps.extent,
      style: window.flood.maps.styles.targetAreaPolygons,
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
        url: '/api/places.geojson'
      }),
      style: window.flood.maps.styles.places,
      visible: true,
      zIndex: 5,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      renderMode: 'hybrid'
    })
  },

  // targetAreaPolygons: () => {
  //   return new VectorLayer({
  //     ref: 'targetAreaPolygons',
  //     source: targetAreaPolygonsSource,
  //     style: window.flood.maps.styles.targetAreaPolygons,
  //     visible: false,
  //     zIndex: 2
  //   })
  // },

  // warnings: () => {
  //   return new VectorLayer({
  //     ref: 'warnings',
  //     featureCodes: 'ts, tw, ta, tr',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/api/warnings.geojson'
  //     }),
  //     style: window.flood.maps.styles.warnings,
  //     visible: false,
  //     zIndex: 5
  //   })
  // },

  // stations: () => {
  //   return new VectorLayer({
  //     ref: 'stations',
  //     featureCodes: 'ri, ti, gr',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/api/stations.geojson'
  //     }),
  //     style: window.flood.maps.styles.stations,
  //     visible: false,
  //     zIndex: 4
  //   })
  // },

  // rainfall: () => {
  //   return new VectorLayer({
  //     ref: 'rainfall',
  //     featureCodes: 'rf',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/api/rainfall.geojson'
  //     }),
  //     style: window.flood.maps.styles.rainfall,
  //     visible: false,
  //     zIndex: 3
  //   })
  // },

  areasOfConcern: () => {
    return new VectorImage({
      ref: 'areasOfConcern',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/outlook.geojson'
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

  //
  // WebGL layers
  //

  warnings: () => {
    return new WebGLPointsLayer({
      ref: 'warnings',
      featureCodes: 'ts, tw, ta, tr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        // url: '/api/warnings.geojson'
        url: '/service/warnings-geojson'
      }),
      style: window.flood.maps.styles.warningsJSON,
      visible: false,
      zIndex: 4
    })
  },

  stations: () => {
    return new WebGLPointsLayer({
      ref: 'stations',
      featureCodes: 'ri, ti, gr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        // url: '/api/stations.geojson'
        url: '/service/stations-geojson'
      }),
      style: window.flood.maps.styles.measurementsJSON,
      visible: false,
      zIndex: 3
    })
  },

  rainfall: () => {
    return new WebGLPointsLayer({
      ref: 'rainfall',
      featureCodes: 'rf',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        // url: '/api/rainfall.geojson'
        url: '/service/rainfall-geojson'
      }),
      style: window.flood.maps.styles.measurementsJSON,
      visible: false,
      zIndex: 2
    })
  }
}
