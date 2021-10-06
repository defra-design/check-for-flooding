class ViewModel {
  constructor (queryTerm, place, warnings) {
    this.searchType = 'placeOnly'
    this.queryTerm = queryTerm
    this.bbox = place.bbox || []
    this.place = place
    this.warnings = warnings
  }
}
module.exports = ViewModel
