'use strict'
/*
Initialises the window.flood.maps layers
*/
// WebGL
import { Vector as VectorLayer, VectorImage, VectorTile as VectorTileLayer } from 'ol/layer'
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import TileLayer from 'ol/layer/WebGLTile'
// Canvas
// import { Vector as VectorLayer, VectorImage, VectorTile as VectorTileLayer, Tile as TileLayer } from 'ol/layer'
import { BingMaps, XYZ, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source'
import Feature from 'ol/Feature'
import { GeoJSON, MVT } from 'ol/format'
const bingApiKey = process.env.BING_API_KEY
const osApiKey = process.env.OS_API_KEY

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
      className: 'defra-map-bg-canvas',
      source: new BingMaps({
        key: `${bingApiKey}&c4w=1&cstl=rd&src=h&st=me|lv:0_trs|v:0_pt|v:0`,
        imagerySet: 'RoadOnDemand',
        hidpi: true
      }),
      visible: false,
      zIndex: 0
    })
  },

  // Default base map
  road: () => {
    return new TileLayer({
      ref: 'road',
      className: 'defra-map-bg-canvas',
      // source: new BingMaps({
      //   key: bingApiKey,
      //   imagerySet: 'RoadOnDemand'
      //   hidpi: true
      // }),
      source: new XYZ({
        url: `https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=${osApiKey}`,
        attributions: `Contains OS data<br/>&copy; Crown copyright and database rights ${(new Date()).getFullYear()}`
      }),
      extent: window.flood.maps.extent,
      visible: false,
      zIndex: 0
    })
  },

  // Bing maps aerial
  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      className: 'defra-map-bg-canvas',
      source: new BingMaps({
        key: bingApiKey,
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

  vectorTiles: () => {
    return new VectorTileLayer({
      ref: 'vectorTiles',
      className: 'defra-map-vt-layer', // Needs custom class to fix zIndex issue introduced with declutter
      source: new VectorTileSource({
        format: new MVT({
          idProperty: 'id',
          featureClass: Feature
        }),
        url: '/tiles/target-areas/{z}/{x}/{y}.pbf',
        maxZoom: 12
      }),
      declutter: true,
      renderMode: 'vector',
      extent: window.flood.maps.extent,
      style: window.flood.maps.styles.vectorTiles,
      zIndex: 1
    })
  },

  //
  // Vector layers
  //

  places: () => {
    return new VectorLayer({
      ref: 'places',
      className: 'defra-map-vl-layer',
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

  // warnings: () => {
  //   return new VectorLayer({
  //     ref: 'warnings',
  //     featureCodes: 'ts, tw, ta, tr',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/service/geojson/warnings'
  //     }),
  //     style: window.flood.maps.styles.warnings,
  //     visible: false,
  //     zIndex: 5
  //   })
  // },

  // river: () => {
  //   return new VectorLayer({
  //     ref: 'river',
  //     featureCodes: 'ri',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/service/geojson/river'
  //     }),
  //     style: window.flood.maps.styles.stations,
  //     visible: false,
  //     zIndex: 4
  //   })
  // },

  // sea: () => {
  //   return new VectorLayer({
  //     ref: 'sea',
  //     featureCodes: 'se',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/service/geojson/sea'
  //     }),
  //     style: window.flood.maps.styles.stations,
  //     visible: false,
  //     zIndex: 4
  //   })
  // },

  // groundwater: () => {
  //   return new VectorLayer({
  //     ref: 'groundwater',
  //     featureCodes: 'gr',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/service/geojson/groundwater'
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
  //       url: '/service/geojson/rainfall'
  //     }),
  //     style: window.flood.maps.styles.stations,
  //     visible: false,
  //     zIndex: 3
  //   })
  // },

  //
  // WebGL layers
  //

  warnings: () => {
    return new WebGLPointsLayer({
      ref: 'warnings',
      className: 'defra-map-webgl-layer',
      featureCodes: 'ts, tw, ta, tr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/warnings'
      }),
      style: window.flood.maps.styles.warningsJSON,
      visible: false,
      zIndex: 6
    })
  },

  river: () => {
    return new WebGLPointsLayer({
      ref: 'river',
      className: 'defra-map-webgl-layer',
      featureCodes: 'ri',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/river'
      }),
      style: window.flood.maps.styles.stationsJSON,
      visible: false,
      zIndex: 5
    })
  },

  sea: () => {
    return new WebGLPointsLayer({
      ref: 'sea',
      className: 'defra-map-webgl-layer',
      featureCodes: 'se',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/sea'
      }),
      style: window.flood.maps.styles.stationsJSON,
      visible: false,
      zIndex: 4
    })
  },

  groundwater: () => {
    return new WebGLPointsLayer({
      ref: 'groundwater',
      className: 'defra-map-webgl-layer',
      featureCodes: 'gr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/groundwater'
      }),
      style: window.flood.maps.styles.stationsJSON,
      visible: false,
      zIndex: 3
    })
  },

  rainfall: () => {
    return new WebGLPointsLayer({
      ref: 'rainfall',
      className: 'defra-map-webgl-layer',
      featureCodes: 'rf',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/service/geojson/rainfall'
      }),
      style: window.flood.maps.styles.stationsJSON,
      visible: false,
      zIndex: 2
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
}
