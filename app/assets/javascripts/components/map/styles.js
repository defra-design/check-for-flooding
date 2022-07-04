'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke, Text, Circle } from 'ol/style'
const { getParameterByName } = window.flood.utils

const maps = window.flood.maps

window.flood.maps.styles = {

  //
  // Vector styles live
  //

  vectorTilePolygons: (feature, resolution) => {
    // Use corresposnding warning feature propeties for styling
    const warningsSource = maps.warningsSource
    const featureId = feature.getId()
    const featureLayer = feature.get('layer')
    if (warningsSource && featureLayer === 'targetareas') {
      const warning = warningsSource.getFeatureById(featureId)
      if (!warning || !warning.get('isVisible') || resolution >= maps.liveMaxBigZoom) { return new Style() }
      const alpha = Math.floor(resolution) <= 20 ? Math.floor(resolution) <= 10 ? 0.2 : 0.6 : 1
      const severity = warning.get('severity')
      const isSelected = warning.get('isSelected')
      const isGroundwater = warning.getId().substring(6, 9) === 'FAG'

      // Defaults
      let strokeColour = 'transparent'
      let fillColour = 'transparent'
      let zIndex = 1

      switch (severity) {
        case 1: // Severe warning
          strokeColour = '#D4351C'
          fillColour = targetAreaPolygonPattern('severe', alpha)
          zIndex = 11
          break
        case 2: // Warning
          strokeColour = '#D4351C'
          fillColour = targetAreaPolygonPattern('warning', alpha)
          zIndex = 10
          break
        case 3: // Alert
          strokeColour = '#F47738'
          fillColour = targetAreaPolygonPattern('alert', alpha)
          zIndex = isGroundwater ? 4 : 7
          break
        default: // Removed or inactive
          strokeColour = '#626A6E'
          fillColour = targetAreaPolygonPattern('removed', alpha)
          zIndex = 1
      }
      zIndex = isSelected ? zIndex + 2 : zIndex

      const selectedStroke = new Style({ stroke: new Stroke({ color: '#FFDD00', width: 16 }), zIndex: zIndex })
      const stroke = new Style({ stroke: new Stroke({ color: strokeColour, width: 2 }), zIndex: zIndex })
      const fill = new Style({ fill: new Fill({ color: fillColour }), zIndex: zIndex })

      return isSelected ? [selectedStroke, stroke, fill] : [stroke, fill]
    } else if (featureLayer === 'hydrologicalboundaries') {
      const showCatchments = getParameterByName('lyr') && getParameterByName('lyr').toLowerCase().includes('ct')
      if (!showCatchments) return
      return new Style({
        stroke: new Stroke({ color: '#1d70b8', width: 1 }),
        // fill: new Fill({ color: 'rgba(29, 112, 184, 0.2)' }),
        fill: new Fill({ color: 'transparent' }),
        zIndex: 1
      })
    } else if (featureLayer === 'rivers' && maps.selectedRiver) {
      if (feature.get('slug') !== maps.selectedRiver) return
      return new Style({
        stroke: new Stroke({ color: '#1d70b8', width: 3 }),
        // fill: new Fill({ color: 'rgba(29, 112, 184, 0.2)' }),
        fill: new Fill({ color: 'transparent' }),
        zIndex: 1
      })
    }
  },

  warnings: (feature, resolution) => {
    // Hide warning symbols or hide when polygon is shown
    if (!feature.get('isVisible') || resolution < maps.liveMaxBigZoom) {
      return
    }
    const severity = feature.get('severity')
    const isSelected = feature.get('isSelected')
    switch (severity) {
      case 1: // Severe warning
        return isSelected ? styleCache.severeSelected : styleCache.severe
      case 2: // Warning
        return isSelected ? styleCache.warningSelected : styleCache.warning
      case 3: // Alert
        return isSelected ? styleCache.alertSelected : styleCache.alert
      default: // Removed or inactive
        return isSelected ? styleCache.targetAreaSelected : styleCache.targetArea
    }
  },

  stations: (feature, resolution) => {
    if (feature.get('isVisible') === false) return
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const isSymbol = resolution <= maps.liveMaxBigZoom
    // If a river station is selected hide all station not on the river
    if (maps.selectedRiver && feature.get('riverSlug') !== maps.selectedRiver) return
    switch (state) {
      // Rivers
      case 'river':
        return isSelected ? (isSymbol ? styleCache.riverSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.river : styleCache.measurement)
      case 'riverHigh':
        return isSelected ? (isSymbol ? styleCache.riverHighSelected : styleCache.measurementAlertSelected) : (isSymbol ? styleCache.riverHigh : styleCache.measurementAlert)
      case 'riverError':
        return isSelected ? (isSymbol ? styleCache.riverErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.riverError : styleCache.measurementError)
      // Tide
      case 'tide':
        return isSelected ? (isSymbol ? styleCache.tideSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.tide : styleCache.measurement)
      case 'tideError':
        return isSelected ? (isSymbol ? styleCache.tideErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.tideError : styleCache.measurementError)
      // Ground
      case 'groundHigh':
        return isSelected ? (isSymbol ? styleCache.groundHighSelected : styleCache.measurementAlertSelected) : (isSymbol ? styleCache.groundHigh : styleCache.measurementAlert)
      case 'groundError':
        return isSelected ? (isSymbol ? styleCache.groundErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.groundError : styleCache.measurementError)
      case 'ground':
        return isSelected ? (isSymbol ? styleCache.groundSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.ground : styleCache.measurement)
      // Rainfall
      case 'rain':
        return isSelected ? (isSymbol ? styleCache.rainSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.rain : styleCache.measurement)
      case 'rainDry':
        return isSelected ? (isSymbol ? styleCache.rainDrySelected : styleCache.measurementNoneSelected) : (isSymbol ? styleCache.rainDry : styleCache.measurementNone)
    }
  },

  //
  // Vector styles outlook
  //

  outlookPolygons: (feature) => {
    if (!feature.get('isVisible')) { return }
    const zIndex = feature.get('z-index')
    const lineDash = [2, 3]
    let strokeColour = '#85994b'
    let fillColour = outlookPolygonPattern('veryLow')
    if (feature.get('risk-level') === 2) {
      strokeColour = '#ffdd00'
      fillColour = outlookPolygonPattern('low')
    } else if (feature.get('risk-level') === 3) {
      strokeColour = '#F47738'
      fillColour = outlookPolygonPattern('medium')
    } else if (feature.get('risk-level') === 4) {
      strokeColour = '#D4351C'
      fillColour = outlookPolygonPattern('high')
    }
    const isSelected = feature.get('isSelected')
    const selectedStroke = new Style({ stroke: new Stroke({ color: '#FFDD00', width: 16 }), zIndex: zIndex })
    const style = new Style({
      stroke: new Stroke({ color: strokeColour, width: 1 }),
      fill: new Fill({ color: fillColour }),
      lineDash: lineDash,
      zIndex: zIndex
    })
    return isSelected ? [selectedStroke, style] : style
  },

  labels: (feature, resolution) => {
    let offsetY = resolution >= maps.liveMaxBigZoom ? 30 : 35
    if (feature.get('type') === 'TA') {
      offsetY = resolution >= maps.liveMaxBigZoom ? 37 : 0
    }
    return new Style({
      text: new Text({
        font: 'Bold 16px GDS Transport, Arial, sans-serif',
        text: feature.getId().toString(),
        offsetY: -Math.abs(offsetY)
      }),
      zIndex: feature.get('type') === 'warning' ? 0 : 1,
      image: new Icon({
        src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"%3E%3Cpath d="M1,4c0,-1.656 1.344,-3 3,-3c-0,0 22,0 22,0c1.656,0 3,1.344 3,3l-0,22c-0,1.649 -1.334,2.99 -2.981,3l-22.019,0c-1.656,0 -3,-1.344 -3,-3l0,-22Z" style="fill:%23fff;stroke:%23000;stroke-width:2px;"/%3E%3Cpath d="M29,25c0,1.656 -1.344,3 -3,3l-22,0c-1.656,0 -3,-1.344 -3,-3" style="fill:none;stroke:%23000;stroke-width:2px;"/%3E%3C/svg%3E%0A',
        size: [30, 30],
        anchorYUnits: 'pixels',
        anchor: [0.5, offsetY + 15],
        offset: [0, 0],
        scale: 1
      })
    })
  },

  places: (feature, resolution) => {
    // Hide places that are not appropriate for resolution
    const d = parseInt(feature.get('d'))
    const s = parseInt(feature.get('s'))
    const r = parseInt(resolution)
    let showName = d >= 1
    if (r > 1600 && d > 1) {
      showName = false
    } else if (r > 800 && d > 2) {
      showName = false
    } else if (r > 400 && d > 3) {
      showName = false
    } else if (d > 4) {
      showName = false
    }
    if (!showName) {
      return
    }
    // Get appropriate style from cache and set text
    const textStyle = s === 1 ? styleCache.textLarge : styleCache.text
    textStyle[0].getText().setText(feature.get('n'))
    textStyle[1].getText().setText(feature.get('n'))
    return textStyle
  }
}

