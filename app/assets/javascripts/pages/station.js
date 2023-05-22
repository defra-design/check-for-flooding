'use strict'
import '../utils'
import '../components/line-chart'
import '../components/toggle-list-display'
import '../components/toggletip'

// Toggletips
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

// Toggle historical impacts
const toggleListDisplay = document.getElementById('toggle-list-display')
if (toggleListDisplay) {
  window.flood.createToggleListDisplay(toggleListDisplay, {
    type: 'impact',
    btnText: 'historical events'
  })
}
