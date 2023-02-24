'use strict'
import 'elm-pep'
import { SkipLink, ErrorSummary, Button } from 'govuk-frontend'
import './utils'
import './build/templates'
import './components/nunjucks'
import './components/map/maps'
import './components/map/styles'
import './components/map/layers'
import './components/map/container'
import './components/map/live'
import './components/map/outlook'

// Init GOVUK Frontend
document.onreadystatechange = () => {
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

    // Create LiveMap
    if (document.getElementById('map-live')) {
      window.flood.maps.createLiveMap('map-live', {
        btnText: window.flood.model.mapButtonText,
        btnClass: window.flood.model.mapButtonClass,
        btnType: window.flood.model.mapButtonType || null,
        layers: window.flood.model.mapLayers,
        extent: window.flood.model.extent || null,
        riverId: window.flood.model.riverId || null,
        centre: window.flood.model.centre || null,
        zoom: window.flood.model.zoom || null,
        selectedId: window.flood.model.selectedId || null
      })
    }

    // Create Outlook Map
    if (document.getElementById('map-outlook')) {
      window.flood.maps.createOutlookMap('map-outlook', {
        btnText: 'View map showing flood risk areas',
        btnClass: 'defra-button-secondary defra-button-secondary--icon',
        days: window.flood.model.outlookDays
      })
    }
  }
}