//
// SVG fill paterns
//

const targetAreaPolygonPattern = (type, alpha) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (type) {
    case 'severe':
      ctx.fillStyle = `rgba(212, 52, 28, ${alpha})` // '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})` // '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'warning':
      ctx.fillStyle = `rgba(212, 52, 28, ${alpha})` // '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})` // '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'alert':
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})` // '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = `rgb(244, 119, 56, ${alpha})` // '#F47738'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'removed':
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})` // '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = `rgb(98, 106, 110, ${alpha})` // '#626A6E'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

const outlookPolygonPattern = (style) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'high':
      ctx.fillStyle = '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'medium':
      ctx.fillStyle = '#F47738'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'low':
      ctx.fillStyle = '#ffdd00'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'veryLow':
      ctx.fillStyle = '#85994b'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

//
// Style caching, improves render performance
//

const createTextStyle = (options) => {
  const defaults = {
    font: '14px GDS Transport, Arial, sans-serif',
    offsetY: -12,
    radius: 2
  }
  options = Object.assign({}, defaults, options)
  return [
    new Style({
      text: new Text({
        font: options.font,
        offsetY: options.offsetY,
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    }),
    new Style({
      text: new Text({
        font: options.font,
        offsetY: options.offsetY
      }),
      image: new Circle({
        fill: new Fill({
          color: '#0b0c0c'
        }),
        stroke: new Stroke({
          width: 0
        }),
        radius: options.radius
      })
    })
  ]
}

const createIconStyle = (options) => {
  const defaults = {
    size: [100, 100],
    anchor: [0.5, 0.5],
    offset: [0, 0],
    scale: 0.5,
    zIndex: 1
  }
  options = Object.assign({}, defaults, options)
  return new Style({
    image: new Icon({
      src: '/public/images/map-symbols-2x.png',
      size: options.size,
      anchor: options.anchor,
      offset: options.offset,
      scale: options.scale
    }),
    zIndex: options.zIndex
  })
}

const styleCache = {
  severe: createIconStyle({ offset: [0, 0], zIndex: 5 }),
  severeSelected: createIconStyle({ offset: [100, 0], zIndex: 10 }),
  warning: createIconStyle({ offset: [0, 100], zIndex: 4 }),
  warningSelected: createIconStyle({ offset: [100, 100], zIndex: 10 }),
  alert: createIconStyle({ offset: [0, 200], zIndex: 3 }),
  alertSelected: createIconStyle({ offset: [100, 200], zIndex: 10 }),
  targetArea: createIconStyle({ offset: [0, 300], zIndex: 1 }),
  targetAreaSelected: createIconStyle({ offset: [100, 300], zIndex: 10 }),
  // River
  river: createIconStyle({ offset: [0, 600], zIndex: 2 }),
  riverSelected: createIconStyle({ offset: [100, 600], zIndex: 10 }),
  riverHigh: createIconStyle({ offset: [0, 500], zIndex: 3 }),
  riverHighSelected: createIconStyle({ offset: [100, 500], zIndex: 10 }),
  riverError: createIconStyle({ offset: [0, 700], zIndex: 1 }),
  riverErrorSelected: createIconStyle({ offset: [100, 700], zIndex: 10 }),
  // Tide
  tide: createIconStyle({ offset: [0, 800], zIndex: 2 }),
  tideSelected: createIconStyle({ offset: [100, 800], zIndex: 10 }),
  tideError: createIconStyle({ offset: [0, 900], zIndex: 1 }),
  tideErrorSelected: createIconStyle({ offset: [100, 900], zIndex: 10 }),
  // Groundwater
  ground: createIconStyle({ offset: [0, 1100], zIndex: 2 }),
  groundSelected: createIconStyle({ offset: [100, 1100], zIndex: 10 }),
  groundHigh: createIconStyle({ offset: [0, 1000], zIndex: 3 }),
  groundHighSelected: createIconStyle({ offset: [100, 1000], zIndex: 10 }),
  groundError: createIconStyle({ offset: [0, 1200], zIndex: 1 }),
  groundErrorSelected: createIconStyle({ offset: [100, 1200], zIndex: 10 }),
  // Rainfall
  rain: createIconStyle({ offset: [0, 1300], zIndex: 3 }),
  rainSelected: createIconStyle({ offset: [100, 1300], zIndex: 10 }),
  rainDry: createIconStyle({ offset: [0, 1400], zIndex: 3 }),
  rainDrySelected: createIconStyle({ offset: [100, 1400], zIndex: 10 }),
  // Measurements
  measurementAlert: createIconStyle({ offset: [0, 1600], zIndex: 3 }),
  measurementAlertSelected: createIconStyle({ offset: [100, 1600], zIndex: 10 }),
  measurement: createIconStyle({ offset: [0, 1700], zIndex: 2 }),
  measurementSelected: createIconStyle({ offset: [100, 1700], zIndex: 10 }),
  measurementError: createIconStyle({ offset: [0, 1800], zIndex: 1 }),
  measurementErrorSelected: createIconStyle({ offset: [100, 1800], zIndex: 10 }),
  measurementNone: createIconStyle({ offset: [0, 1900], zIndex: 1 }),
  measurementNoneSelected: createIconStyle({ offset: [100, 1900], zIndex: 10 }),
  text: createTextStyle(),
  textLarge: createTextStyle({ font: 'Bold 16px GDS Transport, Arial, sans-serif', offsetY: -13, radius: 3 })
}
