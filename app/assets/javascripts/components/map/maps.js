'use strict'
/*
  Intialises the window.flood.maps object with extent and center
*/
// import { transform, transformExtent } from 'ol/proj'

window.flood.maps = {

  // // Extent of England and Wales
  // extent: transformExtent([
  //   -5.75447,
  //   49.93027,
  //   1.799683,
  //   55.84093
  // ], 'EPSG:4326', 'EPSG:3857'),

  // // A large extent that allows restricting but full map view
  // extentLarge: transformExtent([
  //   -15.75447,
  //   46.93027,
  //   10.799683,
  //   58.84093
  // ], 'EPSG:4326', 'EPSG:3857'),

  // Centre of England and Wales (approx)
  // bounds: [46.93027, -15.75447, 58.84093, 10.799683],
  extent: [-5.719993, 49.955638, 1.794689, 55.825973],
  // bounds: [[46.93027, -15.75447], [58.84093, 10.799683]],
  centre: [-1.4758, 52.9219],

  // // Set a map extent from a array of lonLat's
  // setExtentFromLonLat: (map, extent, padding = 0) => {
  //   padding = [padding, padding, padding, padding]
  //   extent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
  //   map.getView().fit(extent, { constrainResolution: false, padding: padding })
  // },

  // // Get array of lonLat's from an extent object
  // getLonLatFromExtent: (extent) => {
  //   extent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
  //   const ext = extent.map(x => { return parseFloat(x.toFixed(6)) })
  //   return ext
  // }

  // Get array of lonLat's from a bounds object with 6 decimal places
  getExtentFromBounds: (bounds) => {
    return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
      .map(x => Math.round(x * 1000000) / 1000000)
  },

  // Set a map extent from a array of lonLat's
  fitBoundsFromExtent: (map, extent, padding = 0) => {
    padding = { top: padding, bottom: padding, left: padding, right: padding }
    map.fitBounds(extent, {
      padding: padding,
      duration: 250
    })
  },

  // Convert an extent array to numbers with 6 decimal places
  cleanExtent: (extent) => {
    return extent.map(x => Math.round(Number(x) * 1000000) / 1000000)
  }
}
