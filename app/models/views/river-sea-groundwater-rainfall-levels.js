class ViewModel {
  constructor (query, place, river, levels) {
    this.searchType = 'placeAndRiver'
    this.queryTerm = query.term
    this.queryType = query.type
    this.bbox = levels.bbox || []
    this.place = place
    this.river = river
    this.levels = levels
  }
}
module.exports = ViewModel
