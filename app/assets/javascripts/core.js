'use strict'
import 'elm-pep'
import { SkipLink, ErrorSummary, Button } from 'govuk-frontend'
import { createLiveMap, createOutlookMap } from './components/maps'
import './utils'
import './build/templates'
import './components/nunjucks'
import './components/levels-table'

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {

    // Initialise govuk components
    const skipLink = document.querySelector('[data-module="govuk-skip-link"]')
    if (skipLink) {
      new SkipLink(skipLink)
    }
    const errorSummary = document.querySelector('[data-module="govuk-error-summary"]')
    if (errorSummary) {
      new ErrorSummary(errorSummary)
    }
    const button = document.querySelector('[data-module="govuk-button"]')
    if (button) {
      new Button(button)
    }
    const model = window.flood.model

    // Initialise live map
    if (document.getElementById('map-live')) {
      createLiveMap('map-live', {
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
      createOutlookMap('map-outlook', {
        btnText: 'View map showing flood risk areas',
        btnClass: 'defra-button-secondary defra-button-secondary--icon',
        days: model.outlookDays
      })
    }
 
    // Add category tabs progressive enhancement
    if (document.getElementById('filter')) {
      window.flood.createLevelsTable('filter')
    }
  }
})
