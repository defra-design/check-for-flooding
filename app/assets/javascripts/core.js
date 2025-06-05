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

    // Toggle keyboard focus
    window.addEventListener('focusin', (e) => {
      e.target.setAttribute('keyboard-focus', '')
    })

    window.addEventListener('focusout', (e) => {
      e.target.removeAttribute('keyboard-focus')
    })

    // Initialise live map
    if (document.getElementById('map-live')) {
      createLiveMap('map-live', {
        btnText: model.mapButtonText,
        btnType: model.mapButtonType || null,
        layers: model.mapLayers,
        extent: model.extent || null,
        centre: model.centre || null,
        zoom: model.zoom || null,
        selectedFeature: model.selectedFeature
      })
    }

    // Initialise outlook map
    if (document.getElementById('map-outlook')) {
      createOutlookMap('map-outlook', {
        btnText: 'View map showing flood risk areas',
        days: model.outlookDays,
        extent: model.extent
      })
    }
 
    // Add category tabs progressive enhancement
    if (document.getElementById('filter')) {
      window.flood.createLevelsTable('filter')
    }
  }
})
