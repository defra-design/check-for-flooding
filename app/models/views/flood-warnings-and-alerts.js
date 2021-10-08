class ViewModel {
  constructor (queryTerm, place, places, warnings) {
    this.searchType = 'placeOnly'
    this.queryTerm = queryTerm
    this.place = place
    this.bbox = place ? place.bbox : []
    this.places = places || []
    this.warnings = warnings
    // Results
    this.isSingleMatch = queryTerm && !place && places.length === 1
    this.isMultipleMatch = queryTerm && !place && places.length > 1
    this.isNoResults = queryTerm && warnings && !warnings.groups.length
    // Errors
    this.isErrorLocation = queryTerm && !place && !places.length
    this.isErrorPostcode = queryTerm && !place && places.length > 1 && places.filter(p => p.type === 'postcode').length === places.length
  }
}
module.exports = ViewModel
