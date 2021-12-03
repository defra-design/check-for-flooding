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

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr',
    centre: window.flood.model.centroid,
    zoom: 14,
    selectedId: `stations.${window.flood.model.id}`
  })
}

// Add tooltips
const tooltips = document.querySelectorAll('[data-tooltip]')
if (tooltips) {
  window.flood.createTooltips()
}

// Chart
const chart = document.querySelector('.defra-line-chart')
if (chart) {
  // If javascript is enabled make content visible to all but assitive technology
  // var figure = chart.parentNode
  chart.setAttribute('aria-hidden', true)
  chart.removeAttribute('hidden')
  // Create line chart instance
  const lineChart = window.flood.charts.createLineChart('line-chart', {
    now: new Date(),
    observed: window.flood.model.telemetry,
    forecast: [],
    plotNegativeValues: false,
    type: window.flood.model.type
  })
  if (Object.keys(lineChart).length) {
    if (window.flood.utils.getParameterByName('t')) {
      // Find threshold in model
      const thresholdId = window.flood.utils.getParameterByName('t')
      let matchedThresholds = []
      window.flood.model.thresholds.forEach(function (threshold) {
        matchedThresholds = matchedThresholds.concat(threshold.values.filter(function (value) {
          return (value.id.toString() === thresholdId)
        }))
      })
      const threshold = matchedThresholds[0]
      lineChart.addThreshold({
        id: threshold.id,
        level: threshold.value,
        name: threshold.shortname
      })
    } else {
      const typical = document.querySelector('.defra-flood-impact-list__value[data-id="pc5"]:last-child')
      if (typical) {
        lineChart.addThreshold({
          id: typical.getAttribute('data-id'),
          level: Number(typical.getAttribute('data-level')),
          name: typical.getAttribute('data-name')
        })
      }
    }
    // Add threshold buttons
    Array.from(document.querySelectorAll('.defra-flood-impact-list__value')).forEach(value => {
      const button = document.createElement('button')
      button.innerHTML = 'Show on chart<span class="govuk-visually-hidden"> (Visual only)</span>'
      button.className = 'defra-button-text-s'
      button.addEventListener('click', function (e) {
        lineChart.addThreshold({
          id: value.getAttribute('data-id'),
          level: Number(value.getAttribute('data-level')),
          name: value.getAttribute('data-name')
        })
        // Scroll viewport to chart
        const offsetTop = chart.getBoundingClientRect().top + window.pageYOffset
        window.scrollTo(0, offsetTop)
      })
      const action = value.querySelector('.defra-flood-impact-list__action')
      if (action) {
        action.appendChild(button)
      }
    })
  }
}
