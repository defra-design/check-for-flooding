'use strict'
/*
Initialises the window.flood.maps layers
*/
// import { Feature } from 'ol'
import { Map as MbMap } from 'mapbox-gl'
import { Tile as TileLayer, Vector as VectorLayer, VectorImage, VectorTile as VectorTileLayer, Layer } from 'ol/layer'
import { BingMaps, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source' // XYZ
// import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import { GeoJSON, MVT } from 'ol/format'
import { toLonLat } from 'ol/proj'

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
        imagerySet: 'RoadOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  // Bing maps
  // road: () => {
  //   return new TileLayer({
  //     ref: 'road',
  //     source: new BingMaps({
  //       key: window.flood.model.bingMaps,
  //       imagerySet: 'RoadOnDemand'
  //     })
  //   })
  // },

  // OS Raster
  // road: () => {
  //   return new TileLayer({
  //     ref: 'road',
  //     source: new XYZ({
  //       url: 'https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=4flNisK69QG6w6NGkDZ4CZz0CObcUA5h',
  //       attributions: '&copy; Crown copyright and database rights OS 2021'
  //     }),
  //     visible: false,
  //     zIndex: 0
  //   })
  // },

  // Mapbox map (Vector tiles with WebGL rendering)
  road: () => {
    const mbMap = new MbMap({
      style: 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-outdoor/style.json',
      // style: 'https://api.os.uk/maps/vector/v1/vts/resources/styles?key=4flNisK69QG6w6NGkDZ4CZz0CObcUA5h',
      attributionControl: false,
      boxZoom: false,
      container: 'viewport',
      center: [0, 0],
      doubleClickZoom: false,
      dragPan: false,
      dragRotate: false,
      interactive: false,
      keyboard: false,
      pitchWithRotate: false,
      scrollZoom: false,
      touchZoomRotate: false
      // transformRequest: url => {
      //   url += '&srs=3857'
      //   return {
      //     url: url
      //   }
      // }
    })
    return new Layer({
      render: (frameState) => {
        const canvas = mbMap.getCanvas()
        const viewState = frameState.viewState
        mbMap.jumpTo({
          center: toLonLat(viewState.center),
          zoom: viewState.zoom - 1,
          animate: false
        })
        // cancel the scheduled update & trigger synchronous redraw
        // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
        // NOTE: THIS MIGHT BREAK WHEN UPDATING MAPBOX
        if (mbMap._frame) {
          mbMap._frame.cancel()
          mbMap._frame = null
        }
        mbMap._render()
        // Remove unecessaary attributes
        canvas.removeAttribute('tabindex')
        canvas.removeAttribute('role')
        canvas.removeAttribute('aria-label')
        canvas.removeAttribute('style')
        return canvas
      }
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
          idProperty: 'fws_tacode'
        }),
        url: '/tiles/target-areas/{z}/{x}/{y}.pbf',
        maxZoom: 13
      }),
      // renderMode: 'hybrid',
      renderMode: 'vector',
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

  warnings: () => {
    return new VectorLayer({
      ref: 'warnings',
      featureCodes: 'ts, tw, ta, tr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        // url: '/api/warnings.geojson'
        url: '/service/warnings-geojson'
      }),
      style: window.flood.maps.styles.warnings,
      visible: false,
      zIndex: 5
    })
  },

  stations: () => {
    return new VectorLayer({
      ref: 'stations',
      featureCodes: 'ri, ti, gr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        // url: '/api/stations.geojson'
        url: '/service/stations-geojson'
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
        // url: '/api/rainfall.geojson'
        url: '/service/rainfall-geojson'
      }),
      style: window.flood.maps.styles.rainfall,
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
