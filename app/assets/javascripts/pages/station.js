'use strict'
import 'elm-pep'
import '../core'
import '../components/line-chart'
import '../components/toggle-list-display'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/tooltip'
import '../components/toggletip'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'Map',
    btnClasses: 'defra-link-icon-s',
    layers: 'mv,ri,se,gr,rl',
    centre: window.flood.model.centroid,
    zoom: 14,
    riverId: window.flood.model.riverId,
    selectedId: `s${window.flood.model.rloiId}`
  })
}

// Add toggle historical impacts
const toggleListDisplay = document.getElementById('toggle-list-display')
if (toggleListDisplay) {
  window.flood.createToggleListDisplay(toggleListDisplay, {
    type: 'impact',
    btnText: 'historical events'
  })
}

// Add toggletips
if (document.querySelectorAll('[data-toggletip]')) {
  window.flood.createToggletips({ type: 'i' })
}

// Line chart
if (document.getElementById('line-chart')) {
  const lineChart = window.flood.charts.createLineChart('line-chart', window.flood.model.id, window.flood.model.telemetry)
  const thresholdId = `threshold-${window.flood.model.id}-high`
  const threshold = document.querySelector(`[data-id="${thresholdId}"]`)
  if (threshold) {
    lineChart.addThreshold({
      id: thresholdId,
      name: threshold.getAttribute('data-name'),
      level: Number(threshold.getAttribute('data-level'))
    })
  }
}
