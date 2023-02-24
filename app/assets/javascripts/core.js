'use strict'
import 'elm-pep'
import { SkipLink, ErrorSummary, Button } from 'govuk-frontend'
import './utils'
import './build/templates'
import './components/nunjucks'
import './components/map/maps'
import './components/map/symbols'
import './components/map/style'
import './components/map/container'
import './components/map/live'

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
  }
}
