class ViewModel {
  constructor (query, place, places, river, rivers, levels, isPost = false) {
    this.searchType = 'placeAndRiver'
    this.queryTerm = query.term || query.river || query.place ? decodeURI(query.term || query.river || query.place) : ''
    this.queryType = query.river ? 'river' : (query.place ? 'place' : '')
    this.queryFilters = query.filters
    this.bbox = !isPost && levels ? levels.bbox : []
    this.place = place
    this.places = places
    this.river = river
    this.rivers = rivers
    this.levels = levels
    // Results
    this.isSinglePlace = isPost && places.length === 1 && !rivers.length
    this.isSingleRiver = isPost && rivers.length === 1 && !places.length
    this.isMultipleMatch = isPost && (places.length + rivers.length) > 1
    this.isNoResults = isPost && place && !places.length && !rivers.length
    // Errors
    this.isErrorEmpty = isPost && !query.term
    this.isErrorLocation = isPost && query.term && !place
    this.isErrorPostcode = isPost && places.length > 1 && (places.filter(place => place.type === 'postcode').length === places.length)
    this.isError = this.isErrorEmpty || this.isErrorLocation || this.isErrorPostcode
  }
}
module.exports = ViewModel
