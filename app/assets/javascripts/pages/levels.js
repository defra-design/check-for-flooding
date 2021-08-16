'use strict'
import 'elm-pep'
import '../core'
import '../components/filter'

const filter = document.getElementById('filter')
if (filter) {
  window.flood.createFilter(filter)
}
