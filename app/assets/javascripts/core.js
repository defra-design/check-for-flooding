'use strict'
import 'elm-pep'
import { SkipLink, ErrorSummary, Button, Tabs } from 'govuk-frontend'
import './utils'
import './build/templates'
import './components/nunjucks'
import './components/map/maps'
import './components/map/styles'
import './components/map/layers'
import './components/map/container'
import './components/map/live'
import './components/map/outlook'
import './components/levels-table'

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {

    // Initialise govuk components
    const skipLink = document.querySelector('[data-module="govuk-skip-link"]')
    if (skipLink) {
      new SkipLink(skipLink).init()
    }
    const errorSummary = document.querySelector('[data-module="govuk-error-summary"]')
    if (errorSummary) {
      new ErrorSummary(errorSummary).init()
    }
    const button = document.querySelector('[data-module="govuk-button"]')
    if (button) {
      new Button(button).init()
    }
    const tabs = document.querySelector('[data-module="govuk-tabs"]')
    if (tabs) {
      new Tabs(tabs).init()
    }
    const model = window.flood.model

    // Initialise live map
    if (document.getElementById('map-live')) {
      window.flood.maps.createLiveMap('map-live', {
        btnText: model.mapButtonText,
        btnClass: model.mapButtonClass,
        btnType: model.mapButtonType || null,
        layers: model.mapLayers,
        extent: model.extent || null,
        riverId: model.riverId || null,
        centre: model.centre || null,
        zoom: model.zoom || null,
        selectedId: model.selectedId || null,
        targetArea: model.targetArea || null
      })
    }

    // Initialise outlook map
    if (document.getElementById('map-outlook')) {
      window.flood.maps.createOutlookMap('map-outlook', {
        btnText: 'View map showing flood risk areas',
        btnClass: 'defra-button-secondary',
        days: model.outlookDays
      })
    }
 
    // Add category tabs progressive enhancement
    if (document.getElementById('filter')) {
      window.flood.createLevelsTable('filter')
    }
  }
})
