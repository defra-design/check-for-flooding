'use strict'
import '../utils'
import '../components/bar-chart'
import '../components/toggletip'

// Bar chart
if (document.getElementById('bar-chart')) {
  window.flood.charts.createBarChart('bar-chart', window.flood.model.stationId, window.flood.model.telemetry)
}

// Toggletips
if (document.querySelectorAll('.defra-toggletip')) {
  window.flood.createToggletips({
    type: 'i'
  })
}
